import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebaseExamService } from '../../services/firebaseExamService';
import type { ExamTerm, ReportCard } from '../../types';

const columns = [
  { key: 'studentName', header: 'Student', sortable: true, render: (row: ReportCard) => <span className="text-white">{row.studentName}</span> },
  { key: 'className', header: 'Class', render: (row: ReportCard) => <span className="text-slate-300">{row.className}-{row.section}</span> },
  { key: 'examName', header: 'Exam', render: (row: ReportCard) => <span className="text-slate-300">{row.examName}</span> },
  { key: 'overallPercentage', header: 'Percentage', render: (row: ReportCard) => <span className="text-slate-300">{row.overallPercentage}%</span> },
  { key: 'overallGrade', header: 'Grade', render: (row: ReportCard) => <span className="badge badge-blue">{row.overallGrade}</span> },
  { key: 'finalResult', header: 'Result', render: (row: ReportCard) => <span className={`badge ${row.finalResult === 'pass' ? 'badge-green' : 'badge-red'}`}>{row.finalResult}</span> },
];

export default function ReportCardsPage() {
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [termRows, cardRows] = await Promise.all([
        firebaseExamService.getExamTerms(),
        selectedTerm ? firebaseExamService.getReportCards(selectedTerm) : firebaseExamService.getReportCards(),
      ]);
      setTerms(termRows);
      setCards(cardRows);
    } catch (error) {
      console.error('Error loading report cards:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    void load();
  }, [load]);

  const topper = useMemo(() => {
    if (cards.length === 0) return null;
    return [...cards].sort((a, b) => b.overallPercentage - a.overallPercentage)[0];
  }, [cards]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Report Cards</h1>
          <p className="text-slate-400">Review generated report cards and overall exam outcomes.</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export PDF Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-slate-400 text-sm">Generated Cards</p>
          <p className="text-2xl font-bold text-white">{cards.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-sm">Top Performer</p>
          <p className="text-2xl font-bold text-green-400">{topper ? topper.studentName : '-'}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-400 text-sm">Top Score</p>
          <p className="text-2xl font-bold text-blue-400">{topper ? `${topper.overallPercentage}%` : '-'}</p>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <select className="input" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
          <option value="">All Exam Cycles</option>
          {terms.map((term) => <option key={term.id} value={term.id}>{term.name} ({term.academicYear})</option>)}
        </select>
      </div>

      <div className="card p-4">
        {loading ? <div className="p-8 text-center text-slate-400">Loading report cards...</div> : <DataTable data={cards} columns={columns} />}
      </div>
    </div>
  );
}
