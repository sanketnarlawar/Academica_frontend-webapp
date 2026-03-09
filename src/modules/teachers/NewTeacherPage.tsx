import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import { firebaseClassService } from '../../services/firebaseClassService';
import { firebaseSubjectService } from '../../services/firebaseSubjectService';
import type { ClassSection, Gender, Subject } from '../../types';

export default function NewTeacherPage() {
    const navigate = useNavigate();
    const [classSections, setClassSections] = useState<ClassSection[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdEmployeeId, setCreatedEmployeeId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: '' as '' | Gender,
        dob: '',
        qualification: '',
        experience: '',
        department: '',
        selectedSubjects: [] as string[],
        classSection: '',
        joinDate: '',
        salary: '',
        status: 'active' as 'active' | 'inactive',
    });

    useEffect(() => {
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

        loadClassSections();
        loadSubjects();
    }, []);

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setError('');
        if (!formData.name || !formData.email || !formData.phone || !formData.gender || !formData.dob || !formData.qualification || !formData.department || !formData.joinDate) {
            setError('Please fill all required fields.');
            return;
        }

        const experience = Number(formData.experience || 0);
        const salary = Number(formData.salary || 0);
        if (Number.isNaN(experience) || Number.isNaN(salary)) {
            setError('Experience and salary should be valid numbers.');
            return;
        }

        setSubmitting(true);
        try {
            const count = await firebaseTeacherService.getTeacherCount();
            const employeeId = `T${String(count + 1).padStart(3, '0')}`;
            const subjects = formData.selectedSubjects;
            const classes = formData.classSection ? [formData.classSection] : [];

            await firebaseTeacherService.addTeacher({
                employeeId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob,
                subjects,
                classes,
                qualification: formData.qualification,
                experience,
                joinDate: formData.joinDate,
                status: formData.status,
                department: formData.department,
                salary,
            });

            setCreatedEmployeeId(employeeId);
            setSubmitted(true);
        } catch (err) {
            console.error('Error adding teacher:', err);
            setError('Failed to add teacher. Check Firestore permissions and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Teacher Added!</h2>
                    <p className="text-slate-400 mt-2">
                        Teacher profile has been saved successfully.<br />
                        Employee ID: <span className="text-indigo-400 font-mono">{createdEmployeeId}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary" onClick={() => navigate('/teachers')}>
                        Go To Teachers
                    </button>
                    <button className="btn-primary" onClick={() => setSubmitted(false)}>
                        Add Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="page-title">Add Teacher</h1>
                <p className="page-subtitle">Create a new teacher profile and save it to Firebase</p>
            </div>

            <div className="glass-card p-6">
                <h2 className="text-base font-semibold text-white mb-6">Teacher Information</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
                        <input value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="input-field" placeholder="Enter teacher name" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                        <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="input-field" placeholder="teacher@school.edu" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone *</label>
                        <input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="input-field" placeholder="9876543210" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender *</label>
                        <select value={formData.gender} onChange={(e) => updateField('gender', e.target.value)} className="select-field">
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Date of Birth *</label>
                        <input type="date" value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Qualification *</label>
                        <input value={formData.qualification} onChange={(e) => updateField('qualification', e.target.value)} className="input-field" placeholder="M.Sc, B.Ed" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience (years)</label>
                        <input type="number" min="0" value={formData.experience} onChange={(e) => updateField('experience', e.target.value)} className="input-field" placeholder="5" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Department *</label>
                        <input value={formData.department} onChange={(e) => updateField('department', e.target.value)} className="input-field" placeholder="Science" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Subjects</label>
                        <select
                            value={formData.selectedSubjects[0] || ''}
                            onChange={(e) => {
                                setFormData((p) => ({ ...p, selectedSubjects: e.target.value ? [e.target.value] : [] }));
                            }}
                            className="select-field"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.name}>{subject.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Class Section</label>
                        <select value={formData.classSection} onChange={(e) => updateField('classSection', e.target.value)} className="select-field">
                            <option value="">Select class section</option>
                            {classSections.map((cs) => (
                                <option key={cs.id} value={`${cs.name}-${cs.section}`}>
                                    Class {cs.name}-{cs.section}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Join Date *</label>
                        <input type="date" value={formData.joinDate} onChange={(e) => updateField('joinDate', e.target.value)} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Salary</label>
                        <input type="number" min="0" value={formData.salary} onChange={(e) => updateField('salary', e.target.value)} className="input-field" placeholder="45000" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                        <select value={formData.status} onChange={(e) => updateField('status', e.target.value)} className="select-field">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-white/8">
                    <button onClick={() => navigate('/teachers')} className="btn-secondary">
                        Back
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? 'Saving...' : (<><ChevronRight className="w-4 h-4" /> Save Teacher</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
