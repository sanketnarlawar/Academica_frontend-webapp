import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import { firebaseClassService } from '../../services/firebaseClassService';
import { firebaseSubjectService } from '../../services/firebaseSubjectService';
import type { Teacher, ClassSection, Subject } from '../../types';

const columns = [
    {
        key: 'employeeId', header: 'Emp ID', width: '90px',
        render: (t: Teacher) => <span className="font-mono text-xs text-indigo-400">{t.employeeId || 'N/A'}</span>,
    },
    {
        key: 'name', header: 'Teacher Name', sortable: true,
        render: (t: Teacher) => (
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
    { key: 'qualification', header: 'Qualification', render: (t: Teacher) => <span className="text-slate-300">{t.qualification}</span> },
    {
        key: 'subjects', header: 'Subjects',
        render: (t: Teacher) => (
            <div className="flex flex-wrap gap-1">
                {t.subjects && t.subjects.length > 0 ? (
                    <>
                        {t.subjects.slice(0, 2).map((subject, index: number) => <span key={`${subject}-${index}`} className="badge badge-blue text-[10px]">{subject}</span>)}
                        {t.subjects.length > 2 && <span className="badge badge-purple text-[10px]">+{t.subjects.length - 2}</span>}
                    </>
                ) : (
                    <span className="text-slate-500 text-xs">No subjects</span>
                )}
            </div>
        ),
    },
    { key: 'experience', header: 'Exp.', width: '70px', render: (t: Teacher) => <span className="text-slate-400">{t.experience}y</span> },
    { key: 'phone', header: 'Phone', render: (t: Teacher) => <span className="text-slate-400 font-mono text-xs">{t.phone}</span> },
    {
        key: 'status', header: 'Status',
        render: (t: Teacher) => <span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-red'} capitalize`}>{t.status}</span>,
    },
];

export default function TeachersPage() {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classSections, setClassSections] = useState<ClassSection[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [editForm, setEditForm] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        gender: 'male' as 'male' | 'female' | 'other',
        dob: '',
        department: '',
        qualification: '',
        experience: '',
        selectedSubjects: [] as string[],
        selectedClasses: [] as string[],
        joinDate: '',
        salary: '',
        status: 'active',
    });
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        avgExperience: 0,
    });

    useEffect(() => {
        fetchTeachers();
        fetchStats();
        loadClassSections();
        loadSubjects();
    }, []);

    const loadClassSections = async () => {
        try {
            const data = await firebaseClassService.getClasses();
            setClassSections(data);
        } catch (err) {
            console.error('Error loading class sections:', err);
            setClassSections([]);
        }
    };

    const loadSubjects = async () => {
        try {
            const data = await firebaseSubjectService.getSubjects();
            setSubjects(data);
        } catch (err) {
            console.error('Error loading subjects:', err);
            setSubjects([]);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const allTeachers = await firebaseTeacherService.getTeachers();
            setTeachers(allTeachers);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const [totalCount, avgExp] = await Promise.all([
                firebaseTeacherService.getTeacherCount(),
                firebaseTeacherService.getAverageExperience(),
            ]);

            const teachers = await firebaseTeacherService.getTeachers();
            const activeCount = teachers.filter(teacher => teacher.status === 'active').length;

            setStats({
                total: totalCount,
                active: activeCount,
                avgExperience: Number(avgExp.toFixed(1)),
            });
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

    const handleView = (row: Teacher) => {
        setSelectedTeacher(row);
        setViewOpen(true);
    };

    const handleEdit = (row: Teacher) => {
        setSelectedTeacher(row);
        setEditForm({
            employeeId: row.employeeId,
            name: row.name,
            email: row.email,
            phone: row.phone,
            gender: row.gender,
            dob: row.dob,
            department: row.department,
            qualification: row.qualification,
            experience: String(row.experience),
            selectedSubjects: row.subjects || [],
            selectedClasses: row.classes || [],
            joinDate: row.joinDate,
            salary: String(row.salary),
            status: row.status,
        });
        setEditOpen(true);
    };

    const handleDelete = (row: Teacher) => {
        setTeacherToDelete(row);
        setDeleteOpen(true);
    };

    const saveTeacherChanges = async () => {
        if (!selectedTeacher) return;
        setSaving(true);
        try {
            const experience = Number(editForm.experience || 0);
            const salary = Number(editForm.salary || 0);
            await firebaseTeacherService.updateTeacher(selectedTeacher.id, {
                employeeId: editForm.employeeId,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                gender: editForm.gender,
                dob: editForm.dob,
                department: editForm.department,
                qualification: editForm.qualification,
                experience,
                subjects: editForm.selectedSubjects,
                classes: editForm.selectedClasses,
                joinDate: editForm.joinDate,
                salary,
                status: editForm.status as 'active' | 'inactive',
            });
            setEditOpen(false);
            setSelectedTeacher(null);
            await fetchTeachers();
            await fetchStats();
        } catch (error) {
            console.error('Error updating teacher:', error);
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteTeacher = async () => {
        if (!teacherToDelete) return;
        setDeleting(true);
        try {
            await firebaseTeacherService.deleteTeacher(teacherToDelete.id);
            setDeleteOpen(false);
            setTeacherToDelete(null);
            await fetchTeachers();
            await fetchStats();
        } catch (error) {
            console.error('Error deleting teacher:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Teacher Directory</h1>
                    <p className="page-subtitle">{stats.total} teachers registered</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/teachers/new')}><Plus className="w-4 h-4" /> Add Teacher</button>
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

            {viewOpen && selectedTeacher && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141624] p-5 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-white mb-4">Teacher Details</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-slate-400">Name</div><div className="text-white">{selectedTeacher.name}</div>
                            <div className="text-slate-400">Employee ID</div><div className="text-white">{selectedTeacher.employeeId}</div>
                            <div className="text-slate-400">Email</div><div className="text-white">{selectedTeacher.email}</div>
                            <div className="text-slate-400">Phone</div><div className="text-white">{selectedTeacher.phone}</div>
                            <div className="text-slate-400">Gender</div><div className="text-white capitalize">{selectedTeacher.gender}</div>
                            <div className="text-slate-400">DOB</div><div className="text-white">{selectedTeacher.dob}</div>
                            <div className="text-slate-400">Department</div><div className="text-white">{selectedTeacher.department}</div>
                            <div className="text-slate-400">Qualification</div><div className="text-white">{selectedTeacher.qualification}</div>
                            <div className="text-slate-400">Experience</div><div className="text-white">{selectedTeacher.experience} years</div>
                            <div className="text-slate-400">Subjects</div><div className="text-white">{selectedTeacher.subjects.join(', ') || '-'}</div>
                            <div className="text-slate-400">Classes</div><div className="text-white">{selectedTeacher.classes.join(', ') || '-'}</div>
                            <div className="text-slate-400">Join Date</div><div className="text-white">{selectedTeacher.joinDate}</div>
                            <div className="text-slate-400">Salary</div><div className="text-white">{selectedTeacher.salary}</div>
                            <div className="text-slate-400">Status</div><div className="text-white capitalize">{selectedTeacher.status}</div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button className="btn-secondary" onClick={() => { setViewOpen(false); setSelectedTeacher(null); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {editOpen && selectedTeacher && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-gradient-to-b from-[#151a2e] to-[#0f1322] shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-6 max-h-[85vh] overflow-y-auto">
                        <div className="mb-5 pb-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Edit Teacher</h3>
                            <p className="text-xs text-slate-400 mt-1">Update teacher profile and assignment details</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/35 border border-white/10 rounded-2xl p-4">
                            <input disabled className="input-field opacity-60 cursor-not-allowed" value={editForm.employeeId} onChange={(e) => setEditForm((p) => ({ ...p, employeeId: e.target.value }))} placeholder="Employee ID (read only)" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                            <select className="select-field bg-white/5 border-white/15" value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value as 'male' | 'female' | 'other' }))}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <input type="date" className="input-field bg-white/5 border-white/15" value={editForm.dob} onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))} placeholder="DOB" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} placeholder="Department" />
                            <input className="input-field bg-white/5 border-white/15" value={editForm.qualification} onChange={(e) => setEditForm((p) => ({ ...p, qualification: e.target.value }))} placeholder="Qualification" />
                            <input type="number" className="input-field bg-white/5 border-white/15" value={editForm.experience} onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))} placeholder="Experience" />
                            <select className="select-field bg-white/5 border-white/15" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-400 mb-2">Subjects</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editForm.selectedSubjects.map((subject, idx) => (
                                        <span key={idx} className="badge badge-blue text-xs flex items-center gap-1">
                                            {subject}
                                            <button
                                                type="button"
                                                onClick={() => setEditForm((p) => ({ ...p, selectedSubjects: p.selectedSubjects.filter((_, i) => i !== idx) }))}
                                                className="ml-1 hover:text-red-300"
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                                <select
                                    className="select-field bg-white/5 border-white/15"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !editForm.selectedSubjects.includes(e.target.value)) {
                                            setEditForm((p) => ({ ...p, selectedSubjects: [...p.selectedSubjects, e.target.value] }));
                                        }
                                    }}
                                >
                                    <option value="">Add Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.name}>{subject.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-400 mb-2">Classes</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editForm.selectedClasses.map((cls, idx) => (
                                        <span key={idx} className="badge badge-purple text-xs flex items-center gap-1">
                                            {cls}
                                            <button
                                                type="button"
                                                onClick={() => setEditForm((p) => ({ ...p, selectedClasses: p.selectedClasses.filter((_, i) => i !== idx) }))}
                                                className="ml-1 hover:text-red-300"
                                            >×</button>
                                        </span>
                                    ))}
                                </div>
                                <select
                                    className="select-field bg-white/5 border-white/15"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value && !editForm.selectedClasses.includes(e.target.value)) {
                                            setEditForm((p) => ({ ...p, selectedClasses: [...p.selectedClasses, e.target.value] }));
                                        }
                                    }}
                                >
                                    <option value="">Add Class</option>
                                    {classSections.map((cs) => (
                                        <option key={cs.id} value={`${cs.name}-${cs.section}`}>
                                            Class {cs.name}-{cs.section}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <input type="date" disabled className="input-field opacity-60 cursor-not-allowed" value={editForm.joinDate} onChange={(e) => setEditForm((p) => ({ ...p, joinDate: e.target.value }))} placeholder="Join Date" />
                            <input type="number" className="input-field bg-white/5 border-white/15" value={editForm.salary} onChange={(e) => setEditForm((p) => ({ ...p, salary: e.target.value }))} placeholder="Salary" />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button className="btn-secondary" onClick={() => { setEditOpen(false); setSelectedTeacher(null); }}>Cancel</button>
                            <button className="btn-primary" disabled={saving} onClick={saveTeacherChanges}>{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteOpen && teacherToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-md glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Teacher</h3>
                        <p className="text-sm text-slate-400">Are you sure you want to delete <span className="text-white font-medium">{teacherToDelete.name}</span> ({teacherToDelete.employeeId})? This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button className="btn-secondary" disabled={deleting} onClick={() => { setDeleteOpen(false); setTeacherToDelete(null); }}>Cancel</button>
                            <button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={deleting} onClick={confirmDeleteTeacher}>{deleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
