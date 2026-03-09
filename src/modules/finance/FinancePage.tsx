import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus, Send, Receipt, AlertCircle } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebaseFinanceService } from '../../services/firebaseFinanceService';
import { firebaseStudentService } from '../../services/firebaseStudentService';
import { firebaseClassService } from '../../services/firebaseClassService';
import type { FeePayment, FeeStructure, Student, ClassSection } from '../../types';

interface LocationState {
  studentId?: string;
}

const paymentStatusBadge = {
  paid: 'badge-green',
  pending: 'badge-yellow',
  overdue: 'badge-red',
  partial: 'badge-blue',
};

const pad = (value: number): string => String(value).padStart(2, '0');

const generateReceiptNo = (): string => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `RCP-${datePart}-${randomPart}`;
};

const normalizeDate = (input: unknown): string => {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object' && 'seconds' in input) {
    const maybeTimestamp = input as { seconds: number };
    return new Date(maybeTimestamp.seconds * 1000).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const formatDate = (date: string): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-IN');
};

const normalizeClassKey = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim().toLowerCase();
  if (!raw) return '';

  // Handle variants like "class-01", "Class 1", "01", and "1A".
  const digitMatch = raw.match(/\d+/);
  if (digitMatch) {
    return String(parseInt(digitMatch[0], 10));
  }

  return raw.replace(/[^a-z]/g, '');
};

export default function FinancePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tab = useMemo(() => {
    if (location.pathname.includes('/payment')) return 'payment';
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/new')) return 'new';
    return 'structure';
  }, [location.pathname]);

  const state = (location.state || {}) as LocationState;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [addStructureOpen, setAddStructureOpen] = useState(false);
  const [addStructureForm, setAddStructureForm] = useState({
    name: '',
    class: '',
    totalAmount: '',
    dueDate: '',
  });
  const [addingStructure, setAddingStructure] = useState(false);

  const [viewPaymentOpen, setViewPaymentOpen] = useState(false);
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [editingPayment, setEditingPayment] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    date: '',
    method: 'cash' as FeePayment['method'],
    status: 'paid' as FeePayment['status'],
  });

  const [newPaymentForm, setNewPaymentForm] = useState({
    class: '',
    studentId: '',
    amount: '',
    method: 'cash' as FeePayment['method'],
    category: 'Tuition Fee',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'paid' as FeePayment['status'],
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentRows, classRows, structureRows, paymentRows] = await Promise.all([
        firebaseStudentService.getStudents(),
        firebaseClassService.getClasses(),
        firebaseFinanceService.getFeeStructures(),
        firebaseFinanceService.getFeePayments(),
      ]);

      const normalizedPayments = paymentRows.map((payment) => ({
        ...payment,
        date: normalizeDate(payment.date),
      }));

      setStudents(studentRows);
      setClasses(classRows);
      setFeeStructures(structureRows);
      setFeePayments(normalizedPayments);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setStudents([]);
      setFeeStructures([]);
      setFeePayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  useEffect(() => {
    if (!state.studentId || tab !== 'new' || students.length === 0) return;
    const selectedStudent = students.find((student) => student.id === state.studentId);
    if (!selectedStudent) return;

    setNewPaymentForm((prev) => ({
      ...prev,
      studentId: state.studentId || prev.studentId,
      class: selectedStudent.class,
    }));
  }, [state.studentId, students, tab]);

  const studentsForSelectedClass = useMemo(() => {
    if (!newPaymentForm.class) return [];
    const selectedClassKey = normalizeClassKey(newPaymentForm.class);
    return students.filter((student) => normalizeClassKey(student.class) === selectedClassKey);
  }, [students, newPaymentForm.class]);

  // Calculate pending students based on actual fee structure vs payments
  const feeStructureByClassKey = useMemo(() => {
    const map = new Map<string, FeeStructure>();
    feeStructures.forEach((structure) => {
      const key = normalizeClassKey(structure.class);
      if (key && !map.has(key)) {
        map.set(key, structure);
      }
    });
    return map;
  }, [feeStructures]);

  const pendingStudents = useMemo(() => {
    return students.filter((student) => {
      // Find fee structure for this student's class
      const feeStructure = feeStructureByClassKey.get(normalizeClassKey(student.class));
      if (!feeStructure) return false; // No fee structure, skip

      // Calculate how much this student has paid
      const studentPayments = feePayments
        .filter((p) => p.studentId === student.id && (p.status === 'paid' || p.status === 'partial'))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Student has pending dues if they haven't paid the full structure amount
      return studentPayments < feeStructure.totalAmount;
    });
  }, [students, feeStructureByClassKey, feePayments]);

  // Extract unique class names for fee structure dropdown
  const uniqueClasses = useMemo(() => {
    const classNames = classes.map((cls) => cls.name);
    return Array.from(new Set(classNames)).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    });
  }, [classes]);

  const financeStats = useMemo(() => {
    // Calculate total collected from payments
    const totalCollected = feePayments
      .filter((p) => p.status === 'paid' || p.status === 'partial')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Calculate expected fees and actual pending amounts
    let actualPending = 0;
    let actualOverdue = 0;

    students.forEach((student) => {
      // Find fee structure for this student's class
      const feeStructure = feeStructureByClassKey.get(normalizeClassKey(student.class));
      if (feeStructure) {
        // Calculate how much this student has paid
        const studentPayments = feePayments
          .filter((p) => p.studentId === student.id && (p.status === 'paid' || p.status === 'partial'))
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Calculate remaining balance
        const remaining = feeStructure.totalAmount - studentPayments;

        if (remaining > 0) {
          actualPending += remaining;
          if (student.feeStatus === 'overdue') {
            actualOverdue += remaining;
          }
        }
      }
    });

    const now = new Date();
    const thisMonth = feePayments
      .filter((p) => {
        const d = new Date(p.date);
        return (
          !Number.isNaN(d.getTime()) &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          (p.status === 'paid' || p.status === 'partial')
        );
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return { 
      totalCollected, 
      pending: actualPending, 
      overdue: actualOverdue || actualPending, // Show overdue or pending if no overdue
      thisMonth 
    };
  }, [feePayments, students, feeStructureByClassKey]);

  const paymentColumns = [
    {
      key: 'receiptNo',
      header: 'Receipt',
      render: (p: FeePayment) => <span className="font-mono text-xs text-violet-400">{p.receiptNo}</span>,
    },
    {
      key: 'studentName',
      header: 'Student',
      sortable: true,
      render: (p: FeePayment) => <span className="text-white">{p.studentName}</span>,
    },
    {
      key: 'class',
      header: 'Class',
      render: (p: FeePayment) => <span className="text-slate-400">{p.class}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (p: FeePayment) => (
        <span className="text-emerald-400 font-mono">INR {Number(p.amount || 0).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (p: FeePayment) => <span className="text-slate-400 text-xs">{formatDate(p.date)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (p: FeePayment) => <span className="badge badge-blue capitalize">{p.method}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: FeePayment) => (
        <span className={`badge capitalize ${paymentStatusBadge[p.status] || paymentStatusBadge.pending}`}>
          {p.status}
        </span>
      ),
    },
  ];

  // Helper function to calculate pending amount for a student
  const getStudentPendingAmount = (studentId: string, studentClass: string): number => {
    const feeStructure = feeStructureByClassKey.get(normalizeClassKey(studentClass));
    if (!feeStructure) return 0;

    const studentPayments = feePayments
      .filter((p) => p.studentId === studentId && (p.status === 'paid' || p.status === 'partial'))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return Math.max(0, feeStructure.totalAmount - studentPayments);
  };

  const openPaymentView = (row: FeePayment) => {
    setSelectedPayment(row);
    setViewPaymentOpen(true);
  };

  const openPaymentEdit = (row: FeePayment) => {
    setSelectedPayment(row);
    setEditPaymentForm({
      amount: String(row.amount),
      date: row.date,
      method: row.method,
      status: row.status,
    });
    setEditPaymentOpen(true);
  };

  const openPaymentDelete = (row: FeePayment) => {
    setSelectedPayment(row);
    setDeletePaymentOpen(true);
  };

  const handleAddStructure = async () => {
    if (!addStructureForm.name || !addStructureForm.class || !addStructureForm.totalAmount || !addStructureForm.dueDate) {
      return;
    }

    try {
      setAddingStructure(true);
      const amount = Number(addStructureForm.totalAmount || 0);
      await firebaseFinanceService.addFeeStructure({
        name: addStructureForm.name,
        class: addStructureForm.class,
        totalAmount: amount,
        dueDate: addStructureForm.dueDate,
        components: [
          {
            id: `${Date.now()}`,
            name: 'Tuition Fee',
            amount,
            category: 'tuition',
          },
        ],
      });

      setAddStructureOpen(false);
      setAddStructureForm({ name: '', class: '', totalAmount: '', dueDate: '' });
      await fetchFinanceData();
    } catch (error) {
      console.error('Error adding fee structure:', error);
    } finally {
      setAddingStructure(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!newPaymentForm.studentId || !newPaymentForm.amount || !newPaymentForm.date) return;

    try {
      setRecordingPayment(true);
      const selectedStudent = students.find((s) => s.id === newPaymentForm.studentId);
      if (!selectedStudent) return;

      await firebaseFinanceService.addFeePayment({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        class: `${selectedStudent.class}${selectedStudent.section}`,
        amount: Number(newPaymentForm.amount || 0),
        date: newPaymentForm.date,
        method: newPaymentForm.method,
        receiptNo: generateReceiptNo(),
        status: newPaymentForm.status,
      });

      setNewPaymentForm({
        class: '',
        studentId: '',
        amount: '',
        method: 'cash',
        category: 'Tuition Fee',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        status: 'paid',
      });

      await fetchFinanceData();
      navigate('/finance/payment', { replace: true });
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      setEditingPayment(true);
      await firebaseFinanceService.updateFeePayment(selectedPayment.id, {
        amount: Number(editPaymentForm.amount || 0),
        date: editPaymentForm.date,
        method: editPaymentForm.method,
        status: editPaymentForm.status,
      });
      setEditPaymentOpen(false);
      setSelectedPayment(null);
      await fetchFinanceData();
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setEditingPayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      setDeletingPayment(true);
      await firebaseFinanceService.deleteFeePayment(selectedPayment.id);
      setDeletePaymentOpen(false);
      setSelectedPayment(null);
      await fetchFinanceData();
    } catch (error) {
      console.error('Error deleting payment:', error);
    } finally {
      setDeletingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading finance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title">Finance & Fee Management</h1>
          <p className="page-subtitle">Track payments, manage fee structures</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `INR ${financeStats.totalCollected.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'Pending', value: `INR ${financeStats.pending.toLocaleString('en-IN')}`, color: 'text-amber-400' },
          { label: 'Overdue', value: `INR ${financeStats.overdue.toLocaleString('en-IN')}`, color: 'text-red-400' },
          { label: 'This Month', value: `INR ${financeStats.thisMonth.toLocaleString('en-IN')}`, color: 'text-violet-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
        {[
          { key: 'structure', label: 'Fee Structure', path: '/finance/structure' },
          { key: 'payment', label: 'Payment History', path: '/finance/payment' },
          { key: 'pending', label: 'Pending Dues', path: '/finance/pending' },
          { key: 'new', label: 'Record Payment', path: '/finance/new' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => navigate(t.path)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'structure' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Fee Structure by Class</h3>
            <button className="btn-primary py-2 px-4 text-sm" onClick={() => setAddStructureOpen(true)}>
              <Plus className="w-4 h-4" /> Add Structure
            </button>
          </div>

          {feeStructures.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-sm text-slate-400 text-center">
              No fee structures found. Add your first structure.
            </div>
          ) : (
            <div className="space-y-3">
              {feeStructures.map((structure) => (
                <div key={structure.id} className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8">
                  <div>
                    <div className="text-sm text-white font-medium">{structure.name}</div>
                    <div className="text-xs text-slate-400">
                      Class {structure.class} • Due {formatDate(structure.dueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      INR {Number(structure.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-400">per year</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'payment' && (
        <div className="glass-card p-6">
          <DataTable
            data={feePayments}
            columns={paymentColumns}
            searchPlaceholder="Search payments..."
            actions={(row) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openPaymentView(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  title="View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openPaymentEdit(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openPaymentDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
          {pendingStudents.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-sm text-slate-400 text-center">
              No pending dues found.
            </div>
          )}
          {pendingStudents.map((s) => {
            const pendingAmount = getStudentPendingAmount(s.id, s.class);
            const feeStructure = feeStructureByClassKey.get(normalizeClassKey(s.class));
            const totalFee = feeStructure ? feeStructure.totalAmount : 0;
            const paidAmount = totalFee - pendingAmount;
            
            // Calculate status based on payment
            let calculatedStatus = 'pending';
            if (paidAmount > 0 && paidAmount < totalFee) {
              calculatedStatus = 'partial';
            } else if (paidAmount === 0) {
              calculatedStatus = s.feeStatus === 'overdue' ? 'overdue' : 'pending';
            }
            
            return (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-red-300 text-sm font-bold">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{s.name}</div>
                    <div className="text-xs text-slate-400">
                      Class {s.class}-{s.section} • {s.phone}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Paid: INR {paidAmount.toLocaleString('en-IN')} / {totalFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="text-sm font-bold text-red-400">
                      INR {pendingAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-slate-500">pending</div>
                  </div>
                  <span className={`badge capitalize ${paymentStatusBadge[calculatedStatus as keyof typeof paymentStatusBadge] || paymentStatusBadge.pending}`}>
                    {calculatedStatus}
                  </span>
                  <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <Send className="w-3 h-3" /> Remind
                  </button>
                  <button
                    className="btn-primary py-1.5 px-3 text-xs"
                    onClick={() => navigate('/finance/new', { state: { studentId: s.id } })}
                  >
                    Collect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'new' && (
        <div className="glass-card p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-white mb-6">Record New Payment</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Class</label>
              <select
                className="select-field"
                value={newPaymentForm.class}
                onChange={(e) =>
                  setNewPaymentForm((prev) => ({
                    ...prev,
                    class: e.target.value,
                    studentId: '',
                  }))
                }
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    Class {className}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Student</label>
              <select
                className="select-field"
                value={newPaymentForm.studentId}
                disabled={!newPaymentForm.class}
                onChange={(e) => {
                  const selectedStudent = students.find((student) => student.id === e.target.value);
                  setNewPaymentForm((prev) => ({
                    ...prev,
                    studentId: e.target.value,
                    class: selectedStudent ? selectedStudent.class : prev.class,
                  }));
                }}
              >
                <option value="">{newPaymentForm.class ? 'Select student' : 'Select class first'}</option>
                {studentsForSelectedClass.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.rollNo}) - Class {student.class}-{student.section}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={newPaymentForm.amount}
                  onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method</label>
                <select
                  className="select-field"
                  value={newPaymentForm.method}
                  onChange={(e) =>
                    setNewPaymentForm((prev) => ({ ...prev, method: e.target.value as FeePayment['method'] }))
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online Transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fee Category</label>
                <select
                  className="select-field"
                  value={newPaymentForm.category}
                  onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Activity Fee">Activity Fee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                <select
                  className="select-field"
                  value={newPaymentForm.status}
                  onChange={(e) =>
                    setNewPaymentForm((prev) => ({ ...prev, status: e.target.value as FeePayment['status'] }))
                  }
                >
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={newPaymentForm.date}
                  onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Remarks</label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Optional notes..."
                value={newPaymentForm.remarks}
                onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
            <button className="btn-primary w-full justify-center" disabled={recordingPayment} onClick={handleRecordPayment}>
              <Receipt className="w-4 h-4" /> {recordingPayment ? 'Saving...' : 'Generate Receipt & Save'}
            </button>
          </div>
        </div>
      )}

      {addStructureOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Fee Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="input-field sm:col-span-2"
                placeholder="Structure Name"
                value={addStructureForm.name}
                onChange={(e) => setAddStructureForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <select
                className="select-field"
                value={addStructureForm.class}
                onChange={(e) => setAddStructureForm((prev) => ({ ...prev, class: e.target.value }))}
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    Class {className}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input-field"
                placeholder="Total Amount"
                value={addStructureForm.totalAmount}
                onChange={(e) => setAddStructureForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
              />
              <input
                type="date"
                className="input-field sm:col-span-2"
                value={addStructureForm.dueDate}
                onChange={(e) => setAddStructureForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary"
                disabled={addingStructure}
                onClick={() => {
                  setAddStructureOpen(false);
                  setAddStructureForm({ name: '', class: '', totalAmount: '', dueDate: '' });
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={addingStructure} onClick={handleAddStructure}>
                {addingStructure ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPaymentOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#141624] p-5 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-slate-400">Receipt</div>
              <div className="text-white">{selectedPayment.receiptNo}</div>
              <div className="text-slate-400">Student</div>
              <div className="text-white">{selectedPayment.studentName}</div>
              <div className="text-slate-400">Class</div>
              <div className="text-white">{selectedPayment.class}</div>
              <div className="text-slate-400">Amount</div>
              <div className="text-white">INR {Number(selectedPayment.amount || 0).toLocaleString('en-IN')}</div>
              <div className="text-slate-400">Date</div>
              <div className="text-white">{formatDate(selectedPayment.date)}</div>
              <div className="text-slate-400">Method</div>
              <div className="text-white capitalize">{selectedPayment.method}</div>
              <div className="text-slate-400">Status</div>
              <div className="text-white capitalize">{selectedPayment.status}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="btn-secondary"
                onClick={() => {
                  setViewPaymentOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editPaymentOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#141624] p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Payment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input disabled className="input-field opacity-60 cursor-not-allowed sm:col-span-2" value={selectedPayment.receiptNo} />
              <input
                type="number"
                className="input-field"
                placeholder="Amount"
                value={editPaymentForm.amount}
                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <input
                type="date"
                className="input-field"
                value={editPaymentForm.date}
                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
              />
              <select
                className="select-field"
                value={editPaymentForm.method}
                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, method: e.target.value as FeePayment['method'] }))}
              >
                <option value="cash">Cash</option>
                <option value="online">Online Transfer</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
              <select
                className="select-field"
                value={editPaymentForm.status}
                onChange={(e) => setEditPaymentForm((prev) => ({ ...prev, status: e.target.value as FeePayment['status'] }))}
              >
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditPaymentOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={editingPayment} onClick={handleUpdatePayment}>
                {editingPayment ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletePaymentOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Payment</h3>
            <p className="text-sm text-slate-400">
              Are you sure you want to delete receipt <span className="text-white font-medium">{selectedPayment.receiptNo}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn-secondary"
                disabled={deletingPayment}
                onClick={() => {
                  setDeletePaymentOpen(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-primary !bg-red-600 hover:!bg-red-700" disabled={deletingPayment} onClick={handleDeletePayment}>
                {deletingPayment ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
