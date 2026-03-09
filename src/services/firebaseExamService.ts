import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeFirestoreData } from '../utils/sanitizeFirestoreData';
import { firebaseAnnouncementService } from './firebaseAnnouncementService';
import type {
  ExamResult,
  ExamSchedule,
  ExamTerm,
  MarksEntry,
  ReportCard,
} from '../types';

const EXAM_TERMS = 'examTerms';
const EXAM_SCHEDULES = 'examSchedules';
const MARKS_ENTRIES = 'marksEntries';
const EXAM_RESULTS = 'examResults';
const REPORT_CARDS = 'reportCards';

const toGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const toResult = (obtainedMarks: number, maxMarks: number, absent: boolean): 'pass' | 'fail' | 'absent' => {
  if (absent) return 'absent';
  return obtainedMarks >= maxMarks * 0.35 ? 'pass' : 'fail';
};

export const firebaseExamService = {
  getExamTerms: async (): Promise<ExamTerm[]> => {
    const snapshot = await getDocs(query(collection(db, EXAM_TERMS), orderBy('startDate', 'desc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ExamTerm[];
  },

  createExamTerm: async (payload: Omit<ExamTerm, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, EXAM_TERMS), sanitizeFirestoreData({
      ...payload,
      createdAt: Timestamp.now(),
    }));

    try {
      await firebaseAnnouncementService.addAnnouncement({
        title: `New Exam Cycle Created: ${payload.name}`,
        content: `${payload.name} (${payload.academicYear}) has been created with ${payload.examType.replace('-', ' ')} format. Schedule and marks entry will be shared soon.`,
        target: 'all',
        priority: 'medium',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
      });
    } catch (error) {
      // Non-blocking: exam setup should still succeed if announcement publish fails.
      console.warn('Exam term created but announcement publish failed:', error);
    }

    return docRef.id;
  },

  updateExamTerm: async (id: string, updates: Partial<ExamTerm>): Promise<void> => {
    await updateDoc(doc(db, EXAM_TERMS, id), sanitizeFirestoreData({
      ...updates,
      updatedAt: Timestamp.now(),
    }));
  },

  deleteExamTerm: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, EXAM_TERMS, id));
  },

  getExamSchedules: async (): Promise<ExamSchedule[]> => {
    const snapshot = await getDocs(query(collection(db, EXAM_SCHEDULES), orderBy('examDate', 'desc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ExamSchedule[];
  },

  createExamSchedule: async (payload: Omit<ExamSchedule, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, EXAM_SCHEDULES), sanitizeFirestoreData({
      ...payload,
      createdAt: Timestamp.now(),
    }));

    try {
      await firebaseAnnouncementService.addAnnouncement({
        title: `Exam Schedule Published: ${payload.examName}`,
        content: `${payload.examName} schedule for Class ${payload.className}-${payload.section} (${payload.subjectName}) is set for ${payload.examDate} at ${payload.startTime}.`,
        target: 'all',
        priority: 'medium',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
      });
    } catch (error) {
      // Non-blocking: schedule creation should still succeed if announcement publish fails.
      console.warn('Exam schedule created but announcement publish failed:', error);
    }

    return docRef.id;
  },

  deleteExamSchedule: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, EXAM_SCHEDULES, id));
  },

  getMarksEntries: async (examTermId: string, className: string, section: string, subjectCode: string): Promise<MarksEntry[]> => {
    const q = query(
      collection(db, MARKS_ENTRIES),
      where('examTermId', '==', examTermId),
      where('className', '==', className),
      where('section', '==', section),
      where('subjectCode', '==', subjectCode)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as MarksEntry[];
  },

  upsertMarksEntry: async (payload: Omit<MarksEntry, 'id'>): Promise<string> => {
    const percentage = payload.maxMarks > 0 ? (payload.obtainedMarks / payload.maxMarks) * 100 : 0;
    const grade = payload.absent ? 'AB' : toGrade(percentage);
    const result = toResult(payload.obtainedMarks, payload.maxMarks, payload.absent);

    const docId = `${payload.examTermId}_${payload.studentId}_${payload.subjectCode}`;
    await setDoc(doc(db, MARKS_ENTRIES, docId), sanitizeFirestoreData({
      ...payload,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      result,
      updatedAt: Timestamp.now(),
    }), { merge: true });

    return docId;
  },

  publishResults: async (examTermId: string, className?: string): Promise<number> => {
    const termSnapshot = await getDoc(doc(db, EXAM_TERMS, examTermId));
    const term = termSnapshot.exists() ? (termSnapshot.data() as ExamTerm) : undefined;

    let marksQuery = query(collection(db, MARKS_ENTRIES), where('examTermId', '==', examTermId));
    if (className) {
      marksQuery = query(marksQuery, where('className', '==', className));
    }

    const marksSnapshot = await getDocs(marksQuery);
    const marks = marksSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as MarksEntry[];

    const grouped = new Map<string, MarksEntry[]>();
    marks.forEach((entry) => {
      const key = `${entry.studentId}_${entry.className}_${entry.section}`;
      const current = grouped.get(key) || [];
      current.push(entry);
      grouped.set(key, current);
    });

    for (const [, entries] of grouped) {
      const student = entries[0];
      const totalSubjects = entries.length;
      const totalMaxMarks = entries.reduce((sum, e) => sum + e.maxMarks, 0);
      const totalObtainedMarks = entries.reduce((sum, e) => sum + e.obtainedMarks, 0);
      const overallPercentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;
      const overallGrade = toGrade(overallPercentage);
      const resultStatus: 'pass' | 'fail' = entries.some((e) => e.result === 'fail') ? 'fail' : 'pass';

      const resultId = `${examTermId}_${student.studentId}`;
      const resultPayload: Omit<ExamResult, 'id'> = {
        examTermId,
        className: student.className,
        section: student.section,
        studentId: student.studentId,
        studentName: student.studentName,
        rollNo: student.rollNo,
        totalSubjects,
        totalMaxMarks,
        totalObtainedMarks,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        overallGrade,
        resultStatus,
        published: true,
        publishedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, EXAM_RESULTS, resultId), sanitizeFirestoreData(resultPayload), { merge: true });

      const reportPayload: Omit<ReportCard, 'id'> = {
        examTermId,
        studentId: student.studentId,
        studentName: student.studentName,
        className: student.className,
        section: student.section,
        rollNo: student.rollNo,
        examName: term?.name || 'Exam',
        academicYear: term?.academicYear || '',
        subjects: entries.map((item) => ({
          subjectCode: item.subjectCode,
          subjectName: item.subjectName,
          maxMarks: item.maxMarks,
          obtainedMarks: item.obtainedMarks,
          grade: item.grade,
          result: item.result,
        })),
        totalMaxMarks,
        totalObtainedMarks,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        overallGrade,
        finalResult: resultStatus,
        generatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, REPORT_CARDS, `${examTermId}_${student.studentId}`), sanitizeFirestoreData(reportPayload), { merge: true });
    }

    await updateDoc(doc(db, EXAM_TERMS, examTermId), {
      status: 'published',
      updatedAt: Timestamp.now(),
    });

    // Auto-publish a global announcement after results are published.
    const scopeText = className ? ` for Class ${className}` : '';
    await firebaseAnnouncementService.addAnnouncement({
      title: `Exam Results Published: ${term?.name || 'Exam'}`,
      content: `Results for ${term?.name || 'the selected exam cycle'}${scopeText} have been published. Please check the report cards section for details.`,
      target: 'all',
      priority: 'high',
      date: new Date().toISOString().split('T')[0],
      author: 'Admin',
    });

    return grouped.size;
  },

  getExamResults: async (examTermId?: string): Promise<ExamResult[]> => {
    const q = examTermId
      ? query(collection(db, EXAM_RESULTS), where('examTermId', '==', examTermId))
      : query(collection(db, EXAM_RESULTS), orderBy('publishedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ExamResult[];
  },

  getReportCards: async (examTermId?: string): Promise<ReportCard[]> => {
    const q = examTermId
      ? query(collection(db, REPORT_CARDS), where('examTermId', '==', examTermId))
      : query(collection(db, REPORT_CARDS), orderBy('generatedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ReportCard[];
  },
};
