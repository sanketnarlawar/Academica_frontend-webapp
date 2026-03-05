import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type FeeCollectionPoint = {
    month: string;
    collected: number;
    pending: number;
};

type AttendanceTrendPoint = {
    day: string;
    percentage: number;
};

type ClassAttendancePoint = {
    class: string;
    percentage: number;
};

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(0)}K`;

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1d2e] border border-white/10 rounded-xl p-3 shadow-xl">
            <p className="text-xs text-slate-400 mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="text-white font-medium">
                        {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : `${p.value}%`}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function FeeCollectionChart({ data = [] }: { data?: FeeCollectionPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '16px' }} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{v}</span>} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#7c3aed" strokeWidth={2} fill="url(#collectedGrad)" />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} fill="url(#pendingGrad)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function AttendanceTrendChart({ data = [] }: { data?: AttendanceTrendPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="percentage" name="Attendance" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function ClassAttendanceChart({ data = [] }: { data?: ClassAttendancePoint[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="class" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" name="Attendance %" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
