// ============================================================
// Core Types for School ERP Admin Portal
// ============================================================

export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';
export type Gender = 'male' | 'female' | 'other';
export type FeeStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    phone: string;
    gender: Gender;
    dob: string;
    class: string;
    section: string;
    parentName: string;
    parentPhone: string;
    address: string;
    admissionDate: string;
    status: StudentStatus;
    avatar?: string;
    bloodGroup?: string;
    feeStatus: FeeStatus;
}

export interface Teacher {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    gender: Gender;
    dob: string;
    subjects: string[];
    classes: string[];
    qualification: string;
    experience: number;
    joinDate: string;
    status: 'active' | 'inactive';
    department: string;
    salary: number;
    avatar?: string;
}

export interface ClassSection {
    id: string;
    name: string;
    section: string;
    classTeacher: string;
    totalStudents: number;
    capacity: number;
    room: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    class: string;
    teacher: string;
    periods: number;
    type: 'core' | 'elective' | 'activity';
}

export interface FeeStructure {
    id: string;
    name: string;
    class: string;
    components: FeeComponent[];
    totalAmount: number;
    dueDate: string;
}

export interface FeeComponent {
    id: string;
    name: string;
    amount: number;
    category: 'tuition' | 'transport' | 'hostel' | 'activity' | 'other';
}

export interface FeePayment {
    id: string;
    studentId: string;
    studentName: string;
    class: string;
    amount: number;
    date: string;
    method: 'cash' | 'card' | 'online' | 'cheque';
    receiptNo: string;
    status: FeeStatus;
}

export interface Attendance {
    id: string;
    studentId: string;
    studentName: string;
    date: string;
    class: string;
    section: string;
    status: AttendanceStatus;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    target: 'all' | 'students' | 'teachers' | 'parents';
    date: string;
    author: string;
    priority: 'low' | 'medium' | 'high';
}

export interface KPIData {
    label: string;
    value: number | string;
    change: number;
    changeType: 'up' | 'down';
    icon: string;
    color: string;
    bgColor: string;
}

export interface ChartDataPoint {
    month: string;
    collected: number;
    pending: number;
}

export interface AttendanceChartData {
    day: string;
    percentage: number;
}

export interface Alert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    time: string;
}

export interface ApiPagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    pagination?: ApiPagination;
}

export interface StudentApiRecord {
    _id?: string;
    id?: string;
    rollNumber?: string;
    name?: string;
    gender?: string;
    feeStatus?: string;
    status?: string;
    classId?: string | { className?: string };
    sectionId?: string | { sectionName?: string };
    parentContact?: {
        email?: string;
        parentName?: string;
        phone?: string;
    };
}

export interface TeacherSubject {
    _id?: string;
    subjectName?: string;
}

export interface TeacherApiRecord {
    _id?: string;
    id?: string;
    employeeId?: string;
    name?: string;
    email?: string;
    phone?: string;
    qualification?: string;
    experience?: number;
    status?: string;
    subjects?: TeacherSubject[];
}

export interface TeacherTableRow {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    phone: string;
    qualification: string;
    experience: number;
    status: string;
    subjects: TeacherSubject[];
}

export interface StudentTableRow {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    class: string;
    section: string;
    gender: string;
    parentName: string;
    phone: string;
    feeStatus: string;
    status: string;
}

export interface DashboardOverview {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    feesCollected: number;
    pendingFees: number;
    attendancePercentage: number;
    alerts?: Alert[];
}

export interface DashboardTrends {
    attendanceTrend: Array<{ day: string; percentage: number }>;
    classWiseAttendance: Array<{ class: string; percentage: number }>;
    feeCollection: Array<{ month: string; collected: number; pending: number }>;
}
