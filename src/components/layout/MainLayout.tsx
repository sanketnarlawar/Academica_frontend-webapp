import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const marginLeft = `${collapsed ? 72 : 260}px`;

    return (
        <div className="min-h-screen bg-[#0f1117]">
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <TopNav
                sidebarCollapsed={collapsed}
                onMobileMenuOpen={() => setMobileOpen(true)}
            />

            <main
                className="transition-all duration-300 pt-16 min-h-screen"
                style={{ marginLeft: window.innerWidth >= 1024 ? marginLeft : '0px' }}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
