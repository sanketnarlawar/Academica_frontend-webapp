import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../modules/dashboard/DashboardPage';
import StudentsPage from '../modules/students/StudentsPage';
import NewAdmissionPage from '../modules/students/NewAdmissionPage';
import TeachersPage from '../modules/teachers/TeachersPage';
import AcademicsPage from '../modules/academics/AcademicsPage';
import FinancePage from '../modules/finance/FinancePage';
import AttendancePage from '../modules/attendance/AttendancePage';
import CommunicationPage from '../modules/communication/CommunicationPage';
import ReportsPage from '../modules/reports/ReportsPage';
import AIInsightsPage from '../modules/ai/AIInsightsPage';
import SettingsPage from '../modules/settings/SettingsPage';
import LoginPage from '../modules/auth/LoginPage';

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl font-black text-white/10 mb-4">404</div>
            <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
            <p className="text-slate-400 text-sm">The page you're looking for doesn't exist.</p>
        </div>
    );
}

export default function AdminRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/" element={<DashboardPage />} />

                    {/* Students */}
                    <Route path="/students" element={<StudentsPage />} />
                    <Route path="/students/new" element={<NewAdmissionPage />} />

                    {/* Teachers */}
                    <Route path="/teachers" element={<TeachersPage />} />
                    <Route path="/teachers/new" element={<TeachersPage />} />

                    {/* Academic */}
                    <Route path="/academic/classes" element={<AcademicsPage />} />
                    <Route path="/academic/subjects" element={<AcademicsPage />} />
                    <Route path="/academic/timetable" element={<AcademicsPage />} />

                    {/* Finance */}
                    <Route path="/finance/structure" element={<FinancePage />} />
                    <Route path="/finance/payment" element={<FinancePage />} />
                    <Route path="/finance/pending" element={<FinancePage />} />

                    {/* Attendance */}
                    <Route path="/attendance/mark" element={<AttendancePage />} />
                    <Route path="/attendance/analytics" element={<AttendancePage />} />

                    {/* Communication */}
                    <Route path="/communication/announcements" element={<CommunicationPage />} />

                    {/* Reports */}
                    <Route path="/reports/fee" element={<ReportsPage />} />
                    <Route path="/reports/attendance" element={<ReportsPage />} />
                    <Route path="/reports/students" element={<ReportsPage />} />

                    {/* AI & Settings */}
                    <Route path="/ai-insights" element={<AIInsightsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />

                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
