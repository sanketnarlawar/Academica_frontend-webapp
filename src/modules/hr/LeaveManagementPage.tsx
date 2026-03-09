import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseLeaveService } from '../../services/firebaseLeaveService';
import type { LeaveApplication } from '../../types';

const columns = [
  {
    key: 'teacherName',
    header: 'Teacher',
    sortable: true,
    render: (leave: LeaveApplication) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
          {leave.teacherName.charAt(0)}
        </div>
        <div>
          <div className="text-white font-medium">{leave.teacherName}</div>
          <div className="text-xs text-slate-500">{leave.department}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'leaveType',
    header: 'Type',
    render: (leave: LeaveApplication) => {
      const typeColors: Record<string, string> = {
        sick: 'badge-red',
        casual: 'badge-blue',
        maternity: 'badge-pink',
        paternity: 'badge-purple',
        earned: 'badge-green',
        compensatory: 'badge-orange',
        unpaid: 'badge-gray',
      };
      return (
        <span className={`badge ${typeColors[leave.leaveType]} capitalize`}>
          {leave.leaveType}
        </span>
      );
    },
  },
  {
    key: 'fromDate',
    header: 'From',
    render: (leave: LeaveApplication) => (
      <span className="text-slate-300">{new Date(leave.fromDate).toLocaleDateString()}</span>
    ),
  },
  {
    key: 'toDate',
    header: 'To',
    render: (leave: LeaveApplication) => (
      <span className="text-slate-300">{new Date(leave.toDate).toLocaleDateString()}</span>
    ),
  },
  {
    key: 'totalDays',
    header: 'Days',
    render: (leave: LeaveApplication) => (
      <span className="text-white font-semibold">{leave.totalDays}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (leave: LeaveApplication) => {
      const statusConfig: Record<typeof leave.status, { color: string; label: string }> = {
        pending: { color: 'badge-yellow', label: 'Pending' },
        approved: { color: 'badge-green', label: 'Approved' },
        rejected: { color: 'badge-red', label: 'Rejected' },
        cancelled: { color: 'badge-gray', label: 'Cancelled' },
      };
      const config = statusConfig[leave.status];
      return <span className={`badge ${config.color}`}>{config.label}</span>;
    },
  },
];

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLeaveOpen, setViewLeaveOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [approvalForm, setApprovalForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    remarks: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const leavesData =
        filter === 'pending'
          ? await firebaseLeaveService.getPendingLeaves()
          : await firebaseLeaveService.getLeaveApplications();

      const filteredLeaves =
        filter === 'all'
          ? leavesData
          : leavesData.filter((leave) => leave.status === filter);

      setLeaves(filteredLeaves);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproval = async () => {
    if (!selectedLeave) return;

    try {
      await firebaseLeaveService.processLeaveApproval(
        selectedLeave.id,
        'admin-001',
        'Admin User',
        'Admin',
        approvalForm.status,
        approvalForm.remarks
      );

      setApprovalOpen(false);
      setSelectedLeave(null);
      resetApprovalForm();
      loadData();
    } catch (error) {
      console.error('Error processing approval:', error);
      setDialog({
        title: 'Update Failed',
        message: 'Failed to process approval. Please try again.',
      });
    }
  };

  const resetApprovalForm = () => {
    setApprovalForm({
      status: 'approved',
      remarks: '',
    });
  };

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leave Management</h1>
          <p className="text-slate-400">Review teacher leave applications and approve/reject</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Applications</p>
              <p className="text-2xl font-bold text-white">{leaves.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 cursor-pointer" onClick={() => setFilter('pending')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 cursor-pointer" onClick={() => setFilter('approved')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-white">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 cursor-pointer" onClick={() => setFilter('rejected')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-white">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')} className="input flex-1 max-w-xs">
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-secondary ml-auto">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={leaves}
            actions={(leave) => (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedLeave(leave);
                    setViewLeaveOpen(true);
                  }}
                  className="btn-icon"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {leave.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedLeave(leave);
                      setApprovalOpen(true);
                    }}
                    className="btn-icon"
                    title="Process"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* View Leave Details Modal */}
      {viewLeaveOpen && selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Leave Application Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Teacher Name</label>
                  <p className="text-white font-medium">{selectedLeave.teacherName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Department</label>
                  <p className="text-white font-medium">{selectedLeave.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Leave Type</label>
                  <p className="text-white font-medium capitalize">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">From Date</label>
                  <p className="text-white font-medium">
                    {new Date(selectedLeave.fromDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">To Date</label>
                  <p className="text-white font-medium">
                    {new Date(selectedLeave.toDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Total Days</label>
                <p className="text-white font-medium">{selectedLeave.totalDays} days</p>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Reason</label>
                <p className="text-white">{selectedLeave.reason}</p>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Approval Chain</label>
                <div className="space-y-2 mt-2">
                  {selectedLeave.approvalChain.map((step) => (
                    <div key={step.level} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{step.approverRole}</p>
                        <p className="text-slate-400 text-sm">{step.approverName}</p>
                      </div>
                      <span
                        className={`badge ${
                          step.status === 'approved'
                            ? 'badge-green'
                            : step.status === 'rejected'
                            ? 'badge-red'
                            : 'badge-yellow'
                        } capitalize`}
                      >
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setViewLeaveOpen(false)} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalOpen && selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Process Leave Application</h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-white font-medium">{selectedLeave.teacherName}</p>
                <p className="text-slate-400 text-sm">
                  {new Date(selectedLeave.fromDate).toLocaleDateString()} -{' '}
                  {new Date(selectedLeave.toDate).toLocaleDateString()} ({selectedLeave.totalDays}{' '}
                  days)
                </p>
              </div>

              <div>
                <label className="label">Decision</label>
                <select
                  value={approvalForm.status}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, status: e.target.value as 'approved' | 'rejected' })
                  }
                  className="input"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="label">Remarks</label>
                <textarea
                  value={approvalForm.remarks}
                  onChange={(e) => setApprovalForm({ ...approvalForm, remarks: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Add remarks..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleApproval} className="btn-primary flex-1">
                Submit Decision
              </button>
              <button
                onClick={() => {
                  setApprovalOpen(false);
                  setSelectedLeave(null);
                  resetApprovalForm();
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppDialog
        open={dialog !== null}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
