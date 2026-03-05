import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Send, Receipt, AlertCircle } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { mockFeePayments, mockStudents } from '../../data/mockData';
import type { FeePayment } from '../../types';

const paymentColumns = [
    { key: 'receiptNo', header: 'Receipt', render: (p: FeePayment) => <span className="font-mono text-xs text-violet-400">{p.receiptNo}</span> },
    { key: 'studentName', header: 'Student', sortable: true, render: (p: FeePayment) => <span className="text-white">{p.studentName}</span> },
    { key: 'class', header: 'Class', render: (p: FeePayment) => <span className="text-slate-400">{p.class}</span> },
    { key: 'amount', header: 'Amount', sortable: true, render: (p: FeePayment) => <span className="text-emerald-400 font-mono">₹{p.amount.toLocaleString('en-IN')}</span> },
    { key: 'date', header: 'Date', render: (p: FeePayment) => <span className="text-slate-400 text-xs">{new Date(p.date).toLocaleDateString('en-IN')}</span> },
    {
        key: 'method', header: 'Method',
        render: (p: FeePayment) => <span className="badge badge-blue capitalize">{p.method}</span>,
    },
    {
        key: 'status', header: 'Status',
        render: (p: FeePayment) => (
            <span className={`badge capitalize ${p.status === 'paid' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : p.status === 'partial' ? 'badge-blue' : 'badge-yellow'}`}>
                {p.status}
            </span>
        ),
    },
];

const pendingStudents = mockStudents.filter(s => ['pending', 'overdue', 'partial'].includes(s.feeStatus));

export default function FinancePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [studentSearch, setStudentSearch] = useState('');
    
    // Determine active tab from URL
    const getActiveTab = () => {
        if (location.pathname.includes('/payment')) return 'payment';
        if (location.pathname.includes('/pending')) return 'pending';
        if (location.pathname.includes('/new')) return 'new';
        return 'structure';
    };
    
    const tab = getActiveTab();

    return (
        <div className="space-y-6">
            <div className="section-header">
                <div>
                    <h1 className="page-title">Finance & Fee Management</h1>
                    <p className="page-subtitle">Track payments, manage fee structures</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Collected', value: '₹28.60L', color: 'text-emerald-400' },
                    { label: 'Pending', value: '₹3.42L', color: 'text-amber-400' },
                    { label: 'Overdue', value: '₹1.18L', color: 'text-red-400' },
                    { label: 'This Month', value: '₹2.98L', color: 'text-violet-400' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-4 text-center">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
                {[
                    { key: 'structure', label: 'Fee Structure', path: '/finance/structure' },
                    { key: 'payment', label: 'Payment History', path: '/finance/payment' },
                    { key: 'pending', label: 'Pending Dues', path: '/finance/pending' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => navigate(t.path)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'structure' && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Fee Structure by Class</h3>
                        <button className="btn-primary py-2 px-4 text-sm">Add Structure</button>
                    </div>
                    <div className="space-y-3">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
                                <div>
                                    <div className="text-sm text-white font-medium">Class {i + 1}</div>
                                    <div className="text-xs text-slate-400">Academic Year 2025-26</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-400">₹{(25000 + i * 2000).toLocaleString('en-IN')}</div>
                                    <div className="text-xs text-slate-400">per year</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'payment' && (
                <div className="glass-card p-6">
                    <DataTable
                        data={mockFeePayments}
                        columns={paymentColumns}
                        searchPlaceholder="Search payments..."
                        actions={() => (
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Download Receipt">
                                <Receipt className="w-3.5 h-3.5" />
                            </button>
                        )}
                    />
                </div>
            )}

            {tab === 'pending' && (
                <div className="glass-card p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-4">
                        <AlertCircle className="w-4 h-4" />
                        {pendingStudents.length} students with outstanding fees
                    </div>
                    {pendingStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-red-300 text-sm font-bold">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm text-white font-medium">{s.name}</div>
                                    <div className="text-xs text-slate-400">Class {s.class}-{s.section} • {s.phone}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`badge capitalize ${s.feeStatus === 'overdue' ? 'badge-red' : s.feeStatus === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>
                                    {s.feeStatus}
                                </span>
                                <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                                    <Send className="w-3 h-3" /> Remind
                                </button>
                                <button className="btn-primary py-1.5 px-3 text-xs">Collect</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'new' && (
                <div className="glass-card p-6 max-w-2xl">
                    <h2 className="text-base font-semibold text-white mb-6">Record New Payment</h2>
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Search Student</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    className="input-field pl-9"
                                    placeholder="Name, Roll No, or Phone..."
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (₹)</label>
                                <input type="number" className="input-field" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method</label>
                                <select className="select-field">
                                    <option>Cash</option>
                                    <option>Online Transfer</option>
                                    <option>Card</option>
                                    <option>Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fee Category</label>
                                <select className="select-field">
                                    <option>Tuition Fee</option>
                                    <option>Transport Fee</option>
                                    <option>Activity Fee</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Date</label>
                                <input type="date" className="input-field" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Remarks</label>
                            <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..." />
                        </div>
                        <button className="btn-primary w-full justify-center">
                            <Receipt className="w-4 h-4" /> Generate Receipt & Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
