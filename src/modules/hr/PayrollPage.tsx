import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, Download, Plus, Eye, Check } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebasePayrollService } from '../../services/firebasePayrollService';
import type { Payroll } from '../../types';

const columns = [
  {
    key: 'teacherName',
    header: 'Teacher',
    sortable: true,
    render: (p: Payroll) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center text-green-300 text-xs font-bold">
          {p.teacherName.charAt(0)}
        </div>
        <div>
          <div className="text-white font-medium">{p.teacherName}</div>
          <div className="text-xs text-slate-500">{p.department}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'month',
    header: 'Period',
    render: (p: Payroll) => <span className="text-slate-300">{p.month} {p.year}</span>,
  },
  {
    key: 'paidDays',
    header: 'Days',
    render: (p: Payroll) => <span className="text-white">{p.paidDays}/{p.workingDays}</span>,
  },
  {
    key: 'grossSalary',
    header: 'Gross',
    render: (p: Payroll) => <span className="text-green-400">₹{p.grossSalary.toLocaleString()}</span>,
  },
  {
    key: 'totalDeductions',
    header: 'Deductions',
    render: (p: Payroll) => <span className="text-red-400">₹{p.totalDeductions.toLocaleString()}</span>,
  },
  {
    key: 'netSalary',
    header: 'Net Salary',
    render: (p: Payroll) => <span className="text-white font-bold">₹{p.netSalary.toLocaleString()}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (p: Payroll) => {
      const statusConfig = {
        draft: { color: 'badge-gray', label: 'Draft' },
        processed: { color: 'badge-blue', label: 'Processed' },
        paid: { color: 'badge-green', label: 'Paid' },
        'on-hold': { color: 'badge-red', label: 'On Hold' },
      };
      const config = statusConfig[p.status];
      return <span className={`badge ${config.color}`}>{config.label}</span>;
    },
  },
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewSlipOpen, setViewSlipOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    mode?: 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const loadPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const [month, year] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      const data = await firebasePayrollService.getPayrolls(monthName, parseInt(year));
      setPayrolls(data);
    } catch (error) {
      console.error('Error loading payrolls:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const executeGeneratePayroll = async () => {
    try {
      const [month, year] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      const count = await firebasePayrollService.generateMonthlyPayroll(monthName, parseInt(year));
      setDialog({
        title: count > 0 ? 'Payroll Generated' : 'No New Payroll Generated',
        message:
          count > 0
            ? `Payroll generated for ${count} teachers.`
            : 'No new payroll records were created. This usually means payroll is already generated for this month or there are no active teachers.',
      });
      loadPayrolls();
      setGenerateOpen(false);
    } catch (error) {
      console.error('Error generating payroll:', error);
      setDialog({
        title: 'Generation Failed',
        message: 'Failed to generate payroll. Please try again.',
      });
    }
  };

  const handleGeneratePayroll = () => {
    setDialog({
      title: 'Confirm Payroll Generation',
      message: 'Generate payroll for all active teachers for the selected month?',
      mode: 'confirm',
      confirmText: 'Generate',
      cancelText: 'Cancel',
      onConfirm: () => {
        setDialog(null);
        void executeGeneratePayroll();
      },
    });
  };

  const handleProcessPayment = async (payrollId: string) => {
    const txnId = `TXN${Date.now()}`;
    try {
      await firebasePayrollService.processPayment(payrollId, txnId, 'Processed via bank transfer');
      loadPayrolls();
    } catch (error) {
      console.error('Error processing payment:', error);
      setDialog({
        title: 'Payment Failed',
        message: 'Failed to process payment. Please try again.',
      });
    }
  };

  const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const paidAmount = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);
  const pendingAmount = payrolls.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payroll Management</h1>
          <p className="text-slate-400">Manage staff salaries and payments</p>
        </div>
        <button onClick={() => setGenerateOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Generate Payroll
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Payroll</p>
              <p className="text-2xl font-bold text-white">₹{totalPayroll.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Paid</p>
              <p className="text-2xl font-bold text-white">₹{paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">₹{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Records</p>
              <p className="text-2xl font-bold text-white">{payrolls.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input flex-1 max-w-xs"
          />
          <button className="btn-secondary ml-auto">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={payrolls}
            actions={(payroll) => (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPayroll(payroll);
                    setViewSlipOpen(true);
                  }}
                  className="btn-icon"
                  title="View Slip"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {payroll.status !== 'paid' && (
                  <button
                    onClick={() => handleProcessPayment(payroll.id)}
                    className="btn-icon"
                    title="Process Payment"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Generate Modal */}
      {generateOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Generate Monthly Payroll</h2>
            <p className="text-slate-300 mb-4">
              This will generate payroll for all active teachers for {selectedMonth}
            </p>
            <div className="flex gap-3">
              <button onClick={handleGeneratePayroll} className="btn-primary flex-1">
                Generate
              </button>
              <button onClick={() => setGenerateOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlipOpen && selectedPayroll && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Salary Slip</h2>
            <div className="bg-white p-8 rounded-lg text-black">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">Salary Slip</h3>
                <p className="text-gray-600">{selectedPayroll.month} {selectedPayroll.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><strong>Name:</strong> {selectedPayroll.teacherName}</div>
                <div><strong>Department:</strong> {selectedPayroll.department}</div>
                <div><strong>Working Days:</strong> {selectedPayroll.workingDays}</div>
                <div><strong>Paid Days:</strong> {selectedPayroll.paidDays}</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="font-bold mb-2">Earnings</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Basic Pay</span><span>₹{selectedPayroll.basicPay.toLocaleString()}</span></div>
                    {selectedPayroll.allowances.map((a, i) => (
                      <div key={i} className="flex justify-between"><span>{a.name}</span><span>₹{a.amount.toLocaleString()}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Gross</span><span>₹{selectedPayroll.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-2">Deductions</h4>
                  <div className="space-y-1">
                    {selectedPayroll.deductions.map((d, i) => (
                      <div key={i} className="flex justify-between"><span>{d.name}</span><span>₹{d.amount.toLocaleString()}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total</span><span>₹{selectedPayroll.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t-2 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Net Salary</span>
                  <span>₹{selectedPayroll.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1"><Download className="w-4 h-4" /> Download PDF</button>
              <button onClick={() => setViewSlipOpen(false)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}

      <AppDialog
        open={dialog !== null}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        mode={dialog?.mode || 'info'}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        onConfirm={dialog?.onConfirm}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
