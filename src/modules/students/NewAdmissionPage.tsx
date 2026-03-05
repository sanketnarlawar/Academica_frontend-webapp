import { useState } from 'react';
import { ChevronRight, Upload, Check } from 'lucide-react';

const sections = ['Personal Information', 'Academic Details', 'Parent / Guardian', 'Documents'];

export default function NewAdmissionPage() {
    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Admission Submitted!</h2>
                    <p className="text-slate-400 mt-2">The admission form has been submitted successfully.<br />Roll No: <span className="text-violet-400 font-mono">S011</span></p>
                </div>
                <button className="btn-primary" onClick={() => { setSubmitted(false); setStep(0); }}>
                    New Admission
                </button>
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

                {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { label: 'First Name', placeholder: 'Enter first name' },
                            { label: 'Last Name', placeholder: 'Enter last name' },
                            { label: 'Email', placeholder: 'student@school.edu', type: 'email' },
                            { label: 'Phone', placeholder: '9876543210', type: 'tel' },
                            { label: 'Date of Birth', type: 'date' },
                            { label: 'Blood Group', placeholder: 'e.g. O+' },
                            { label: 'Address', placeholder: 'Full address' },
                        ].map(f => (
                            <div key={f.label} className={f.label === 'Address' ? 'sm:col-span-2' : ''}>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                                <input type={f.type || 'text'} placeholder={f.placeholder} className="input-field" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
                            <select className="select-field">
                                <option value="">Select Gender</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { label: 'Class', type: 'select', options: ['6', '7', '8', '9', '10'] },
                            { label: 'Section', type: 'select', options: ['A', 'B', 'C'] },
                            { label: 'Admission Date', type: 'date' },
                            { label: 'Previous School', placeholder: 'Name of previous school' },
                            { label: 'Previous Class', placeholder: 'e.g. Class 9' },
                            { label: 'Percentage', placeholder: 'e.g. 87%' },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                                {f.type === 'select' ? (
                                    <select className="select-field">
                                        <option value="">Select {f.label}</option>
                                        {f.options?.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input type={f.type || 'text'} placeholder={f.placeholder} className="input-field" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[
                            { label: "Father's Name", placeholder: "Father's full name" },
                            { label: "Father's Phone", placeholder: '9876543210', type: 'tel' },
                            { label: "Mother's Name", placeholder: "Mother's full name" },
                            { label: "Mother's Phone", placeholder: '9876543210', type: 'tel' },
                            { label: 'Email', placeholder: 'parent@email.com', type: 'email' },
                            { label: 'Occupation', placeholder: 'e.g. Engineer' },
                            { label: 'Emergency Contact', placeholder: '9876543210', type: 'tel' },
                            { label: 'Relation', placeholder: 'e.g. Uncle' },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                                <input type={f.type || 'text'} placeholder={f.placeholder} className="input-field" />
                            </div>
                        ))}
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
                        <button onClick={() => setSubmitted(true)} className="btn-primary">
                            <Check className="w-4 h-4" /> Submit Admission
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
