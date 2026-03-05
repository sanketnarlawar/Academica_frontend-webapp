import { useState, useEffect } from 'react';
import { Eye, Edit, Plus } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { teacherService } from '../../services/teacherService';
import type { ApiResponse, TeacherApiRecord, TeacherSubject, TeacherTableRow } from '../../types';

type TeacherStatsResponse = ApiResponse<{
    totalTeachers: number;
    averageExperience: string;
}>;

const columns = [
    {
        key: 'employeeId', header: 'Emp ID', width: '90px',
        render: (t: TeacherTableRow) => <span className="font-mono text-xs text-indigo-400">{t.employeeId || 'N/A'}</span>,
    },
    {
        key: 'name', header: 'Teacher Name', sortable: true,
        render: (t: TeacherTableRow) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-300 text-xs font-bold flex-shrink-0">
                    {t.name.charAt(0)}
                </div>
                <div>
                    <div className="text-sm text-white font-medium">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.email}</div>
                </div>
            </div>
        ),
    },
    { key: 'qualification', header: 'Qualification', render: (t: TeacherTableRow) => <span className="text-slate-300">{t.qualification}</span> },
    {
        key: 'subjects', header: 'Subjects',
        render: (t: TeacherTableRow) => (
            <div className="flex flex-wrap gap-1">
                {t.subjects && t.subjects.length > 0 ? (
                    <>
                        {t.subjects.slice(0, 2).map((s: TeacherSubject, index: number) => <span key={s._id || `${s.subjectName}-${index}`} className="badge badge-blue text-[10px]">{s.subjectName}</span>)}
                        {t.subjects.length > 2 && <span className="badge badge-purple text-[10px]">+{t.subjects.length - 2}</span>}
                    </>
                ) : (
                    <span className="text-slate-500 text-xs">No subjects</span>
                )}
            </div>
        ),
    },
    { key: 'experience', header: 'Exp.', width: '70px', render: (t: TeacherTableRow) => <span className="text-slate-400">{t.experience}y</span> },
    { key: 'phone', header: 'Phone', render: (t: TeacherTableRow) => <span className="text-slate-400 font-mono text-xs">{t.phone}</span> },
    {
        key: 'status', header: 'Status',
        render: (t: TeacherTableRow) => <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'} capitalize`}>{t.status}</span>,
    },
];

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<TeacherTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        avgExperience: 0,
    });

    useEffect(() => {
        fetchTeachers();
        fetchStats();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await teacherService.getTeachers({
                page: 1,
                limit: 50,
                status: 'Active',
            });
            
            if (response.success && response.data) {
                // Handle different data structures (array or paginated object)
                const teacherList = Array.isArray(response.data) ? response.data : (response.data.teachers || response.data);
                
                if (!Array.isArray(teacherList)) {
                    console.error('Expected an array of teachers but got:', typeof teacherList);
                    setTeachers([]);
                    return;
                }

                // Map backend data to frontend format
                const mappedTeachers: TeacherTableRow[] = (teacherList as TeacherApiRecord[]).map((teacher) => ({
                    id: teacher._id || teacher.id || 'unknown-teacher',
                    employeeId: (teacher.employeeId || teacher._id?.slice(-6) || 'TCH000').toUpperCase(),
                    name: teacher.name || 'Unknown',
                    email: teacher.email || 'N/A',
                    phone: teacher.phone || 'N/A',
                    qualification: teacher.qualification || 'N/A',
                    experience: teacher.experience || 0,
                    subjects: teacher.subjects || [],
                    status: (teacher.status || 'Active').toLowerCase(),
                }));
                
                setTeachers(mappedTeachers);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await teacherService.getTeacherStats() as TeacherStatsResponse;
            if (response.success) {
                setStats({
                    total: response.data.totalTeachers,
                    active: response.data.totalTeachers,
                    avgExperience: parseFloat(response.data.averageExperience),
                });
            }
        } catch (error) {
            console.error('Error fetching teacher stats:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading teachers...</div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Teacher Directory</h1>
                    <p className="page-subtitle">{stats.total} teachers registered</p>
                </div>
                <button className="btn-primary"><Plus className="w-4 h-4" /> Add Teacher</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-blue-400' },
                    { label: 'Active', value: stats.active, color: 'text-emerald-400' },
                    { label: 'Avg Experience', value: stats.avgExperience + 'y', color: 'text-amber-400' },
                    { label: 'This Month', value: '+3', color: 'text-violet-400' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-4 text-center">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card p-6">
                <DataTable
                    data={teachers}
                    columns={columns}
                    searchPlaceholder="Search by name, email, phone..."
                    actions={() => (
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
