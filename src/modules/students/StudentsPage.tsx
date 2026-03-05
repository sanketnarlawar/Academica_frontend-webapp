import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit, Trash2, Plus, Filter } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { studentService } from '../../services/studentService';
import type { StudentApiRecord, StudentTableRow } from '../../types';

const statusBadge = {
    active: 'badge-green',
    inactive: 'badge-red',
    suspended: 'badge-yellow',
    graduated: 'badge-blue',
};

const feeBadge = {
    paid: 'badge-green',
    pending: 'badge-yellow',
    overdue: 'badge-red',
    partial: 'badge-blue',
};

const columns = [
    {
        key: 'rollNo', header: 'Roll No', sortable: true, width: '90px',
        render: (s: StudentTableRow) => <span className="font-mono text-xs text-violet-400">{s.rollNo}</span>,
    },
    {
        key: 'name', header: 'Student Name', sortable: true,
        render: (s: StudentTableRow) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-violet-300 text-xs font-bold flex-shrink-0">
                    {s.name.charAt(0)}
                </div>
                <div>
                    <div className="text-sm text-white font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                </div>
            </div>
        ),
    },
    { key: 'class', header: 'Class', sortable: true, width: '80px', render: (s: StudentTableRow) => <span className="text-slate-300">{s.class}-{s.section}</span> },
    { key: 'gender', header: 'Gender', width: '80px', render: (s: StudentTableRow) => <span className="capitalize text-slate-400">{s.gender}</span> },
    { key: 'parentName', header: 'Parent', render: (s: StudentTableRow) => <span className="text-slate-400">{s.parentName}</span> },
    { key: 'phone', header: 'Phone', render: (s: StudentTableRow) => <span className="text-slate-400 font-mono text-xs">{s.phone}</span> },
    {
        key: 'feeStatus', header: 'Fee Status', sortable: true,
        render: (s: StudentTableRow) => <span className={`badge ${feeBadge[s.feeStatus as keyof typeof feeBadge] || feeBadge.pending} capitalize`}>{s.feeStatus}</span>,
    },
    {
        key: 'status', header: 'Status', sortable: true,
        render: (s: StudentTableRow) => <span className={`badge ${statusBadge[s.status as keyof typeof statusBadge] || statusBadge.inactive} capitalize`}>{s.status}</span>,
    },
];

export default function StudentsPage() {
    const [filter, setFilter] = useState<string>('Active');
    const [students, setStudents] = useState<StudentTableRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
    });

    const fetchStudents = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await studentService.getStudents({
                page,
                limit: 10,
                status: filter,
            });
            
            console.log('Students API Response:', response);
            
            if (response.success && response.data) {
                // Ensure studentList is an array. If response.data is an array use it, 
                // if it's an object with a students key use that, otherwise look at response.data directly.
                const studentList = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.students || response.data);
                
                if (!Array.isArray(studentList)) {
                    console.error('Expected an array of students but got:', typeof studentList);
                    setStudents([]);
                    return;
                }
                
                // Map backend data to frontend format
                const mappedStudents: StudentTableRow[] = (studentList as StudentApiRecord[]).map((student) => ({
                    id: student._id || student.id || 'unknown-student',
                    rollNo: student.rollNumber || 'N/A',
                    name: student.name || 'Unknown',
                    email: student.parentContact?.email || 'N/A',
                    class: (typeof student.classId === 'object' ? student.classId?.className : student.classId) || 'N/A',
                    section: (typeof student.sectionId === 'object' ? student.sectionId?.sectionName : student.sectionId) || 'N/A',
                    gender: (student.gender || 'N/A').toLowerCase(),
                    parentName: student.parentContact?.parentName || 'N/A',
                    phone: student.parentContact?.phone || 'N/A',
                    feeStatus: (student.feeStatus || 'paid').toLowerCase(),
                    status: (student.status || 'Active').toLowerCase(),
                }));
                
                setStudents(mappedStudents);
                setPagination(response.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: mappedStudents.length
                });
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading students...</div>
            </div>
        );
    }

    const filtered = students;

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Student Directory</h1>
                    <p className="page-subtitle">{pagination.totalItems} students enrolled</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                        {['Active', 'Inactive', 'Graduated'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="btn-secondary">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button className="btn-primary">
                        <Plus className="w-4 h-4" /> Add Student
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: pagination.totalItems || 0, color: 'text-violet-400' },
                    { label: 'Active', value: students.filter(s => s.status === 'active').length, color: 'text-emerald-400' },
                    { label: 'Fees Paid', value: students.filter(s => s.feeStatus === 'paid').length, color: 'text-blue-400' },
                    { label: 'Overdue', value: students.filter(s => s.feeStatus === 'overdue').length, color: 'text-red-400' },
                ].map(stat => (
                    <div key={stat.label} className="glass-card p-4 text-center">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card p-6">
                <DataTable
                    data={filtered}
                    columns={columns}
                    searchPlaceholder="Search by name, roll no, email..."
                    actions={() => (
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View">
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
