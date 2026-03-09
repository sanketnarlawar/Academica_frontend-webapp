import { useCallback, useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseExamService } from '../../services/firebaseExamService';
import { firebaseStudentService } from '../../services/firebaseStudentService';
import { firebaseSubjectService } from '../../services/firebaseSubjectService';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import type { ExamTerm, Student, Subject, Teacher } from '../../types';

interface DraftMark {
  studentId: string;
  obtainedMarks: number;
  absent: boolean;
}

interface CurrentUserShape {
  uid?: string;
  email?: string;
  role?: 'admin' | 'teacher' | 'student';
  name?: string;
  linkedEntityId?: string;
}

interface TeacherAssignments {
  classNames: string[];
  sectionsByClass: Record<string, string[]>;
}

const normalizeClassName = (value: string): string => value.replace(/^class\s*/i, '').trim();

export default function MarksEntryPage() {
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignments>({ classNames: [], sectionsByClass: {} });

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUserShape;
    } catch {
      return null;
    }
  }, []);

  const isTeacherRole = currentUser?.role === 'teacher';

  const [examTermId, setExamTermId] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');
  const [subjectCode, setSubjectCode] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [marks, setMarks] = useState<Record<string, DraftMark>>({});

  const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
      const [termRows, studentRows, subjectRows] = await Promise.all([
        firebaseExamService.getExamTerms(),
        firebaseStudentService.getStudents(),
        firebaseSubjectService.getSubjects(),
      ]);

      let matchedTeacher: Teacher | null = null;
      if (isTeacherRole) {
        const teacherRows = await firebaseTeacherService.getTeachers();
        matchedTeacher = teacherRows.find((t) => t.employeeId === currentUser?.linkedEntityId)
          || teacherRows.find((t) => t.email.toLowerCase() === (currentUser?.email || '').toLowerCase())
          || null;
      }

      const assignedSubjectSet = new Set((matchedTeacher?.subjects || []).map((s) => s.toLowerCase()));
      const assignedClassesRaw = matchedTeacher?.classes || [];
      const assignedClassNames = new Set(
        assignedClassesRaw.map((value) => normalizeClassName(value.split('-')[0]?.trim() || '')).filter((value) => !!value)
      );

      const assignedSectionsByClass = assignedClassesRaw.reduce<Record<string, Set<string>>>((acc, value) => {
        const [cls, sec] = value.split('-').map((v) => v.trim());
        const normalizedClass = normalizeClassName(cls || '');
        if (!normalizedClass) return acc;
        if (!acc[normalizedClass]) acc[normalizedClass] = new Set<string>();
        if (sec) acc[normalizedClass].add(sec);
        return acc;
      }, {});

      if (isTeacherRole) {
        const sectionsByClassRecord: Record<string, string[]> = {};
        Object.entries(assignedSectionsByClass).forEach(([cls, secSet]) => {
          sectionsByClassRecord[cls] = Array.from(secSet).sort();
        });

        setTeacherAssignments({
          classNames: Array.from(assignedClassNames).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          sectionsByClass: sectionsByClassRecord,
        });
      }

      const roleFilteredStudents = isTeacherRole
        ? studentRows.filter((s) => {
            const normalizedStudentClass = normalizeClassName(s.class);
            if (!assignedClassNames.has(normalizedStudentClass)) return false;
            const sections = assignedSectionsByClass[normalizedStudentClass];
            if (!sections || sections.size === 0) return true;
            return sections.has(s.section);
          })
        : studentRows;

      const roleFilteredSubjects = isTeacherRole
        ? subjectRows.filter((s) => assignedSubjectSet.has(s.name.toLowerCase()) || assignedSubjectSet.has(s.code.toLowerCase()))
        : subjectRows;

      setTerms(termRows);
      setStudents(roleFilteredStudents.filter((s) => s.status === 'active'));
      setSubjects(roleFilteredSubjects);

      if (isTeacherRole && !matchedTeacher) {
        setDialog({
          title: 'Teacher Mapping Missing',
          message: 'No teacher profile assignment found for this login. Please contact admin.',
        });
      }
    } catch (error) {
      console.error('Error loading marks setup data:', error);
    } finally {
      setLoading(false);
    }
  }, [isTeacherRole, currentUser?.email, currentUser?.linkedEntityId]);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  const filteredStudents = useMemo(
    () => students.filter((s) => s.class === className && s.section === section),
    [students, className, section]
  );

  const classOptions = useMemo(
    () => {
      if (isTeacherRole && teacherAssignments.classNames.length > 0) {
        return teacherAssignments.classNames;
      }

      return Array.from(new Set(students.map((s) => normalizeClassName(s.class)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    },
    [students, isTeacherRole, teacherAssignments.classNames]
  );

  const sectionOptions = useMemo(
    () => {
      if (isTeacherRole && className) {
        return teacherAssignments.sectionsByClass[className] || [];
      }

      return Array.from(new Set(students.filter((s) => normalizeClassName(s.class) === className).map((s) => s.section))).sort();
    },
    [students, className, isTeacherRole, teacherAssignments.sectionsByClass]
  );

  const selectedSubject = subjects.find((s) => s.code === subjectCode);

  useEffect(() => {
    if (sectionOptions.length === 0) {
      setSection('');
      return;
    }

    if (!sectionOptions.includes(section)) {
      setSection(sectionOptions[0]);
    }
  }, [sectionOptions, section]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!examTermId || !className || !section || !subjectCode) {
        return;
      }

      const rows = await firebaseExamService.getMarksEntries(examTermId, className, section, subjectCode);
      const draft: Record<string, DraftMark> = {};
      rows.forEach((row) => {
        draft[row.studentId] = {
          studentId: row.studentId,
          obtainedMarks: row.obtainedMarks,
          absent: row.absent,
        };
      });
      setMarks(draft);
    };

    void loadExisting();
  }, [examTermId, className, section, subjectCode]);

  const handleSave = async () => {
    if (!examTermId || !className || !subjectCode || !selectedSubject) {
      setDialog({ title: 'Validation', message: 'Please select exam, class and subject.' });
      return;
    }

    try {
      setSaving(true);
      for (const student of filteredStudents) {
        const row = marks[student.id];
        const obtained = row ? Number(row.obtainedMarks) : 0;
        const absent = row?.absent || false;

        await firebaseExamService.upsertMarksEntry({
          examTermId,
          className,
          section,
          subjectCode,
          subjectName: selectedSubject.name,
          studentId: student.id,
          studentName: student.name,
          rollNo: student.rollNo,
          maxMarks,
          obtainedMarks: absent ? 0 : Math.max(0, Math.min(obtained, maxMarks)),
          percentage: 0,
          grade: '',
          result: 'fail',
          absent,
          remarks: '',
          enteredBy: currentUser?.uid || 'system',
          status: 'submitted',
        });
      }

      setDialog({ title: 'Marks Saved', message: `Marks submitted for ${filteredStudents.length} students.` });
    } catch (error) {
      console.error('Error saving marks:', error);
      setDialog({ title: 'Save Failed', message: 'Unable to save marks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Marks Entry</h1>
        <p className="text-slate-400">Enter subject-wise marks for each student and submit for publication.</p>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <select className="input" value={examTermId} onChange={(e) => setExamTermId(e.target.value)}>
          <option value="">Exam Cycle</option>
          {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
        </select>
        <select className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
          <option value="">Class</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <select className="input" value={section} onChange={(e) => setSection(e.target.value)} disabled={!className}>
          <option value="">Section</option>
          {sectionOptions.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
        <select className="input" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
          <option value="">Subject</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.code}>{subject.code} - {subject.name}</option>)}
        </select>
        <input type="number" className="input" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value) || 100)} />
        <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No students found for selected class and section.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Absent</th>
                  <th>Marks ({maxMarks})</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const current = marks[student.id] || { studentId: student.id, obtainedMarks: 0, absent: false };
                  return (
                    <tr key={student.id}>
                      <td className="text-slate-300">{student.rollNo}</td>
                      <td className="text-white">{student.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={current.absent}
                          onChange={(e) =>
                            setMarks((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...current,
                                absent: e.target.checked,
                                obtainedMarks: e.target.checked ? 0 : current.obtainedMarks,
                              },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="input max-w-[120px]"
                          min={0}
                          max={maxMarks}
                          disabled={current.absent}
                          value={current.obtainedMarks}
                          onChange={(e) =>
                            setMarks((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...current,
                                obtainedMarks: Number(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AppDialog open={dialog !== null} title={dialog?.title || ''} message={dialog?.message || ''} onClose={() => setDialog(null)} />
    </div>
  );
}
