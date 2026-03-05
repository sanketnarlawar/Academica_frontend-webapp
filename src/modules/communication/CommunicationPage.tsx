import { useState } from 'react';
import { Plus, Megaphone, Users, GraduationCap, BookOpen } from 'lucide-react';
import { mockAnnouncements } from '../../data/mockData';
import type { Announcement } from '../../types';

const priorityColors = {
    high: 'badge-red',
    medium: 'badge-yellow',
    low: 'badge-green',
};

const targetIcons: Record<string, React.ElementType> = {
    all: Megaphone,
    students: Users,
    teachers: GraduationCap,
    parents: BookOpen,
};

export default function CommunicationPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Communication</h1>
                    <p className="page-subtitle">Manage announcements and notifications</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4" /> New Announcement
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 max-w-2xl space-y-5">
                    <h2 className="text-base font-semibold text-white">Create Announcement</h2>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                        <input className="input-field" placeholder="Announcement title..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Audience</label>
                            <select className="select-field">
                                <option value="all">All</option>
                                <option value="students">Students</option>
                                <option value="teachers">Teachers</option>
                                <option value="parents">Parents</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                            <select className="select-field">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
                        <textarea className="input-field resize-none" rows={4} placeholder="Announcement content..." />
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-primary flex-1 justify-center">Publish Announcement</button>
                        <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {mockAnnouncements.map((ann: Announcement) => {
                    const Icon = targetIcons[ann.target] || Megaphone;
                    return (
                        <div key={ann.id} className="glass-card p-5 hover:border-white/15 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-violet-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                                        <span className={`badge ${priorityColors[ann.priority]} capitalize`}>{ann.priority}</span>
                                        <span className="badge badge-purple capitalize">For: {ann.target}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{ann.content}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                        <span>By {ann.author}</span>
                                        <span>•</span>
                                        <span>{new Date(ann.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
