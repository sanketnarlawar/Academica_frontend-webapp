import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Filter } from 'lucide-react';
import { FeeCollectionChart, AttendanceTrendChart } from '../../components/charts/Charts';
import DataTable from '../../components/tables/DataTable';
import { mockStudents } from '../../data/mockData';
import type { Student } from '../../types';

const studentReportColumns = [
    { key: 'rollNo', header: 'Roll No', render: (s: Student) => <span className="font-mono text-xs text-violet-400">{s.rollNo}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (s: Student) => <span className="text-white">{s.name}</span> },
    { key: 'class', header: 'Class', render: (s: Student) => <span className="text-slate-400">{s.class}-{s.section}</span> },
    { key: 'admissionDate', header: 'Admitted', render: (s: Student) => <span className="text-slate-400 text-xs">{new Date(s.admissionDate).toLocaleDateString('en-IN')}</span> },
    { key: 'feeStatus', header: 'Fee Status', render: (s: Student) => <span className={`badge capitalize ${s.feeStatus === 'paid' ? 'badge-green' : s.feeStatus === 'overdue' ? 'badge-red' : s.feeStatus === 'partial' ? 'badge-blue' : 'badge-yellow'}`}>{s.feeStatus}</span> },
    { key: 'status', header: 'Status', render: (s: Student) => <span className={`badge capitalize ${s.status === 'active' ? 'badge-green' : 'badge-red'}`}>{s.status}</span> },
];

export default function ReportsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const getTabIndex = () => {
        if (location.pathname.includes('/attendance')) return 1;
        if (location.pathname.includes('/students')) return 2;
        return 0;
    };
    const tab = getTabIndex();

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Generate and export detailed reports</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary"><Filter className="w-4 h-4" /> Filter</button>
                    <button className="btn-primary"><Download className="w-4 h-4" /> Export</button>
                </div>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
                {[
                    { label: 'Fee Reports', path: '/reports/fee' },
                    { label: 'Attendance Reports', path: '/reports/attendance' },
                    { label: 'Student Reports', path: '/reports/students' }
                ].map((t, i) => (
                    <button
                        key={t.label}
                        onClick={() => navigate(t.path)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 0 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Revenue', value: '₹28.60L', note: 'Academic year 2023-24' },
                            { label: 'Collection Rate', value: '89.3%', note: 'vs target 95%' },
                            { label: 'Outstanding', value: '₹3.42L', note: 'From 32 students' },
                        ].map(s => (
                            <div key={s.label} className="glass-card p-4 text-center">
                                <div className="text-xl font-bold text-violet-400">{s.value}</div>
                                <div className="text-sm text-white mt-1">{s.label}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{s.note}</div>
                            </div>
                        ))}
                    </div>
                    <div className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Monthly Fee Collection</h2>
                        <FeeCollectionChart />
                    </div>
                </div>
            )}

            {tab === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Avg Attendance', value: '90.2%', note: 'This month' },
                            { label: 'Perfect Attendance', value: '312', note: 'Students' },
                            { label: 'Below 75%', value: '28', note: 'Need attention' },
                        ].map(s => (
                            <div key={s.label} className="glass-card p-4 text-center">
                                <div className="text-xl font-bold text-emerald-400">{s.value}</div>
                                <div className="text-sm text-white mt-1">{s.label}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{s.note}</div>
                            </div>
                        ))}
                    </div>
                    <div className="glass-card p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Weekly Attendance Trend</h2>
                        <AttendanceTrendChart />
                    </div>
                </div>
            )}

            {tab === 2 && (
                <div className="glass-card p-6">
                    <DataTable
                        data={mockStudents}
                        columns={studentReportColumns}
                        searchPlaceholder="Search students..."
                    />
                </div>
            )}
        </div>
    );
}
