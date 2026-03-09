import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../modules/dashboard/DashboardPage';
import StudentsPage from '../modules/students/StudentsPage';
import NewAdmissionPage from '../modules/students/NewAdmissionPage';
import TeachersPage from '../modules/teachers/TeachersPage';
import NewTeacherPage from '../modules/teachers/NewTeacherPage';
import TeacherAttendancePage from '../modules/hr/TeacherAttendancePage';
import LeaveManagementPage from '../modules/hr/LeaveManagementPage';
import PayrollPage from '../modules/hr/PayrollPage';
import PerformancePage from '../modules/hr/PerformancePage';
import ContractsPage from '../modules/hr/ContractsPage';
import AcademicsPage from '../modules/academics/AcademicsPage';
import ExamManagementPage from '../modules/exams/ExamManagementPage';
import ExamSchedulePage from '../modules/exams/ExamSchedulePage';
import ResultPublicationPage from '../modules/exams/ResultPublicationPage';
import ReportCardsPage from '../modules/exams/ReportCardsPage';
import MarksEntryPage from '../modules/exams/MarksEntryPage';
import FinancePage from '../modules/finance/FinancePage';
import CommunicationPage from '../modules/communication/CommunicationPage';
import ReportsPage from '../modules/reports/ReportsPage';
import AIInsightsPage from '../modules/ai/AIInsightsPage';
import SettingsPage from '../modules/settings/SettingsPage';
import LoginPage from '../modules/auth/LoginPage';
import SignupPage from '../modules/auth/SignupPage';
import ProfilePage from '../modules/profile/ProfilePage';
import AttendancePage from '../modules/attendance/AttendancePage';

type AppRole = 'admin' | 'teacher' | 'student';

interface CurrentUser {
    uid?: string;
    email?: string;
    role?: AppRole;
    name?: string;
}

function isValidRole(role: unknown): role is AppRole {
    return role === 'admin' || role === 'teacher' || role === 'student';
}

function getCurrentUser(): CurrentUser | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as CurrentUser;
        if (!isValidRole(parsed.role)) {
            // Clear legacy/invalid payloads to avoid redirect loops.
            localStorage.removeItem('currentUser');
            return null;
        }
        return parsed;
    } catch {
        localStorage.removeItem('currentUser');
        return null;
    }
}

function getDefaultRouteForRole(role?: AppRole): string {
    if (role === 'teacher') return '/teacher';
    if (role === 'student') return '/login';
    if (!role) return '/login';
    return '/';
}

function RoleProtectedOutlet({ allowedRoles }: { allowedRoles?: AppRole[] }) {
    const user = getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes((user.role || 'student') as AppRole)) {
        return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
    }

    return <Outlet />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const user = getCurrentUser();
    if (user) {
        return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
    }

    return <>{children}</>;
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
                <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

                <Route element={<RoleProtectedOutlet allowedRoles={['admin', 'teacher']} />}>
                    <Route element={<MainLayout />}>
                        {/* Admin only */}
                        <Route element={<RoleProtectedOutlet allowedRoles={['admin']} />}>
                            <Route path="/" element={<DashboardPage />} />

                            {/* Students */}
                            <Route path="/students" element={<StudentsPage />} />
                            <Route path="/students/new" element={<NewAdmissionPage />} />

                            {/* Teachers */}
                            <Route path="/teachers" element={<TeachersPage />} />
                            <Route path="/teachers/new" element={<NewTeacherPage />} />
                            {/* HR Management */}
                            <Route path="/hr/attendance" element={<TeacherAttendancePage />} />
                            <Route path="/hr/leaves" element={<LeaveManagementPage />} />
                            <Route path="/hr/payroll" element={<PayrollPage />} />
                            <Route path="/hr/performance" element={<PerformancePage />} />
                            <Route path="/hr/contracts" element={<ContractsPage />} />


                            {/* Academic */}
                            <Route path="/academic/classes" element={<AcademicsPage />} />
                            <Route path="/academic/subjects" element={<AcademicsPage />} />
                            <Route path="/academic/timetable" element={<AcademicsPage />} />

                            {/* Exams */}
                            <Route path="/exams" element={<ExamManagementPage />} />
                            <Route path="/exams/schedule" element={<ExamSchedulePage />} />
                            <Route path="/exams/results" element={<ResultPublicationPage />} />
                            <Route path="/exams/reports" element={<ReportCardsPage />} />

                            {/* Finance */}
                            <Route path="/finance/structure" element={<FinancePage />} />
                            <Route path="/finance/payment" element={<FinancePage />} />
                            <Route path="/finance/pending" element={<FinancePage />} />
                            <Route path="/finance/new" element={<FinancePage />} />

                            {/* Communication */}
                            <Route path="/communication/announcements" element={<CommunicationPage />} />

                            {/* Reports */}
                            <Route path="/reports/fee" element={<ReportsPage />} />
                            <Route path="/reports/attendance" element={<ReportsPage />} />
                            <Route path="/reports/students" element={<ReportsPage />} />

                            {/* AI & Settings */}
                            <Route path="/ai-insights" element={<AIInsightsPage />} />
                        </Route>

                        {/* Teacher only */}
                        <Route element={<RoleProtectedOutlet allowedRoles={['teacher']} />}>
                            <Route path="/teacher" element={<DashboardPage />} />
                            <Route path="/teacher/exams/marks" element={<MarksEntryPage />} />
                            <Route path="/attendance/mark" element={<AttendancePage />} />
                            <Route path="/attendance/analytics" element={<AttendancePage />} />
                            <Route path="/teacher/announcements" element={<CommunicationPage />} />
                        </Route>

                        {/* Shared routes for both Admin and Teacher */}
                        <Route element={<RoleProtectedOutlet allowedRoles={['admin', 'teacher']} />}>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
