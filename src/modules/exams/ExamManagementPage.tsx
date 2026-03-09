import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseExamService } from '../../services/firebaseExamService';
import type { ExamTerm } from '../../types';

const examColumns = [
  { key: 'name', header: 'Exam Name', sortable: true, render: (row: ExamTerm) => <span className="text-white font-medium">{row.name}</span> },
  { key: 'academicYear', header: 'Academic Year', render: (row: ExamTerm) => <span className="text-slate-300">{row.academicYear}</span> },
  { key: 'examType', header: 'Type', render: (row: ExamTerm) => <span className="badge badge-blue capitalize">{row.examType.replace('-', ' ')}</span> },
  { key: 'startDate', header: 'Start', render: (row: ExamTerm) => <span className="text-slate-300">{new Date(row.startDate).toLocaleDateString()}</span> },
  { key: 'endDate', header: 'End', render: (row: ExamTerm) => <span className="text-slate-300">{new Date(row.endDate).toLocaleDateString()}</span> },
  {
    key: 'status',
    header: 'Status',
    render: (row: ExamTerm) => {
      const statusColors: Record<ExamTerm['status'], string> = {
        draft: 'badge-gray',
        scheduled: 'badge-blue',
        ongoing: 'badge-yellow',
        completed: 'badge-purple',
        published: 'badge-green',
        archived: 'badge-red',
      };
      return <span className={`badge ${statusColors[row.status]}`}>{row.status}</span>;
    },
  },
];

export default function ExamManagementPage() {
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    mode?: 'info' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  } | null>(null);
  const [form, setForm] = useState({
    name: '',
    academicYear: '',
    examType: 'unit-test' as ExamTerm['examType'],
    startDate: '',
    endDate: '',
  });

  const loadTerms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await firebaseExamService.getExamTerms();
      setTerms(data);
    } catch (error) {
      console.error('Error loading exam terms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTerms();
  }, [loadTerms]);

  const handleCreate = async () => {
    if (!form.name || !form.academicYear || !form.startDate || !form.endDate) {
      setDialog({ title: 'Validation', message: 'Please fill all required fields.' });
      return;
    }

    try {
      setSaving(true);
      await firebaseExamService.createExamTerm({
        name: form.name,
        academicYear: form.academicYear,
        examType: form.examType,
        startDate: form.startDate,
        endDate: form.endDate,
        status: 'draft',
        createdBy: 'admin-001',
      });
      setOpen(false);
      setForm({ name: '', academicYear: '', examType: 'unit-test', startDate: '', endDate: '' });
      await loadTerms();
    } catch (error) {
      console.error('Error creating exam term:', error);
      setDialog({ title: 'Create Failed', message: 'Could not create exam term. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (term: ExamTerm) => {
    setDialog({
      title: 'Delete Exam Cycle',
      message: `Are you sure you want to delete "${term.name}"? This action cannot be undone.`,
      mode: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        void executeDelete(term.id);
      },
    });
  };

  const executeDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setDialog(null);
      await firebaseExamService.deleteExamTerm(id);
      await loadTerms();
      setDialog({ title: 'Deleted', message: 'Exam cycle deleted successfully.' });
    } catch (error) {
      console.error('Error deleting exam cycle:', error);
      setDialog({ title: 'Delete Failed', message: 'Could not delete exam cycle. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Setup</h1>
          <p className="text-slate-400">Create and manage exam cycles for the academic year.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Exam Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-sm">Total Cycles</p>
          <p className="text-2xl font-bold text-white">{terms.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-400">{terms.filter((t) => t.status === 'published').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{terms.filter((t) => t.status === 'draft' || t.status === 'scheduled').length}</p>
        </div>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="text-slate-400 text-center p-8">Loading exam cycles...</div>
        ) : (
          <DataTable
            data={terms}
            columns={examColumns}
            actions={(term) => (
              <button
                className="btn-icon"
                title="Delete Exam Cycle"
                onClick={() => handleDelete(term)}
                disabled={deletingId === term.id}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          />
        )}
      </div>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CalendarPlus className="w-6 h-6" />
              Create Exam Cycle
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Term 1 Midterm" />
              </div>
              <div>
                <label className="label">Academic Year</label>
                <input className="input" value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} placeholder="2026-27" />
              </div>
              <div>
                <label className="label">Exam Type</label>
                <select className="input" value={form.examType} onChange={(e) => setForm((p) => ({ ...p, examType: e.target.value as ExamTerm['examType'] }))}>
                  <option value="unit-test">Unit Test</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="practical">Practical</option>
                  <option value="oral">Oral</option>
                </select>
              </div>
              <div></div>
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Cycle'}</button>
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
