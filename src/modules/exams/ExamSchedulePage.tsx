import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseExamService } from '../../services/firebaseExamService';
import { firebaseSubjectService } from '../../services/firebaseSubjectService';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import { firebaseClassService } from '../../services/firebaseClassService';
import type { ClassSection, ExamSchedule, ExamTerm, Subject, Teacher } from '../../types';

const columns = [
  { key: 'examName', header: 'Exam', sortable: true, render: (row: ExamSchedule) => <span className="text-white">{row.examName}</span> },
  { key: 'className', header: 'Class', render: (row: ExamSchedule) => <span className="text-slate-300">{row.className}-{row.section}</span> },
  { key: 'subjectName', header: 'Subject', render: (row: ExamSchedule) => <span className="text-slate-300">{row.subjectName}</span> },
  { key: 'examDate', header: 'Date', render: (row: ExamSchedule) => <span className="text-slate-300">{new Date(row.examDate).toLocaleDateString()}</span> },
  { key: 'slot', header: 'Time', render: (row: ExamSchedule) => <span className="text-slate-300">{row.startTime} - {row.endTime}</span> },
  { key: 'room', header: 'Room', render: (row: ExamSchedule) => <span className="text-slate-300">{row.room}</span> },
  { key: 'invigilatorName', header: 'Invigilator', render: (row: ExamSchedule) => <span className="text-slate-300">{row.invigilatorName || '-'}</span> },
];

export default function ExamSchedulePage() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    mode?: 'info' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const [form, setForm] = useState({
    examTermId: '',
    className: '',
    section: 'A',
    subjectCode: '',
    examDate: '',
    startTime: '',
    endTime: '',
    room: '',
    invigilatorTeacherId: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [scheduleRows, termRows, subjectRows, teacherRows, classRows] = await Promise.all([
        firebaseExamService.getExamSchedules(),
        firebaseExamService.getExamTerms(),
        firebaseSubjectService.getSubjects(),
        firebaseTeacherService.getTeachers(),
        firebaseClassService.getClasses(),
      ]);
      setSchedules(scheduleRows);
      setTerms(termRows);
      setSubjects(subjectRows);
      setTeachers(teacherRows.filter((t) => t.status === 'active'));
      setClasses(classRows);
    } catch (error) {
      console.error('Error loading exam schedule data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(classes.map((item) => item.name).filter(Boolean)));
    return unique.sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classes]);

  const sectionOptions = useMemo(() => {
    const sections = classes
      .filter((item) => item.name === form.className)
      .map((item) => item.section)
      .filter(Boolean);
    return Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b));
  }, [classes, form.className]);

  const handleCreate = async () => {
    const selectedTerm = terms.find((item) => item.id === form.examTermId);
    const selectedSubject = subjects.find((item) => item.code === form.subjectCode);
    const selectedTeacher = teachers.find((item) => item.id === form.invigilatorTeacherId);

    if (!selectedTerm || !selectedSubject || !form.className || !form.examDate || !form.startTime || !form.endTime || !form.room) {
      setDialog({ title: 'Validation', message: 'Please fill all required fields.' });
      return;
    }

    try {
      setSaving(true);
      await firebaseExamService.createExamSchedule({
        examTermId: selectedTerm.id,
        examName: selectedTerm.name,
        className: form.className,
        section: form.section,
        subjectCode: selectedSubject.code,
        subjectName: selectedSubject.name,
        examDate: form.examDate,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        invigilatorTeacherId: selectedTeacher?.id,
        invigilatorName: selectedTeacher?.name,
        status: 'scheduled',
      });

      setOpen(false);
      setForm({
        examTermId: '',
        className: '',
        section: 'A',
        subjectCode: '',
        examDate: '',
        startTime: '',
        endTime: '',
        room: '',
        invigilatorTeacherId: '',
      });
      await load();
    } catch (error) {
      console.error('Error creating exam schedule:', error);
      setDialog({ title: 'Save Failed', message: 'Could not create exam schedule. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (schedule: ExamSchedule) => {
    setDialog({
      title: 'Delete Exam Schedule',
      message: `Delete schedule for ${schedule.subjectName} (${schedule.className}-${schedule.section}) on ${schedule.examDate}?`,
      mode: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        void executeDelete(schedule.id);
      },
    });
  };

  const executeDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setDialog(null);
      await firebaseExamService.deleteExamSchedule(id);
      await load();
      setDialog({ title: 'Deleted', message: 'Exam schedule deleted successfully.' });
    } catch (error) {
      console.error('Error deleting exam schedule:', error);
      setDialog({ title: 'Delete Failed', message: 'Could not delete exam schedule. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Schedule</h1>
          <p className="text-slate-400">Plan class-wise paper schedule, room and invigilator assignments.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Paper Schedule
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading schedules...</div>
        ) : (
          <DataTable
            columns={columns}
            data={schedules}
            actions={(schedule) => (
              <button
                className="btn-icon"
                title="Delete Exam Schedule"
                onClick={() => handleDelete(schedule)}
                disabled={deletingId === schedule.id}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          />
        )}
      </div>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create Exam Schedule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Cycle</label>
                <select className="input" value={form.examTermId} onChange={(e) => setForm((p) => ({ ...p, examTermId: e.target.value }))}>
                  <option value="">Select cycle</option>
                  {terms.map((term) => <option key={term.id} value={term.id}>{term.name} ({term.academicYear})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select className="input" value={form.subjectCode} onChange={(e) => setForm((p) => ({ ...p, subjectCode: e.target.value }))}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.code}>{subject.code} - {subject.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Class</label>
                <select
                  className="input"
                  value={form.className}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      className: e.target.value,
                      section: '',
                    }))
                  }
                >
                  <option value="">Select class</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select
                  className="input"
                  value={form.section}
                  onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
                  disabled={!form.className}
                >
                  <option value="">Select section</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Exam Date</label>
                <input type="date" className="input" value={form.examDate} onChange={(e) => setForm((p) => ({ ...p, examDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Room</label>
                <input className="input" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} placeholder="Block B - 201" />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Invigilator (Optional)</label>
                <select className="input" value={form.invigilatorTeacherId} onChange={(e) => setForm((p) => ({ ...p, invigilatorTeacherId: e.target.value }))}>
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Save Schedule'}</button>
              <button className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <AppDialog
        open={dialog !== null}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        mode={dialog?.mode || 'info'}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        onConfirm={dialog?.onConfirm}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
