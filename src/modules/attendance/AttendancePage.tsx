import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { mockStudents } from '../../data/mockData';
import { AttendanceTrendChart, ClassAttendanceChart } from '../../components/charts/Charts';

type MarkStatus = 'present' | 'absent' | 'late' | 'excused';

const statusColors: Record<MarkStatus, string> = {
    present: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    absent: 'bg-red-500/20 border-red-500/30 text-red-400',
    late: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    excused: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
};

const StatusIcon = ({ status }: { status: MarkStatus }) => {
    if (status === 'present') return <CheckCircle className="w-4 h-4" />;
    if (status === 'absent') return <XCircle className="w-4 h-4" />;
    if (status === 'late') return <Clock className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
};

export default function AttendancePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedClass, setSelectedClass] = useState('10');
    const [attendance, setAttendance] = useState<Record<string, MarkStatus>>({});
    
    const tab = location.pathname.includes('/analytics') ? 'analytics' : 'mark';

    const classStudents = mockStudents.filter(s => s.class === selectedClass);

    const toggleStatus = (id: string) => {
        const cycle: MarkStatus[] = ['present', 'absent', 'late', 'excused'];
        const current = attendance[id] || 'present';
        const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
        setAttendance(prev => ({ ...prev, [id]: next }));
    };

    const markAll = (status: MarkStatus) => {
        const newAtt: Record<string, MarkStatus> = {};
        classStudents.forEach(s => { newAtt[s.id] = status; });
        setAttendance(newAtt);
    };

    const counts = {
        present: classStudents.filter(s => (attendance[s.id] || 'present') === 'present').length,
        absent: classStudents.filter(s => attendance[s.id] === 'absent').length,
        late: classStudents.filter(s => attendance[s.id] === 'late').length,
        excused: classStudents.filter(s => attendance[s.id] === 'excused').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title">Attendance Management</h1>
                <p className="page-subtitle">Mark and track student attendance</p>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
                {[
                    { key: 'mark', label: 'Mark Attendance', path: '/attendance/mark' },
                    { key: 'analytics', label: 'Analytics', path: '/attendance/analytics' }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => navigate(t.path)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'mark' && (
                <div className="space-y-5">
                    {/* Controls */}
                    <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Class</label>
                            <select className="select-field w-32" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                {['6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Date</label>
                            <input type="date" className="input-field w-44" defaultValue="2024-04-15" />
                        </div>
                        <div className="ml-auto flex gap-2">
                            <button onClick={() => markAll('present')} className="btn-secondary text-xs py-2 px-3">All Present</button>
                            <button onClick={() => markAll('absent')} className="btn-danger text-xs py-2 px-3">All Absent</button>
                            <button className="btn-primary text-xs py-2 px-3">Save</button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3">
                        {Object.entries(counts).map(([status, count]) => (
                            <div key={status} className={`p-3 rounded-xl border flex items-center gap-3 ${statusColors[status as MarkStatus]}`}>
                                <StatusIcon status={status as MarkStatus} />
                                <div>
                                    <div className="text-base font-bold">{count}</div>
                                    <div className="text-xs capitalize">{status}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Student Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {classStudents.map(student => {
                            const status = attendance[student.id] || 'present';
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => toggleStatus(student.id)}
                                    className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${statusColors[status]}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                            {student.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-mono">{student.rollNo}</span>
                                    </div>
                                    <div className="text-xs font-medium text-white truncate">{student.name}</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <StatusIcon status={status} />
                                        <span className="text-[10px] capitalize">{status}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {tab === 'analytics' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h2 className="text-base font-semibold text-white mb-4">Weekly Attendance Trend</h2>
                        <AttendanceTrendChart />
                    </div>
                    <div className="glass-card p-6">
                        <h2 className="text-base font-semibold text-white mb-4">Class-wise Attendance</h2>
                        <ClassAttendanceChart />
                    </div>
                    <div className="xl:col-span-2 glass-card p-6">
                        <h2 className="text-base font-semibold text-white mb-4">Low Attendance Students (Below 75%)</h2>
                        <div className="space-y-3">
                            {mockStudents.slice(0, 5).map((s, i) => {
                                const pct = 65 + i * 3;
                                return (
                                    <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 text-sm font-bold">{s.name.charAt(0)}</div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white font-medium">{s.name}</div>
                                            <div className="text-xs text-slate-400">Class {s.class}-{s.section}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-red-400 font-bold text-sm">{pct}%</div>
                                            <div className="text-[10px] text-slate-500">Attendance</div>
                                        </div>
                                        <div className="w-24">
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
