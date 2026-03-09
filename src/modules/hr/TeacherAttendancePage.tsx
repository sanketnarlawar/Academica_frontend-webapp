import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Search,
} from 'lucide-react';
import DataTable from '../../components/tables/DataTable';
import { firebaseTeacherAttendanceService } from '../../services/firebaseTeacherAttendanceService';
import { firebaseTeacherService } from '../../services/firebaseTeacherService';
import type { TeacherAttendance, TeacherAttendanceStats, Teacher } from '../../types';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const columns = [
  {
    key: 'teacherName',
    header: 'Teacher Name',
    sortable: true,
    render: (t: TeacherAttendance) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
          {t.teacherName.charAt(0)}
        </div>
        <span className="text-white font-medium">{t.teacherName}</span>
      </div>
    ),
  },
  {
    key: 'checkInTime',
    header: 'Check-in',
    render: (t: TeacherAttendance) => (
      <span className="text-slate-300 font-mono text-sm">{t.checkInTime}</span>
    ),
  },
  {
    key: 'checkOutTime',
    header: 'Check-out',
    render: (t: TeacherAttendance) => (
      <span className="text-slate-300 font-mono text-sm">
        {t.checkOutTime || '-'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (t: TeacherAttendance) => {
      const statusConfig = {
        present: { color: 'badge-green', label: 'Present' },
        absent: { color: 'badge-red', label: 'Absent' },
        late: { color: 'badge-orange', label: 'Late' },
        'half-day': { color: 'badge-yellow', label: 'Half Day' },
        'on-leave': { color: 'badge-purple', label: 'On Leave' },
      };
      const config = statusConfig[t.status] || statusConfig.present;
      return <span className={`badge ${config.color}`}>{config.label}</span>;
    },
  },
  {
    key: 'lateMinutes',
    header: 'Late By',
    render: (t: TeacherAttendance) =>
      t.lateMinutes ? (
        <span className="text-orange-400 text-sm">{t.lateMinutes} mins</span>
      ) : (
        <span className="text-slate-500">-</span>
      ),
  },
  {
    key: 'method',
    header: 'Method',
    render: (t: TeacherAttendance) => {
      const methodIcons = {
        manual: '✍️',
        biometric: '👆',
        'qr-code': '📱',
        'self-checkin': '🖥️',
      };
      return (
        <span className="text-slate-400 text-sm">
          {methodIcons[t.method]} {t.method.replace('-', ' ')}
        </span>
      );
    },
  },
];

export default function TeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendance[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherAttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'stats'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [statsError, setStatsError] = useState('');
  const [statsWarning, setStatsWarning] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [attendanceData, teachersData] = await Promise.all([
        firebaseTeacherAttendanceService.getAttendanceByDate(selectedDate),
        firebaseTeacherService.getTeachers(),
      ]);

      setAttendanceRecords(attendanceData);
      setTeachers(teachersData.filter((t) => t.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setStatsError('');
      setStatsWarning('');

      const teachersData = await firebaseTeacherService.getTeachers();
      const activeTeachers = teachersData.filter((t) => t.status === 'active');

      const statsPromises = activeTeachers.map((teacher) =>
        firebaseTeacherAttendanceService.getAttendanceStats(
          teacher.id,
          teacher.name,
          teacher.department || 'General'
        )
      );

      const settled = await Promise.allSettled(statsPromises);
      const statsData = settled
        .filter((result): result is PromiseFulfilledResult<TeacherAttendanceStats> => result.status === 'fulfilled')
        .map((result) => result.value);

      const failedCount = settled.length - statsData.length;
      if (failedCount > 0) {
        setStatsWarning(`Could not load statistics for ${failedCount} teacher(s).`);
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats([]);
      setStatsError('Failed to load attendance statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'stats') {
      void loadStats();
    }
  }, [viewMode, loadStats]);

  const todayStats = {
    total: teachers.length,
    present: attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late')
      .length,
    absent: attendanceRecords.filter((a) => a.status === 'absent').length,
    late: attendanceRecords.filter((a) => a.status === 'late').length,
    onLeave: attendanceRecords.filter((a) => a.status === 'on-leave').length,
  };

  const attendancePercentage =
    todayStats.total > 0
      ? Math.round(((todayStats.present + todayStats.onLeave) / todayStats.total) * 100)
      : 0;

  const filteredRecords = attendanceRecords.filter((record) =>
    record.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStats = stats.filter((stat) =>
    stat.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teacher Attendance</h1>
          <p className="text-slate-400">View staff attendance status and analytics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'daily' ? 'stats' : 'daily')}
            className="btn-secondary"
          >
            {viewMode === 'daily' ? 'View Statistics' : 'View Daily'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Staff</p>
              <p className="text-2xl font-bold text-white">{todayStats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Present</p>
              <p className="text-2xl font-bold text-white">{todayStats.present}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Absent</p>
              <p className="text-2xl font-bold text-white">{todayStats.absent}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Late</p>
              <p className="text-2xl font-bold text-white">{todayStats.late}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Percentage</p>
              <p className="text-2xl font-bold text-white">{attendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input flex-1 max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1"
            />
          </div>

          {viewMode === 'stats' && (
            <button onClick={() => void loadStats()} className="btn-secondary" disabled={loading}>
              <TrendingUp className="w-4 h-4" />
              {loading ? 'Loading Statistics...' : 'Refresh Statistics'}
            </button>
          )}

          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : (
            <DataTable columns={columns} data={filteredRecords} />
          )}
        </div>
      )}

      {/* Statistics View */}
      {viewMode === 'stats' && (
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : statsError ? (
            <div className="p-8 text-center text-red-400">{statsError}</div>
          ) : stats.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No attendance statistics available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {statsWarning && (
                <div className="mx-4 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  {statsWarning}
                </div>
              )}

              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Department</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Leave</th>
                    <th>Attendance %</th>
                    <th>Punctuality %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((stat) => (
                    <tr key={stat.teacherId}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                            {stat.teacherName.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{stat.teacherName}</span>
                        </div>
                      </td>
                      <td className="text-slate-300">{stat.department}</td>
                      <td className="text-slate-300">{stat.totalDays}</td>
                      <td className="text-green-400">{stat.presentDays}</td>
                      <td className="text-red-400">{stat.absentDays}</td>
                      <td className="text-orange-400">{stat.lateDays}</td>
                      <td className="text-purple-400">{stat.leaveDays}</td>
                      <td>
                        <span
                          className={`badge ${
                            stat.attendancePercentage >= 90
                              ? 'badge-green'
                              : stat.attendancePercentage >= 75
                              ? 'badge-yellow'
                              : 'badge-red'
                          }`}
                        >
                          {stat.attendancePercentage}%
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            stat.punctualityPercentage >= 90
                              ? 'badge-green'
                              : stat.punctualityPercentage >= 75
                              ? 'badge-yellow'
                              : 'badge-red'
                          }`}
                        >
                          {stat.punctualityPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
