import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    change: number;
    changeType: 'up' | 'down';
    icon: ReactNode;
    gradient: string;
    suffix?: string;
    onClick?: () => void;
}

export function KPICard({ title, value, change, changeType, icon, gradient, suffix, onClick }: KPICardProps) {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <div
            className={`kpi-card group ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-transform duration-200' : 'cursor-default'}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={onClick ? `Open ${title}` : undefined}
        >
            {/* Background glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${gradient}`} style={{ filter: 'blur(20px)', zIndex: -1 }} />

            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-20`}>
                    {icon}
                </div>
                <span className={changeType === 'up' ? 'stat-change-up' : 'stat-change-down'}>
                    {changeType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change)}%
                </span>
            </div>

            <div className="text-2xl font-bold text-white mb-1">
                {suffix && <span className="text-lg text-slate-400 mr-0.5">{suffix}</span>}
                {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </div>
            <div className="text-xs text-slate-400">{title}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">vs last month</div>
        </div>
    );
}

export function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
    return (
        <div className="glass-card p-4 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{title}</div>
        </div>
    );
}
