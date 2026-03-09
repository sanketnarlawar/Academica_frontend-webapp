import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { FeeCollectionChart, AttendanceTrendChart, ClassAttendanceChart } from '../../components/charts/Charts';
import { firebaseDashboardService } from '../../services/firebaseDashboardService';
import type { Alert, DashboardOverview, DashboardTrends } from '../../types';

const alertIcons: Record<string, React.ElementType> = {
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
    success: CheckCircle,
};

const alertColors: Record<string, string> = {
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    error: 'text-red-400 bg-red-500/10 border-red-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function AlertCard({ alert }: { alert: Alert }) {
    const Icon = alertIcons[alert.type] || Info;
    return (
        <div className={`flex gap-3 p-3.5 rounded-xl border ${alertColors[alert.type] || alertColors.info} transition-all hover:scale-[1.01]`}>
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{alert.title}</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{alert.message}</div>
                <div className="text-[10px] text-slate-600 mt-1">{alert.time}</div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
    const [trends, setTrends] = useState<DashboardTrends | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                const [overviewRes, trendsRes] = await Promise.all([
                    firebaseDashboardService.getOverview(),
                    firebaseDashboardService.getTrends()
                ]);

                setDashboardData(overviewRes);
                setTrends(trendsRes);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <div className="text-slate-400 text-sm animate-pulse">Synchronizing school data...</div>
            </div>
        );
    }

    const kpiCards = [
        {
            title: 'Total Students',
            value: dashboardData?.totalStudents || 0,
            change: 0,
            changeType: 'up' as const,
            icon: <Users className="w-5 h-5 text-violet-400" />,
            gradient: 'bg-violet-500/10',
        },
        {
            title: 'Total Teachers',
            value: dashboardData?.totalTeachers || 0,
            change: 0,
            changeType: 'up' as const,
            icon: <GraduationCap className="w-5 h-5 text-blue-400" />,
            gradient: 'bg-blue-500/10',
        },
        {
            title: 'Total Classes',
            value: dashboardData?.totalClasses || 0,
            change: 0,
            changeType: 'up' as const,
            icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
            gradient: 'bg-emerald-500/10',
        },
        {
            title: 'Fees Collected',
            value: dashboardData?.feesCollected || 0,
            change: 0,
            changeType: 'up' as const,
            icon: <DollarSign className="w-5 h-5 text-amber-400" />,
            gradient: 'bg-amber-500/10',
            suffix: '₹',
        },
        {
            title: 'Pending Fees',
            value: dashboardData?.pendingFees || 0,
            change: 0,
            changeType: 'down' as const,
            icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
            gradient: 'bg-red-500/10',
            suffix: '₹',
        },
    ];

    const alerts: Alert[] = dashboardData?.alerts || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back, Admin! Here's what's happening today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {kpiCards.map((card) => (
                    <KPICard key={card.title} {...card} />
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-semibold text-white">Fee Collection Analytics</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Monthly collected vs pending fees</p>
                        </div>
                    </div>
                    <FeeCollectionChart data={trends?.feeCollection || []} />
                </div>

                <div className="space-y-4">
                    <div className="glass-card p-6">
                        <h2 className="text-base font-semibold text-white mb-4">Quick Overview</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Active Students', value: dashboardData?.totalStudents || 0, color: 'text-violet-400', bar: 100 },
                                { label: 'Attendance Rate', value: `${dashboardData?.attendancePercentage || 0}%`, color: 'text-amber-400', bar: dashboardData?.attendancePercentage || 0 },
                                { label: 'Fees Progress', value: `₹${(dashboardData?.feesCollected || 0).toLocaleString()}`, color: 'text-green-400', bar: 85 },
                            ].map(item => (
                                <div key={item.label} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">{item.label}</span>
                                        <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${item.bar}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-white">Weekly Attendance</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Daily attendance percentage</p>
                    </div>
                    <AttendanceTrendChart data={trends?.attendanceTrend || []} />
                </div>

                <div className="glass-card p-6">
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-white">Attendance by Class</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Comparison across grades</p>
                    </div>
                    <ClassAttendanceChart data={trends?.classWiseAttendance || []} />
                </div>

                <div className="glass-card p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-white">Alerts & Notifications</h2>
                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                            {alerts.length} active
                        </span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {alerts.length > 0 ? (
                            alerts.map((alert, idx) => <AlertCard key={idx} alert={alert} />)
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm italic">No urgent alerts</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
