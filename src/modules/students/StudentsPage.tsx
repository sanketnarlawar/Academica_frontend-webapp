import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus, Filter } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebaseStudentService } from '../../services/firebaseStudentService';
import { firebaseClassService } from '../../services/firebaseClassService';
import type { Student, ClassSection } from '../../types';

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
        render: (s: Student) => <span className="font-mono text-xs text-violet-400">{s.rollNo}</span>,
    },
    {
        key: 'name', header: 'Student Name', sortable: true,
        render: (s: Student) => (
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
    { key: 'class', header: 'Class', sortable: true, width: '80px', render: (s: Student) => <span className="text-slate-300">{s.class}-{s.section}</span> },
    { key: 'gender', header: 'Gender', width: '80px', render: (s: Student) => <span className="capitalize text-slate-400">{s.gender}</span> },
    { key: 'parentName', header: 'Parent', render: (s: Student) => <span className="text-slate-400">{s.parentName}</span> },
    { key: 'phone', header: 'Phone', render: (s: Student) => <span className="text-slate-400 font-mono text-xs">{s.phone}</span> },
    {
        key: 'feeStatus', header: 'Fee Status', sortable: true,
        render: (s: Student) => <span className={`badge ${feeBadge[s.feeStatus as keyof typeof feeBadge] || feeBadge.pending} capitalize`}>{s.feeStatus}</span>,
    },
    {
        key: 'status', header: 'Status', sortable: true,
        render: (s: Student) => <span className={`badge ${statusBadge[s.status as keyof typeof statusBadge] || statusBadge.inactive} capitalize`}>{s.status}</span>,
    },
];

export default function StudentsPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<string>('Total');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        rollNo: '',
        name: '',
        email: '',
        phone: '',
        gender: 'male' as 'male' | 'female' | 'other',
        dob: '',
        class: '',
        section: '',
        parentName: '',
        parentPhone: '',
        address: '',
        admissionDate: '',
        bloodGroup: '',
        status: 'active',
        feeStatus: 'pending',
    });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [classSections, setClassSections] = useState<ClassSection[]>([]);

    const fetchStudents = useCallback(async (page: number = 1) => {
        try {
            setLoading(true);
            // Fetch from Firebase
            const allStudents = await firebaseStudentService.getStudents({
                status: filter !== 'Total' ? filter.toLowerCase() : undefined,
            });

            const startIndex = (page - 1) * 10;
            const paginatedStudents = allStudents.slice(startIndex, startIndex + 10);

            setStudents(paginatedStudents);
            setPagination({
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(allStudents.length / 10)),
                totalItems: allStudents.length,
            });
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const loadClassSections = async () => {
        try {
            const data = await firebaseClassService.getClasses();
            setClassSections(data);
        } catch (err) {
            console.error('Error loading class sections:', err);
            setClassSections([]);
        }
    };

    useEffect(() => {
        fetchStudents();
        loadClassSections();
    }, [fetchStudents]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading students...</div>
            </div>
        );
    }

    const availableClasses = Array.from(new Set(classSections.map((cs) => cs.name))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const availableSections = classSections
        .filter((cs) => cs.name === editForm.class)
        .map((cs) => cs.section);

    const filtered = students;

    const handleView = (row: Student) => {
        setSelectedStudent(row);
        setViewOpen(true);
    };

    const handleEdit = (row: Student) => {
        setSelectedStudent(row);
        setEditForm({
            rollNo: row.rollNo,
            name: row.name,
            email: row.email,
            phone: row.phone,
            gender: row.gender,
            dob: row.dob,
            class: row.class,
            section: row.section,
            parentName: row.parentName,
            parentPhone: row.parentPhone,
            address: row.address,
            admissionDate: row.admissionDate,
            bloodGroup: row.bloodGroup || '',
            status: row.status,
            feeStatus: row.feeStatus,
        });
        setEditOpen(true);
    };

    const handleDelete = (row: Student) => {
        setStudentToDelete(row);
        setDeleteOpen(true);
    };

    const saveStudentChanges = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        try {
            await firebaseStudentService.updateStudent(selectedStudent.id, {
                rollNo: editForm.rollNo,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                gender: editForm.gender,
                dob: editForm.dob,
                class: editForm.class,
                section: editForm.section,
                parentName: editForm.parentName,
                parentPhone: editForm.parentPhone,
                address: editForm.address,
                admissionDate: editForm.admissionDate,
                bloodGroup: editForm.bloodGroup || undefined,
                status: editForm.status as 'active' | 'inactive' | 'suspended' | 'graduated',
                feeStatus: editForm.feeStatus as 'paid' | 'pending' | 'overdue' | 'partial',
            });
            setEditOpen(false);
            setSelectedStudent(null);
            await fetchStudents();
        } catch (error) {
            console.error('Error updating student:', error);
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteStudent = async () => {
        if (!studentToDelete) return;
        setDeleting(true);
        try {
            await firebaseStudentService.deleteStudent(studentToDelete.id);
            setDeleteOpen(false);
            setStudentToDelete(null);
            await fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Student Directory</h1>
                    <p className="page-subtitle">{pagination.totalItems} students enrolled</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                        {['Total', 'Active', 'Inactive'].map(f => (
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
                    <button className="btn-primary" onClick={() => navigate('/students/new')}>
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
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleView(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View">
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                />
            </div>

            {viewOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141624] p-5 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-white mb-4">Student Details</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-slate-400">Name</div><div className="text-white">{selectedStudent.name}</div>
                            <div className="text-slate-400">Roll No</div><div className="text-white">{selectedStudent.rollNo}</div>
                            <div className="text-slate-400">Email</div><div className="text-white">{selectedStudent.email}</div>
                            <div className="text-slate-400">Phone</div><div className="text-white">{selectedStudent.phone}</div>
                            <div className="text-slate-400">Gender</div><div className="text-white capitalize">{selectedStudent.gender}</div>
                            <div className="text-slate-400">DOB</div><div className="text-white">{selectedStudent.dob}</div>
                            <div className="text-slate-400">Class</div><div className="text-white">{selectedStudent.class}-{selectedStudent.section}</div>
                            <div className="text-slate-400">Parent</div><div className="text-white">{selectedStudent.parentName}</div>
                            <div className="text-slate-400">Parent Phone</div><div className="text-white">{selectedStudent.parentPhone}</div>
                            <div className="text-slate-400">Address</div><div className="text-white">{selectedStudent.address}</div>
                            <div className="text-slate-400">Admission Date</div><div className="text-white">{selectedStudent.admissionDate}</div>
                            <div className="text-slate-400">Blood Group</div><div className="text-white">{selectedStudent.bloodGroup || '-'}</div>
                            <div className="text-slate-400">Status</div><div className="text-white capitalize">{selectedStudent.status}</div>
                            <div className="text-slate-400">Fee Status</div><div className="text-white capitalize">{selectedStudent.feeStatus}</div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button className="btn-secondary" onClick={() => { setViewOpen(false); setSelectedStudent(null); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {editOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#151a2e] to-[#0f1322] shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-6 max-h-[85vh] overflow-y-auto">
                        <div className="mb-5 pb-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Edit Student</h3>
                            <p className="text-xs text-slate-400 mt-1">Update student profile details</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/35 border border-white/10 rounded-2xl p-4">
                            <input disabled className="input-field opacity-60 cursor-not-allowed" value={editForm.rollNo} onChange={(e) => setEditForm((p) => ({ ...p, rollNo: e.target.value }))} placeholder="Roll No (read only)" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                            <select className="select-field bg-white/5 border-white/15" value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value as 'male' | 'female' | 'other' }))}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <input type="date" className="input-field bg-white/5 border-white/15" value={editForm.dob} onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))} placeholder="DOB" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.parentName} onChange={(e) => setEditForm((p) => ({ ...p, parentName: e.target.value }))} placeholder="Parent Name" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.parentPhone} onChange={(e) => setEditForm((p) => ({ ...p, parentPhone: e.target.value }))} placeholder="Parent Phone" />
                            <select className="select-field bg-white/5 border-white/15" value={editForm.class} onChange={(e) => setEditForm((p) => ({ ...p, class: e.target.value, section: '' }))}>
                                <option value="">Select Class</option>
                                {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select className="select-field bg-white/5 border-white/15" value={editForm.section} onChange={(e) => setEditForm((p) => ({ ...p, section: e.target.value }))} disabled={!editForm.class}>
                                <option value="">Select Section</option>
                                {availableSections.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input className="input-field bg-white/5 border-white/15 sm:col-span-2" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" />
                            <input type="date" disabled className="input-field opacity-60 cursor-not-allowed" value={editForm.admissionDate} onChange={(e) => setEditForm((p) => ({ ...p, admissionDate: e.target.value }))} placeholder="Admission Date" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.bloodGroup} onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))} placeholder="Blood Group" />
                            <select className="select-field bg-white/5 border-white/15" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                                <option value="graduated">Graduated</option>
                            </select>
                            <select className="select-field bg-white/5 border-white/15" value={editForm.feeStatus} onChange={(e) => setEditForm((p) => ({ ...p, feeStatus: e.target.value }))}>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button className="btn-secondary" onClick={() => { setEditOpen(false); setSelectedStudent(null); }}>Cancel</button>
                            <button className="btn-primary" disabled={saving} onClick={saveStudentChanges}>{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteOpen && studentToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-md glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Student</h3>
                        <p className="text-sm text-slate-400">Are you sure you want to delete <span className="text-white font-medium">{studentToDelete.name}</span> ({studentToDelete.rollNo})? This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button className="btn-secondary" disabled={deleting} onClick={() => { setDeleteOpen(false); setStudentToDelete(null); }}>Cancel</button>
                            <button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={deleting} onClick={confirmDeleteStudent}>{deleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
