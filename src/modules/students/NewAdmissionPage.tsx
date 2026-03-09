import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Check } from 'lucide-react';
import { firebaseStudentService } from '../../services/firebaseStudentService';
import { firebaseClassService } from '../../services/firebaseClassService';
import type { ClassSection, Gender } from '../../types';

const sections = ['Personal Information', 'Academic Details', 'Parent / Guardian', 'Documents'];

export default function NewAdmissionPage() {
    const navigate = useNavigate();
    const [classSections, setClassSections] = useState<ClassSection[]>([]);
    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdRollNo, setCreatedRollNo] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        bloodGroup: '',
        address: '',
        gender: '' as '' | Gender,
        studentClass: '',
        section: '',
        admissionDate: '',
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
    });

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

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

        loadClassSections();
    }, []);

    const availableClasses = Array.from(new Set(classSections.map((cs) => cs.name))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const availableSections = classSections
        .filter((cs) => cs.name === formData.studentClass)
        .map((cs) => cs.section);

    const submitAdmission = async () => {
        setError('');
        if (!formData.firstName || !formData.email || !formData.phone || !formData.gender || !formData.studentClass || !formData.section || !formData.admissionDate || !formData.fatherName || !formData.fatherPhone || !formData.address || !formData.dob) {
            setError('Please complete all required fields before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const count = await firebaseStudentService.getStudentCount();
            const rollNo = `S${String(count + 1).padStart(3, '0')}`;
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();

            await firebaseStudentService.addStudent({
                rollNo,
                name: fullName,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob,
                class: formData.studentClass,
                section: formData.section,
                parentName: formData.fatherName,
                parentPhone: formData.fatherPhone,
                address: formData.address,
                admissionDate: formData.admissionDate,
                status: 'active',
                bloodGroup: formData.bloodGroup || undefined,
                feeStatus: 'pending',
            });

            setCreatedRollNo(rollNo);
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting admission:', err);
            setError('Failed to submit admission. Check Firestore rules and try again.');
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
                    <h2 className="text-2xl font-bold text-white">Admission Submitted!</h2>
                    <p className="text-slate-400 mt-2">The admission form has been submitted successfully.<br />Roll No: <span className="text-violet-400 font-mono">{createdRollNo}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary" onClick={() => navigate('/students')}>
                        Go To Students
                    </button>
                    <button className="btn-primary" onClick={() => { setSubmitted(false); setStep(0); }}>
                        New Admission
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="page-title">New Admission</h1>
                <p className="page-subtitle">Fill in the details to register a new student</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2">
                {sections.map((sec, i) => (
                    <div key={sec} className="flex items-center gap-2">
                        <button
                            onClick={() => setStep(i)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${i === step ? 'bg-violet-600 text-white' :
                                    i < step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {i < step ? <Check className="w-3.5 h-3.5" /> : <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">{i + 1}</span>}
                            <span className="hidden sm:inline">{sec}</span>
                        </button>
                        {i < sections.length - 1 && <ChevronRight className="w-4 h-4 text-slate-600" />}
                    </div>
                ))}
            </div>

            {/* Form Sections */}
            <div className="glass-card p-6">
                <h2 className="text-base font-semibold text-white mb-6">{sections[step]}</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
                            <input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} type="text" placeholder="Enter first name" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
                            <input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} type="text" placeholder="Enter last name" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                            <input value={formData.email} onChange={(e) => updateField('email', e.target.value)} type="email" placeholder="student@school.edu" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                            <input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} type="tel" placeholder="9876543210" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date of Birth</label>
                            <input value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} type="date" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Blood Group</label>
                            <input value={formData.bloodGroup} onChange={(e) => updateField('bloodGroup', e.target.value)} type="text" placeholder="e.g. O+" className="input-field" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
                            <input value={formData.address} onChange={(e) => updateField('address', e.target.value)} type="text" placeholder="Full address" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
                            <select value={formData.gender} onChange={(e) => updateField('gender', e.target.value)} className="select-field">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Class</label>
                            <select value={formData.studentClass} onChange={(e) => updateField('studentClass', e.target.value)} className="select-field">
                                <option value="">Select Class</option>
                                {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Section</label>
                            <select
                                value={formData.section}
                                onChange={(e) => updateField('section', e.target.value)}
                                className="select-field"
                                disabled={!formData.studentClass}
                            >
                                <option value="">Select Section</option>
                                {availableSections.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Admission Date</label>
                            <input value={formData.admissionDate} onChange={(e) => updateField('admissionDate', e.target.value)} type="date" className="input-field" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Father's Name</label>
                            <input value={formData.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} type="text" placeholder="Father's full name" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Father's Phone</label>
                            <input value={formData.fatherPhone} onChange={(e) => updateField('fatherPhone', e.target.value)} type="tel" placeholder="9876543210" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Mother's Name</label>
                            <input value={formData.motherName} onChange={(e) => updateField('motherName', e.target.value)} type="text" placeholder="Mother's full name" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Mother's Phone</label>
                            <input value={formData.motherPhone} onChange={(e) => updateField('motherPhone', e.target.value)} type="tel" placeholder="9876543210" className="input-field" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5">
                        {['Student Photo', 'Birth Certificate', 'Previous Marksheet', 'Aadhar Card'].map(doc => (
                            <div key={doc} className="border border-dashed border-white/15 rounded-xl p-5 hover:border-violet-500/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{doc}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG — Max 5MB</div>
                                    </div>
                                    <button className="ml-auto btn-secondary text-xs py-2 px-3">Upload</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/8">
                    <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
                        Back
                    </button>
                    {step < sections.length - 1 ? (
                        <button onClick={() => setStep(step + 1)} className="btn-primary">
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={submitAdmission} disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                            <Check className="w-4 h-4" /> Submit Admission
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
