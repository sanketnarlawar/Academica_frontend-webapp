import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseExamService } from '../../services/firebaseExamService';
import { firebaseClassService } from '../../services/firebaseClassService';
import type { ClassSection, ExamResult, ExamTerm } from '../../types';

const columns = [
  { key: 'studentName', header: 'Student', sortable: true, render: (row: ExamResult) => <span className="text-white">{row.studentName}</span> },
  { key: 'className', header: 'Class', render: (row: ExamResult) => <span className="text-slate-300">{row.className}-{row.section}</span> },
  { key: 'overallPercentage', header: 'Percentage', render: (row: ExamResult) => <span className="text-slate-300">{row.overallPercentage}%</span> },
  { key: 'overallGrade', header: 'Grade', render: (row: ExamResult) => <span className="badge badge-blue">{row.overallGrade}</span> },
  { key: 'resultStatus', header: 'Result', render: (row: ExamResult) => <span className={`badge ${row.resultStatus === 'pass' ? 'badge-green' : 'badge-red'}`}>{row.resultStatus}</span> },
  { key: 'published', header: 'Published', render: (row: ExamResult) => <span className={`badge ${row.published ? 'badge-green' : 'badge-yellow'}`}>{row.published ? 'Yes' : 'No'}</span> },
];

export default function ResultPublicationPage() {
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [className, setClassName] = useState('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [termRows, resultRows, classRows] = await Promise.all([
        firebaseExamService.getExamTerms(),
        selectedTerm ? firebaseExamService.getExamResults(selectedTerm) : firebaseExamService.getExamResults(),
        firebaseClassService.getClasses(),
      ]);
      setTerms(termRows);
      setResults(resultRows);
      setClassSections(classRows);
    } catch (error) {
      console.error('Error loading result publication data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  const classOptions = useMemo(() => {
    const fromClassMaster = classSections.map((row) => row.name);
    const fromResults = results.map((row) => row.className);
    return Array.from(new Set([...fromClassMaster, ...fromResults]))
      .filter((value) => !!value)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [classSections, results]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePublish = async () => {
    if (!selectedTerm) {
      setDialog({ title: 'Validation', message: 'Please select exam cycle.' });
      return;
    }

    try {
      setPublishing(true);
      const publishedCount = await firebaseExamService.publishResults(selectedTerm, className || undefined);
      setDialog({ title: 'Results Published', message: `Published results for ${publishedCount} students.` });
      await load();
    } catch (error) {
      console.error('Error publishing results:', error);
      setDialog({ title: 'Publish Failed', message: 'Could not publish results. Ensure marks are entered first.' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Result Publication</h1>
        <p className="text-slate-400">Publish class results after marks verification and lock the cycle.</p>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select className="input" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
          <option value="">Select Exam Cycle</option>
          {terms.map((term) => <option key={term.id} value={term.id}>{term.name} ({term.academicYear})</option>)}
        </select>
        <select className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
          <option value="">All Classes (optional)</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={handlePublish} disabled={publishing || loading}>
          <Send className="w-4 h-4" />
          {publishing ? 'Publishing...' : 'Publish Results'}
        </button>
      </div>

      <div className="card p-4">
        {loading ? <div className="p-8 text-center text-slate-400">Loading results...</div> : <DataTable data={results} columns={columns} />}
      </div>

      <AppDialog open={dialog !== null} title={dialog?.title || ''} message={dialog?.message || ''} onClose={() => setDialog(null)} />
    </div>
  );
}
