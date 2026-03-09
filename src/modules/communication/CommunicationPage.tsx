import { useEffect, useState } from 'react';
import { Plus, Megaphone, Users, GraduationCap, BookOpen } from 'lucide-react';
import { firebaseAnnouncementService } from '../../services/firebaseAnnouncementService';
import type { Announcement } from '../../types';

const priorityColors = {
    high: 'badge-red',
    medium: 'badge-yellow',
    low: 'badge-green',
};

const targetIcons = {
    all: Megaphone,
    student: Users,
    students: Users,
    student_parent: Users,
    teachers: GraduationCap,
    parent: BookOpen,
    parents: BookOpen,
};

const normalizeDate = (input: unknown): string => {
    if (typeof input === 'string') return input;
    if (input && typeof input === 'object' && 'seconds' in input) {
        const ts = input as { seconds: number };
        return new Date(ts.seconds * 1000).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
};

const formatAudience = (target: string): string => {
    if (target === 'student' || target === 'students') return 'Student';
    if (target === 'parent' || target === 'parents') return 'Parent';
    if (target === 'teachers') return 'Teachers';
    if (target === 'student_parent') return 'Student + Parent';
    return 'All';
};

export default function CommunicationPage() {
    const rawUser = localStorage.getItem('currentUser');
    const currentRole = rawUser ? (JSON.parse(rawUser) as { role?: string }).role : 'admin';
    const isAdmin = currentRole === 'admin';

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        target: 'student' as Announcement['target'],
        priority: 'medium' as Announcement['priority'],
        date: new Date().toISOString().split('T')[0],
        content: '',
    });

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const rows = await firebaseAnnouncementService.getAnnouncements();
            const normalized = rows.map((row) => ({
                ...row,
                date: normalizeDate(row.date),
            }));
            setAnnouncements(normalized);
        } catch (err) {
            console.error('Error loading announcements:', err);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handlePublish = async () => {
        setError('');
        if (!formData.title || !formData.target || !formData.priority || !formData.date || !formData.content) {
            setError('Please fill all fields before publishing.');
            return;
        }

        try {
            setSubmitting(true);
            await firebaseAnnouncementService.addAnnouncement({
                title: formData.title,
                content: formData.content,
                target: formData.target,
                priority: formData.priority,
                date: formData.date,
                author: 'Admin',
            });

            setFormData({
                title: '',
                target: 'student',
                priority: 'medium',
                date: new Date().toISOString().split('T')[0],
                content: '',
            });
            setShowForm(false);
            await fetchAnnouncements();
        } catch (err) {
            console.error('Error publishing announcement:', err);
            setError('Failed to publish announcement. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Communication</h1>
                    <p className="page-subtitle">Manage announcements and notifications</p>
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4" /> New Announcement
                    </button>
                )}
            </div>

            {isAdmin && showForm && (
                <div className="glass-card p-6 max-w-2xl space-y-5">
                    <h2 className="text-base font-semibold text-white">Create Announcement</h2>
                    {error && (
                        <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                        <input
                            className="input-field"
                            placeholder="Announcement title..."
                            value={formData.title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Audience</label>
                            <select
                                className="select-field"
                                value={formData.target}
                                onChange={(e) => setFormData((prev) => ({ ...prev, target: e.target.value as Announcement['target'] }))}
                            >
                                <option value="student">Student</option>
                                <option value="parent">Parent</option>
                                <option value="all">All</option>
                                <option value="teachers">Teachers</option>
                                <option value="student_parent">Student + Parent (Both)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                            <select
                                className="select-field"
                                value={formData.priority}
                                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as Announcement['priority'] }))}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
                        <textarea
                            className="input-field resize-none"
                            rows={4}
                            placeholder="Announcement content..."
                            value={formData.content}
                            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-primary flex-1 justify-center" disabled={submitting} onClick={handlePublish}>
                            {submitting ? 'Publishing...' : 'Publish Announcement'}
                        </button>
                        <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {loading && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-sm text-slate-400 text-center">
                        Loading announcements...
                    </div>
                )}
                {!loading && announcements.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-sm text-slate-400 text-center">
                        No announcements found.
                    </div>
                )}
                {announcements.map((ann: Announcement) => {
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
                                        <span className="badge badge-purple">For: {formatAudience(ann.target)}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{ann.content}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                        <span>By {ann.author}</span>
                                        <span>•</span>
                                        <span>{new Date(normalizeDate(ann.date)).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
