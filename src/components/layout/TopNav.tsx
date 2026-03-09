import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';
import { firebaseAuthService } from '../../services/firebaseAuthService';
import { firebaseAnnouncementService } from '../../services/firebaseAnnouncementService';
import type { Announcement } from '../../types';

interface TopNavProps {
    sidebarCollapsed: boolean;
    onMobileMenuOpen: () => void;
}

interface CurrentUser {
    uid?: string;
    email?: string;
    role?: string;
    name?: string;
}

export default function TopNav({ sidebarCollapsed, onMobileMenuOpen }: TopNavProps) {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const processAnnouncements = (data: Announcement[]) => {
        // Take latest 5 for display
        const latest = data.slice(0, 5);
        setAnnouncements(latest);

        // Check for new announcements
        const lastSeenStr = localStorage.getItem('lastSeenAnnouncementTime');
        // If never seen before, default to 1 minute ago (so only brand new ones show)
        const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : Date.now() - 60000;
        
        console.log('🔔 Checking announcements:', {
            totalAnnouncements: data.length,
            lastSeenStr,
            lastSeen: new Date(lastSeen).toISOString(),
        });

        const newCount = data.filter(ann => {
            // Get timestamp from createdAt or date field
            const annData = ann as any;
            let annTime: number;
            
            // Priority 1: Use createdAt Timestamp field
            if (annData.createdAt) {
                if (typeof annData.createdAt.toMillis === 'function') {
                    annTime = annData.createdAt.toMillis();
                } else if (annData.createdAt.seconds) {
                    annTime = annData.createdAt.seconds * 1000;
                } else {
                    annTime = Date.now();
                }
            }
            // Priority 2: Use date field
            else if (typeof ann.date === 'string') {
                annTime = new Date(ann.date).getTime();
            } else if (annData.date?.seconds) {
                annTime = annData.date.seconds * 1000;
            } else {
                annTime = Date.now();
            }
            
            const isNew = annTime > lastSeen;
            console.log(`  📄 ${ann.title?.substring(0, 30) || 'Untitled'}...`, {
                annTime: new Date(annTime).toISOString(),
                isNew,
            });
            
            return isNew;
        }).length;

        console.log('🔔 Unread count:', newCount);
        
        setUnreadCount(newCount);
        if (newCount > 0) {
            console.log('🔔 Triggering badge and shake animation');
            setHasNewNotifications(true);
            // Remove shake after 3 seconds
            setTimeout(() => {
                console.log('🔔 Removing shake animation');
                setHasNewNotifications(false);
            }, 3000);
        } else {
            console.log('🔔 No unread notifications');
        }
    };

    useEffect(() => {
        // Subscribe to real-time announcements
        const unsubscribe = firebaseAnnouncementService.subscribeToAnnouncements(processAnnouncements);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Load current user from localStorage
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr) as CurrentUser;
                setCurrentUser(user);
            } catch (error) {
                console.error('Error parsing current user:', error);
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await firebaseAuthService.logout();
            localStorage.removeItem('currentUser');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotificationClick = () => {
        setNotifOpen(!notifOpen);
        setProfileOpen(false);
        // Mark all as seen when opening dropdown
        if (!notifOpen) {
            localStorage.setItem('lastSeenAnnouncementTime', new Date().toISOString());
            setUnreadCount(0);
            setHasNewNotifications(false);
        }
    };

    const handleViewAllNotifications = () => {
        navigate('/communication/announcements');
        setNotifOpen(false);
    };

    const getTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-amber-400';
            case 'low': return 'bg-emerald-400';
            default: return 'bg-blue-400';
        }
    };

    const getInitials = (name?: string): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleLabel = (role?: string): string => {
        if (!role) return 'User';
        switch (role.toLowerCase()) {
            case 'admin': return 'Admin';
            case 'teacher': return 'Teacher';
            case 'student': return 'Student';
            default: return 'User';
        }
    };

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
                        onClick={handleNotificationClick}
                        className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                    >
                        <Bell className={`w-5 h-5 ${hasNewNotifications ? 'animate-bell-shake' : ''}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-[#141624] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                <span className="text-xs text-violet-400 cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {announcements.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-xs text-slate-500">No announcements yet</p>
                                    </div>
                                ) : (
                                    announcements.map(ann => (
                                        <div key={ann.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors cursor-pointer">
                                            <div className="flex gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(ann.priority)}`} />
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-white mb-0.5">{ann.title}</p>
                                                    <p className="text-[11px] text-slate-400 line-clamp-2">{ann.content}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-slate-500">{getTimeAgo(ann.date)}</span>
                                                        <span className="text-[10px] text-violet-400">• {ann.target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="px-4 py-2.5">
                                <button 
                                    onClick={handleViewAllNotifications}
                                    className="w-full text-xs text-violet-400 hover:text-violet-300 text-center transition-colors"
                                >
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
                            {getInitials(currentUser?.name)}
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-xs font-semibold text-white">{currentUser?.name || 'User'}</div>
                            <div className="text-[10px] text-slate-500">{getRoleLabel(currentUser?.role)}</div>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-[#141624] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-white/8">
                                <div className="text-sm font-semibold text-white">{currentUser?.name || 'User'}</div>
                                <div className="text-xs text-slate-400">{currentUser?.email || 'No email'}</div>
                            </div>
                            {[
                                { icon: User, label: 'Profile', path: '/profile' },
                                { icon: Settings, label: 'Settings', path: '/settings' },
                            ].map(item => (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            ))}
                            <div className="border-t border-white/8 mt-1">
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
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
