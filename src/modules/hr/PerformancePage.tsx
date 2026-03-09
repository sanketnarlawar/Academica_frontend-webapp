import { useState, useEffect, useCallback } from 'react';
import { Star, Target, Plus, Eye, CheckCircle } from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebasePerformanceService } from '../../services/firebasePerformanceService';
import type { PerformanceReview, TeacherFeedback } from '../../types';

const reviewColumns = [
  {
    key: 'teacherName',
    header: 'Teacher',
    sortable: true,
    render: (r: PerformanceReview) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-purple-300 text-xs font-bold">
          {r.teacherName.charAt(0)}
        </div>
        <div>
          <div className="text-white font-medium">{r.teacherName}</div>
          <div className="text-xs text-slate-500">{r.department}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'reviewCycle',
    header: 'Cycle',
    render: (r: PerformanceReview) => <span className="text-slate-300 capitalize">{r.reviewCycle}</span>,
  },
  {
    key: 'reviewDate',
    header: 'Review Date',
    render: (r: PerformanceReview) => <span className="text-slate-300">{new Date(r.reviewDate).toLocaleDateString()}</span>,
  },
  {
    key: 'overallRating',
    header: 'Rating',
    render: (r: PerformanceReview) => (
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-white font-bold">{r.overallRating}/5</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (r: PerformanceReview) => {
      const statusColors = {
        'not-started': 'badge-gray',
        'in-progress': 'badge-blue',
        'completed': 'badge-green',
        'acknowledged': 'badge-purple',
      };
      return <span className={`badge ${statusColors[r.status]} capitalize`}>{r.status.replace('-', ' ')}</span>;
    },
  },
];

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [feedback, setFeedback] = useState<TeacherFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'reviews' | 'feedback'>('reviews');
  const [viewReviewOpen, setViewReviewOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (viewMode === 'reviews') {
        const data = await firebasePerformanceService.getPerformanceReviews();
        setReviews(data);
      } else {
        const data = await firebasePerformanceService.getAllFeedback();
        setFeedback(data);
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

  const pendingReviews = reviews.filter(r => r.status === 'not-started' || r.status === 'in-progress').length;
  const completedReviews = reviews.filter(r => r.status === 'completed' || r.status === 'acknowledged').length;
  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Performance Management</h1>
          <p className="text-slate-400">Track and evaluate staff performance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setViewMode(viewMode === 'reviews' ? 'feedback' : 'reviews')} className="btn-secondary">
            {viewMode === 'reviews' ? 'View Feedback' : 'View Reviews'}
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            New Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{pendingReviews}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{completedReviews}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Rating</p>
              <p className="text-2xl font-bold text-white">{averageRating}/5</p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'reviews' && (
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <DataTable
              columns={reviewColumns}
              data={reviews}
              actions={(review) => (
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setViewReviewOpen(true);
                  }}
                  className="btn-icon"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            />
          )}
        </div>
      )}

      {viewMode === 'feedback' && (
        <div className="card p-6">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{item.teacherName}</h3>
                      <p className="text-sm text-slate-400">{item.subject} - {item.class}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold">{item.averageRating}/5</span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm">{item.comments}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>By: {item.submittedBy}</span>
                    <span>Type: {item.feedbackType}</span>
                    <span>{new Date(item.feedbackDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewReviewOpen && selectedReview && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Performance Review Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Teacher</label>
                  <p className="text-white font-medium">{selectedReview.teacherName}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Department</label>
                  <p className="text-white font-medium">{selectedReview.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">Review Cycle</label>
                  <p className="text-white font-medium capitalize">{selectedReview.reviewCycle}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Review Date</label>
                  <p className="text-white font-medium">{new Date(selectedReview.reviewDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Overall Rating</label>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold text-xl">{selectedReview.overallRating}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Strengths</label>
                <ul className="list-disc list-inside text-white space-y-1 mt-2">
                  {selectedReview.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Areas of Improvement</label>
                <ul className="list-disc list-inside text-white space-y-1 mt-2">
                  {selectedReview.areasOfImprovement.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-slate-400 text-sm">Comments</label>
                <p className="text-white mt-2">{selectedReview.comments}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setViewReviewOpen(false)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
