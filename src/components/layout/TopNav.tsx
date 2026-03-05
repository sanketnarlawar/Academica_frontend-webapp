import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';

interface TopNavProps {
    sidebarCollapsed: boolean;
    onMobileMenuOpen: () => void;
}

const notifications = [
    { id: 1, text: '12 students have low attendance', time: '2h ago', type: 'warning' },
    { id: 2, text: 'New admission application received', time: '4h ago', type: 'info' },
    { id: 3, text: 'Fee payment of ₹19,000 confirmed', time: '6h ago', type: 'success' },
    { id: 4, text: 'Staff meeting tomorrow at 3 PM', time: '1d ago', type: 'info' },
];

export default function TopNav({ sidebarCollapsed, onMobileMenuOpen }: TopNavProps) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const marginLeft = `${sidebarCollapsed ? 72 : 260}px`;

    return (
        <header
            className="fixed top-0 right-0 z-20 h-16 bg-[#0d0f1a]/90 backdrop-blur-xl border-b border-white/8 flex items-center px-4 gap-4 transition-all duration-300"
            style={{ left: marginLeft }}
        >
            {/* Mobile Menu Button */}
            <button
                onClick={onMobileMenuOpen}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className={`relative flex-1 max-w-md transition-all duration-200 ${searchFocused ? 'max-w-lg' : ''}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search students, teachers, classes..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                        className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-[#141624] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                <span className="text-xs text-violet-400 cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors cursor-pointer">
                                        <div className="flex gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-400' :
                                                    n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                                                }`} />
                                            <div>
                                                <p className="text-xs text-slate-300 leading-relaxed">{n.text}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-2.5">
                                <button className="w-full text-xs text-violet-400 hover:text-violet-300 text-center transition-colors">
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 transition-all"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            A
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-xs font-semibold text-white">Admin User</div>
                            <div className="text-[10px] text-slate-500">Super Admin</div>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-[#141624] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-white/8">
                                <div className="text-sm font-semibold text-white">Admin User</div>
                                <div className="text-xs text-slate-400">admin@educampus.edu</div>
                            </div>
                            {[
                                { icon: User, label: 'Profile' },
                                { icon: Settings, label: 'Settings' },
                            ].map(item => (
                                <button key={item.label} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                            <div className="border-t border-white/8 mt-1">
                                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
