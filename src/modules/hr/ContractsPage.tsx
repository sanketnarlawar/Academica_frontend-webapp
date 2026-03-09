import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, CheckCircle, AlertTriangle, Calendar, Eye } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import AppDialog from '../../components/ui/AppDialog';
import { firebaseContractService } from '../../services/firebaseContractService';
import type { EmploymentContract, TeacherDocument } from '../../types';

const contractColumns = [
  {
    key: 'teacherName',
    header: 'Teacher',
    sortable: true,
    render: (c: EmploymentContract) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold">
          {c.teacherName.charAt(0)}
        </div>
        <div>
          <div className="text-white font-medium">{c.teacherName}</div>
          <div className="text-xs text-slate-500">{c.designation}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'contractType',
    header: 'Type',
    render: (c: EmploymentContract) => <span className="badge badge-blue capitalize">{c.contractType}</span>,
  },
  {
    key: 'startDate',
    header: 'Start Date',
    render: (c: EmploymentContract) => <span className="text-slate-300">{new Date(c.startDate).toLocaleDateString()}</span>,
  },
  {
    key: 'endDate',
    header: 'End Date',
    render: (c: EmploymentContract) => <span className="text-slate-300">{c.endDate ? new Date(c.endDate).toLocaleDateString() : 'N/A'}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (c: EmploymentContract) => {
      const statusColors = {
        active: 'badge-green',
        expired: 'badge-red',
        terminated: 'badge-gray',
        renewed: 'badge-blue',
      };
      return <span className={`badge ${statusColors[c.status]} capitalize`}>{c.status}</span>;
    },
  },
];

const documentColumns = [
  {
    key: 'teacherName',
    header: 'Teacher',
    render: (d: TeacherDocument) => <span className="text-white font-medium">{d.teacherName}</span>,
  },
  {
    key: 'documentName',
    header: 'Document',
    render: (d: TeacherDocument) => (
      <div>
        <div className="text-white font-medium">{d.documentName}</div>
        <div className="text-xs text-slate-500 capitalize">{d.documentType.replace('-', ' ')}</div>
      </div>
    ),
  },
  {
    key: 'uploadedDate',
    header: 'Uploaded',
    render: (d: TeacherDocument) => <span className="text-slate-300 text-sm">{new Date(d.uploadedDate).toLocaleDateString()}</span>,
  },
  {
    key: 'expiryDate',
    header: 'Expiry',
    render: (d: TeacherDocument) => (
      <span className="text-slate-300 text-sm">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'N/A'}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (d: TeacherDocument) => {
      const statusColors = {
        pending: 'badge-yellow',
        verified: 'badge-green',
        rejected: 'badge-red',
        expired: 'badge-gray',
      };
      return <span className={`badge ${statusColors[d.status]} capitalize`}>{d.status}</span>;
    },
  },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [documents, setDocuments] = useState<TeacherDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'contracts' | 'documents'>('contracts');
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (viewMode === 'contracts') {
        const data = await firebaseContractService.getContracts();
        setContracts(data);
      } else {
        const data = await firebaseContractService.getDocuments();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerifyDocument = async (docId: string) => {
    try {
      await firebaseContractService.verifyDocument(docId, 'admin-001', 'Document verified successfully');
      loadData();
    } catch (error) {
      console.error('Error verifying document:', error);
      setDialog({
        title: 'Verification Failed',
        message: 'Failed to verify document. Please try again.',
      });
    }
  };

  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const expiringContracts = contracts.filter(c => {
    if (!c.endDate) return false;
    const endDate = new Date(c.endDate);
    const now = new Date();
    const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 90;
  }).length;

  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const verifiedDocs = documents.filter(d => d.status === 'verified').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contracts & Documents</h1>
          <p className="text-slate-400">Manage employment contracts and staff documents</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setViewMode(viewMode === 'contracts' ? 'documents' : 'contracts')} className="btn-secondary">
            {viewMode === 'contracts' ? 'View Documents' : 'View Contracts'}
          </button>
          <button className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Contracts</p>
              <p className="text-2xl font-bold text-white">{activeContracts}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-white">{expiringContracts}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending Verification</p>
              <p className="text-2xl font-bold text-white">{pendingDocs}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Verified</p>
              <p className="text-2xl font-bold text-white">{verifiedDocs}</p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'contracts' && (
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <DataTable
              columns={contractColumns}
              data={contracts}
              actions={() => (
                <button className="btn-icon" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
              )}
            />
          )}
        </div>
      )}

      {viewMode === 'documents' && (
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <DataTable
              columns={documentColumns}
              data={documents}
              actions={(doc) => (
                <div className="flex gap-2">
                  <button className="btn-icon" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  {doc.status === 'pending' && (
                    <button onClick={() => handleVerifyDocument(doc.id)} className="btn-icon" title="Verify">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            />
          )}
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
