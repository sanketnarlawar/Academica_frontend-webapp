import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { mockClasses, mockSubjects } from '../../data/mockData';
import type { ClassSection, Subject, Teacher } from '../../types';
import { firebaseClassService } from '../../services/firebaseClassService';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import { firebaseSubjectService } from '../../services/firebaseSubjectService';

const classColumns = [
    {
        key: 'name', header: 'Class', sortable: true,
        render: (c: ClassSection) => <span className="text-white font-semibold">Class {c.name} - {c.section}</span>,
    },
    { key: 'classTeacher', header: 'Class Teacher', render: (c: ClassSection) => <span className="text-slate-300">{c.classTeacher}</span> },
    { key: 'room', header: 'Room', width: '80px', render: (c: ClassSection) => <span className="font-mono text-violet-400 text-xs">{c.room}</span> },
    {
        key: 'totalStudents', header: 'Strength', sortable: true,
        render: (c: ClassSection) => (
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-16">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(c.totalStudents / c.capacity) * 100}%` }} />
                </div>
                <span className="text-slate-300 text-xs">{c.totalStudents}/{c.capacity}</span>
            </div>
        ),
    },
];

const subjectColumns = [
    { key: 'code', header: 'Code', render: (s: Subject) => <span className="font-mono text-xs text-indigo-400">{s.code}</span> },
    { key: 'name', header: 'Subject', sortable: true, render: (s: Subject) => <span className="text-white">{s.name}</span> },
    { key: 'class', header: 'Class', render: (s: Subject) => <span className="text-slate-400">Class {s.class}</span> },
    { key: 'teacher', header: 'Teacher', render: (s: Subject) => <span className="text-slate-300">{s.teacher}</span> },
    { key: 'periods', header: 'Periods/Week', render: (s: Subject) => <span className="text-slate-400">{s.periods}</span> },
    {
        key: 'type', header: 'Type',
        render: (s: Subject) => (
            <span className={`badge capitalize ${s.type === 'core' ? 'badge-blue' : s.type === 'elective' ? 'badge-purple' : 'badge-green'}`}>{s.type}</span>
        ),
    },
];

export default function AcademicsPage() {
    const [classes, setClasses] = useState<ClassSection[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
    const [addingClass, setAddingClass] = useState(false);
    const [addingSubject, setAddingSubject] = useState(false);
    const [error, setError] = useState('');
    const [subjectError, setSubjectError] = useState('');
    const [classForm, setClassForm] = useState({
        name: '',
        section: '',
        classTeacher: '',
        capacity: '',
        room: '',
    });
    const [subjectForm, setSubjectForm] = useState({
        code: '',
        name: '',
        class: '',
        teacher: '',
        periods: '',
        type: 'core' as 'core' | 'elective' | 'activity',
    });

    const loadClasses = async () => {
        try {
            setLoading(true);
            const data = await firebaseClassService.getClasses();
            setClasses(data);
        } catch (err) {
            console.error('Error loading classes:', err);
            setClasses(mockClasses);
        } finally {
            setLoading(false);
        }
    };

    const loadTeachers = async () => {
        try {
            const data = await firebaseTeacherService.getTeachers();
            setTeachers(data.filter((t) => t.status === 'active'));
        } catch (err) {
            console.error('Error loading teachers:', err);
            setTeachers([]);
        }
    };

    const loadSubjects = async () => {
        try {
            const data = await firebaseSubjectService.getSubjects();
            setSubjects(data);
        } catch (err) {
            console.error('Error loading subjects:', err);
            setSubjects(mockSubjects);
        }
    };

    useEffect(() => {
        loadClasses();
        loadTeachers();
        loadSubjects();
    }, []);

    const handleAddClass = async () => {
        setError('');
        if (!classForm.name || !classForm.section || !classForm.classTeacher || !classForm.capacity || !classForm.room) {
            setError('Please fill all fields.');
            return;
        }

        const capacity = Number(classForm.capacity);
        if (Number.isNaN(capacity) || capacity <= 0) {
            setError('Capacity must be a valid positive number.');
            return;
        }

        setAddingClass(true);
        try {
            await firebaseClassService.addClass({
                name: classForm.name,
                section: classForm.section.toUpperCase(),
                classTeacher: classForm.classTeacher,
                totalStudents: 0,
                capacity,
                room: classForm.room,
            });

            setShowAddClassModal(false);
            setClassForm({ name: '', section: '', classTeacher: '', capacity: '', room: '' });
            await loadClasses();
        } catch (err) {
            console.error('Error adding class section:', err);
            setError('Failed to add class section. Check Firestore permissions.');
        } finally {
            setAddingClass(false);
        }
    };

    const handleAddSubject = async () => {
        setSubjectError('');
        if (!subjectForm.code || !subjectForm.name || !subjectForm.class || !subjectForm.teacher || !subjectForm.type) {
            setSubjectError('Please fill all fields.');
            return;
        }

        const periods = subjectForm.periods ? Number(subjectForm.periods) : 0;
        if (Number.isNaN(periods) || periods < 0) {
            setSubjectError('Periods must be a valid number.');
            return;
        }

        setAddingSubject(true);
        try {
            await firebaseSubjectService.addSubject({
                code: subjectForm.code.toUpperCase(),
                name: subjectForm.name,
                class: subjectForm.class,
                teacher: subjectForm.teacher,
                periods,
                type: subjectForm.type,
            });

            setShowAddSubjectModal(false);
            setSubjectForm({ code: '', name: '', class: '', teacher: '', periods: '', type: 'core' });
            await loadSubjects();
        } catch (err) {
            console.error('Error adding subject:', err);
            setSubjectError('Failed to add subject. Check Firestore permissions.');
        } finally {
            setAddingSubject(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading classes...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="page-title">Academic Management</h1>
                <p className="page-subtitle">Manage classes, sections, and subjects</p>
            </div>

            {/* Classes Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Classes & Sections</h2>
                    <button className="btn-primary" onClick={() => setShowAddClassModal(true)}><Plus className="w-4 h-4" /> Add Class Section</button>
                </div>
                <div className="glass-card p-6">
                    <DataTable
                        data={classes}
                        columns={classColumns}
                        searchPlaceholder="Search classes..."
                        pageSize={6}
                        actions={() => (
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                    />
                </div>
            </div>

            {showAddClassModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#141624] p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Add Class Section</h3>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                className="input-field"
                                placeholder="Class (e.g. 10)"
                                value={classForm.name}
                                onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
                            />
                            <input
                                className="input-field"
                                placeholder="Section (e.g. A)"
                                value={classForm.section}
                                onChange={(e) => setClassForm((p) => ({ ...p, section: e.target.value }))}
                            />
                            <select
                                className="select-field"
                                value={classForm.classTeacher}
                                onChange={(e) => setClassForm((p) => ({ ...p, classTeacher: e.target.value }))}
                            >
                                <option value="">Select Class Teacher</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Capacity"
                                value={classForm.capacity}
                                onChange={(e) => setClassForm((p) => ({ ...p, capacity: e.target.value }))}
                            />
                            <input
                                className="input-field sm:col-span-2"
                                placeholder="Room (e.g. B-204)"
                                value={classForm.room}
                                onChange={(e) => setClassForm((p) => ({ ...p, room: e.target.value }))}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                className="btn-secondary"
                                disabled={addingClass}
                                onClick={() => {
                                    setShowAddClassModal(false);
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                disabled={addingClass}
                                onClick={handleAddClass}
                            >
                                {addingClass ? 'Saving...' : 'Save Class Section'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subjects Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Subject Management</h2>
                    <button className="btn-primary" onClick={() => setShowAddSubjectModal(true)}><Plus className="w-4 h-4" /> Add Subject</button>
                </div>
                <div className="glass-card p-6">
                    <DataTable
                        data={subjects}
                        columns={subjectColumns}
                        searchPlaceholder="Search subjects..."
                        actions={() => (
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        )}
                    />
                </div>
            </div>

            {showAddSubjectModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#141624] p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Add Subject</h3>

                        {subjectError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {subjectError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                className="input-field"
                                placeholder="Subject Code (e.g. PHY101)"
                                value={subjectForm.code}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))}
                            />
                            <input
                                className="input-field"
                                placeholder="Subject Name"
                                value={subjectForm.name}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                            />
                            <select
                                className="select-field"
                                value={subjectForm.class}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, class: e.target.value }))}
                            >
                                <option value="">Select Class Section</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={`${c.name}-${c.section}`}>
                                        Class {c.name}-{c.section}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="select-field"
                                value={subjectForm.teacher}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, teacher: e.target.value }))}
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Periods per week (optional)"
                                value={subjectForm.periods}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, periods: e.target.value }))}
                            />
                            <select
                                className="select-field"
                                value={subjectForm.type}
                                onChange={(e) => setSubjectForm((p) => ({ ...p, type: e.target.value as 'core' | 'elective' | 'activity' }))}
                            >
                                <option value="core">Core</option>
                                <option value="elective">Elective</option>
                                <option value="activity">Activity</option>
                            </select>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                className="btn-secondary"
                                disabled={addingSubject}
                                onClick={() => {
                                    setShowAddSubjectModal(false);
                                    setSubjectError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                disabled={addingSubject}
                                onClick={handleAddSubject}
                            >
                                {addingSubject ? 'Saving...' : 'Save Subject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
