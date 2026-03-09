import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    DollarSign, MessageSquare, BarChart3,
    Brain, Settings, ChevronDown, ChevronRight, Briefcase,
    School, Menu, X
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: React.ElementType;
    path?: string;
    children?: { label: string; path: string }[];
}

type UserRole = 'admin' | 'teacher' | 'student';

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    {
        label: 'Students', icon: Users,
        children: [
            { label: 'Student Directory', path: '/students' },
            { label: 'New Admission', path: '/students/new' },
        ]
    },
    {
        label: 'Teachers', icon: GraduationCap,
        children: [
            { label: 'Teacher Directory', path: '/teachers' },
            { label: 'Add Teacher', path: '/teachers/new' },
        ]
    },
    {
        label: 'HR Management', icon: Briefcase,
        children: [
            { label: 'Teacher Attendance', path: '/hr/attendance' },
            { label: 'Leave Management', path: '/hr/leaves' },
            { label: 'Payroll & Salary', path: '/hr/payroll' },
            { label: 'Performance', path: '/hr/performance' },
            { label: 'Contracts & Docs', path: '/hr/contracts' },
        ]
    },
    {
        label: 'Academic', icon: BookOpen,
        children: [
            { label: 'Classes & Sections', path: '/academic/classes' },
            { label: 'Subjects', path: '/academic/subjects' },
            { label: 'Timetable', path: '/academic/timetable' },
        ]
    },
    {
        label: 'Examination', icon: BookOpen,
        children: [
            { label: 'Exam Setup', path: '/exams' },
            { label: 'Exam Schedule', path: '/exams/schedule' },
            { label: 'Result Publication', path: '/exams/results' },
            { label: 'Report Cards', path: '/exams/reports' },
        ]
    },
    {
        label: 'Finance', icon: DollarSign,
        children: [
            { label: 'Fee Structure', path: '/finance/structure' },
            { label: 'Fee Payment', path: '/finance/payment' },
            { label: 'Pending Fees', path: '/finance/pending' },
            { label: 'Record Payment', path: '/finance/new' },
        ]
    },
    {
        label: 'Communication', icon: MessageSquare,
        children: [
            { label: 'Announcements', path: '/communication/announcements' },
        ]
    },
    {
        label: 'Reports', icon: BarChart3,
        children: [
            { label: 'Fee Reports', path: '/reports/fee' },
            { label: 'Attendance Reports', path: '/reports/attendance' },
            { label: 'Student Reports', path: '/reports/students' },
        ]
    },
    { label: 'AI Insights', icon: Brain, path: '/ai-insights' },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

const teacherNavItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
    {
        label: 'Examination', icon: BookOpen,
        children: [
            { label: 'Marks Entry', path: '/teacher/exams/marks' },
        ]
    },
    {
        label: 'Attendance', icon: Users,
        children: [
            { label: 'Mark Attendance', path: '/attendance/mark' },
            { label: 'Attendance Analytics', path: '/attendance/analytics' },
        ]
    },
    {
        label: 'Communication', icon: MessageSquare,
        children: [
            { label: 'Announcements', path: '/teacher/announcements' },
        ]
    },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const location = useLocation();

    const getRole = (): UserRole => {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return 'admin';

        try {
            const parsed = JSON.parse(raw) as { role?: UserRole };
            return parsed.role || 'admin';
        } catch {
            return 'admin';
        }
    };

    const role = getRole();
    const navItems = role === 'teacher' ? teacherNavItems : adminNavItems;
    const [openMenus, setOpenMenus] = useState<string[]>(role === 'teacher' ? ['Examination'] : ['HR Management']);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const isGroupActive = (item: NavItem) =>
        item.children?.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'));

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                    <School className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <div className="text-sm font-bold text-white leading-tight">EduCampus</div>
                        <div className="text-[10px] text-violet-400 font-medium">{role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}</div>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/8 transition-all hidden lg:flex"
                >
                    <Menu className="w-4 h-4" />
                </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isOpen = openMenus.includes(item.label);
                    const active = isGroupActive(item);

                    if (item.path) {
                        return (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="icon" />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        );
                    }

                    return (
                        <div key={item.label}>
                            <button
                                onClick={() => !collapsed && toggleMenu(item.label)}
                                className={`sidebar-link w-full ${active && !isOpen ? 'text-violet-400' : ''} ${collapsed ? 'justify-center' : 'justify-between'}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="icon" />
                                    {!collapsed && <span>{item.label}</span>}
                                </div>
                                {!collapsed && (
                                    <span className="text-slate-500">
                                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </span>
                                )}
                            </button>

                            {!collapsed && isOpen && item.children && (
                                <div className="ml-4 pl-3 border-l border-white/8 mt-0.5 space-y-0.5">
                                    {item.children.map(child => (
                                        <NavLink
                                            key={child.path}
                                            to={child.path}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                        ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`
                                            }
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                            {child.label}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="px-4 py-3 border-t border-white/8">
                    <div className="text-[10px] text-slate-600 text-center">
                        EduCampus ERP v2.4.1
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-30
          bg-[#0d0f1a] border-r border-white/8 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed left-0 top-0 h-screen z-50 w-[260px]
          bg-[#0d0f1a] border-r border-white/8 transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <button
                    onClick={onMobileClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/8"
                >
                    <X className="w-4 h-4" />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}
