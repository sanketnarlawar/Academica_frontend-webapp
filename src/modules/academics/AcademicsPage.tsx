import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { mockClasses, mockSubjects } from '../../data/mockData';
import type { ClassSection, Subject } from '../../types';

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
                    <button className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
                </div>
                <div className="glass-card p-6">
                    <DataTable
                        data={mockClasses}
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

            {/* Subjects Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Subject Management</h2>
                    <button className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
                </div>
                <div className="glass-card p-6">
                    <DataTable
                        data={mockSubjects}
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
        </div>
    );
}
