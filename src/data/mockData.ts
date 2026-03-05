import type {
    Student, Teacher, ClassSection, Subject,
    FeeStructure, FeePayment, Attendance, Announcement,
    ChartDataPoint, AttendanceChartData, Alert
} from '../types';

// ──────────────────────────────────────────────────────────
// Students
// ──────────────────────────────────────────────────────────
export const mockStudents: Student[] = [
    { id: 's1', rollNo: 'S001', name: 'Aarav Sharma', email: 'aarav@school.edu', phone: '9876543210', gender: 'male', dob: '2010-03-15', class: '10', section: 'A', parentName: 'Rajesh Sharma', parentPhone: '9876543211', address: '12 MG Road, Bangalore', admissionDate: '2020-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'O+' },
    { id: 's2', rollNo: 'S002', name: 'Priya Patel', email: 'priya@school.edu', phone: '9876543220', gender: 'female', dob: '2010-07-22', class: '10', section: 'A', parentName: 'Ramesh Patel', parentPhone: '9876543221', address: '45 Brigade Road, Bangalore', admissionDate: '2020-06-01', status: 'active', feeStatus: 'pending', bloodGroup: 'A+' },
    { id: 's3', rollNo: 'S003', name: 'Rohan Mehta', email: 'rohan@school.edu', phone: '9876543230', gender: 'male', dob: '2011-01-10', class: '9', section: 'B', parentName: 'Suresh Mehta', parentPhone: '9876543231', address: '78 Koramangala, Bangalore', admissionDate: '2021-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'B+' },
    { id: 's4', rollNo: 'S004', name: 'Ananya Singh', email: 'ananya@school.edu', phone: '9876543240', gender: 'female', dob: '2011-05-18', class: '9', section: 'A', parentName: 'Vijay Singh', parentPhone: '9876543241', address: '23 Indiranagar, Bangalore', admissionDate: '2021-06-01', status: 'active', feeStatus: 'overdue', bloodGroup: 'AB+' },
    { id: 's5', rollNo: 'S005', name: 'Karan Gupta', email: 'karan@school.edu', phone: '9876543250', gender: 'male', dob: '2012-09-25', class: '8', section: 'C', parentName: 'Deepak Gupta', parentPhone: '9876543251', address: '56 Whitefield, Bangalore', admissionDate: '2022-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'O-' },
    { id: 's6', rollNo: 'S006', name: 'Siya Reddy', email: 'siya@school.edu', phone: '9876543260', gender: 'female', dob: '2012-11-30', class: '8', section: 'B', parentName: 'Prakash Reddy', parentPhone: '9876543261', address: '89 Jayanagar, Bangalore', admissionDate: '2022-06-01', status: 'inactive', feeStatus: 'partial', bloodGroup: 'A-' },
    { id: 's7', rollNo: 'S007', name: 'Dev Kumar', email: 'dev@school.edu', phone: '9876543270', gender: 'male', dob: '2013-02-14', class: '7', section: 'A', parentName: 'Ajay Kumar', parentPhone: '9876543271', address: '34 HSR Layout, Bangalore', admissionDate: '2023-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'B-' },
    { id: 's8', rollNo: 'S008', name: 'Riya Joshi', email: 'riya@school.edu', phone: '9876543280', gender: 'female', dob: '2013-08-06', class: '7', section: 'B', parentName: 'Mohan Joshi', parentPhone: '9876543281', address: '67 BTM Layout, Bangalore', admissionDate: '2023-06-01', status: 'active', feeStatus: 'pending', bloodGroup: 'AB-' },
    { id: 's9', rollNo: 'S009', name: 'Arjun Nair', email: 'arjun@school.edu', phone: '9876543290', gender: 'male', dob: '2014-04-12', class: '6', section: 'A', parentName: 'Sunil Nair', parentPhone: '9876543291', address: '90 Rajajinagar, Bangalore', admissionDate: '2024-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'O+' },
    { id: 's10', rollNo: 'S010', name: 'Meera Das', email: 'meera@school.edu', phone: '9876543300', gender: 'female', dob: '2014-12-20', class: '6', section: 'C', parentName: 'Ravi Das', parentPhone: '9876543301', address: '12 Yelahanka, Bangalore', admissionDate: '2024-06-01', status: 'active', feeStatus: 'paid', bloodGroup: 'A+' },
];

// ──────────────────────────────────────────────────────────
// Teachers
// ──────────────────────────────────────────────────────────
export const mockTeachers: Teacher[] = [
    { id: 't1', employeeId: 'T001', name: 'Dr. Kavitha Krishnan', email: 'kavitha@school.edu', phone: '9811001001', gender: 'female', dob: '1980-05-10', subjects: ['Mathematics', 'Statistics'], classes: ['10A', '10B', '9A'], qualification: 'M.Sc., Ph.D. Mathematics', experience: 15, joinDate: '2010-06-01', status: 'active', department: 'Mathematics', salary: 75000 },
    { id: 't2', employeeId: 'T002', name: 'Mr. Ramesh Varma', email: 'ramesh@school.edu', phone: '9811001002', gender: 'male', dob: '1983-08-22', subjects: ['Physics', 'Science'], classes: ['10A', '9B', '8A'], qualification: 'M.Sc. Physics', experience: 12, joinDate: '2013-06-01', status: 'active', department: 'Science', salary: 65000 },
    { id: 't3', employeeId: 'T003', name: 'Ms. Anjali Mishra', email: 'anjali@school.edu', phone: '9811001003', gender: 'female', dob: '1985-02-15', subjects: ['English', 'Literature'], classes: ['10B', '9A', '8B'], qualification: 'M.A. English', experience: 10, joinDate: '2015-06-01', status: 'active', department: 'Languages', salary: 58000 },
    { id: 't4', employeeId: 'T004', name: 'Mr. Sanjay Tiwari', email: 'sanjay@school.edu', phone: '9811001004', gender: 'male', dob: '1978-11-30', subjects: ['History', 'Civics', 'Social Science'], classes: ['9A', '9B', '8A', '8B'], qualification: 'M.A. History', experience: 18, joinDate: '2007-06-01', status: 'active', department: 'Social Sciences', salary: 70000 },
    { id: 't5', employeeId: 'T005', name: 'Ms. Preethi Rao', email: 'preethi@school.edu', phone: '9811001005', gender: 'female', dob: '1990-07-08', subjects: ['Computer Science', 'IT'], classes: ['10A', '10B', '9A', '9B'], qualification: 'M.Tech CSE', experience: 7, joinDate: '2018-06-01', status: 'active', department: 'Technology', salary: 72000 },
    { id: 't6', employeeId: 'T006', name: 'Mr. Arun Pillai', email: 'arun@school.edu', phone: '9811001006', gender: 'male', dob: '1982-03-20', subjects: ['Chemistry', 'Biology'], classes: ['10A', '9A', '8A'], qualification: 'M.Sc. Chemistry', experience: 14, joinDate: '2011-06-01', status: 'active', department: 'Science', salary: 68000 },
    { id: 't7', employeeId: 'T007', name: 'Ms. Divya Sharma', email: 'divya@school.edu', phone: '9811001007', gender: 'female', dob: '1987-09-14', subjects: ['Hindi', 'Sanskrit'], classes: ['8A', '8B', '7A', '7B'], qualification: 'M.A. Hindi', experience: 9, joinDate: '2016-06-01', status: 'inactive', department: 'Languages', salary: 55000 },
];

// ──────────────────────────────────────────────────────────
// Classes & Sections
// ──────────────────────────────────────────────────────────
export const mockClasses: ClassSection[] = [
    { id: 'c1', name: '10', section: 'A', classTeacher: 'Dr. Kavitha Krishnan', totalStudents: 38, capacity: 40, room: 'R-101' },
    { id: 'c2', name: '10', section: 'B', classTeacher: 'Mr. Ramesh Varma', totalStudents: 36, capacity: 40, room: 'R-102' },
    { id: 'c3', name: '9', section: 'A', classTeacher: 'Ms. Anjali Mishra', totalStudents: 40, capacity: 40, room: 'R-201' },
    { id: 'c4', name: '9', section: 'B', classTeacher: 'Mr. Sanjay Tiwari', totalStudents: 37, capacity: 40, room: 'R-202' },
    { id: 'c5', name: '8', section: 'A', classTeacher: 'Ms. Preethi Rao', totalStudents: 35, capacity: 40, room: 'R-301' },
    { id: 'c6', name: '8', section: 'B', classTeacher: 'Mr. Arun Pillai', totalStudents: 33, capacity: 40, room: 'R-302' },
    { id: 'c7', name: '8', section: 'C', classTeacher: 'Ms. Divya Sharma', totalStudents: 30, capacity: 40, room: 'R-303' },
    { id: 'c8', name: '7', section: 'A', classTeacher: 'Dr. Kavitha Krishnan', totalStudents: 42, capacity: 45, room: 'R-401' },
    { id: 'c9', name: '7', section: 'B', classTeacher: 'Mr. Ramesh Varma', totalStudents: 41, capacity: 45, room: 'R-402' },
    { id: 'c10', name: '6', section: 'A', classTeacher: 'Ms. Anjali Mishra', totalStudents: 44, capacity: 45, room: 'R-501' },
];

// ──────────────────────────────────────────────────────────
// Subjects
// ──────────────────────────────────────────────────────────
export const mockSubjects: Subject[] = [
    { id: 'sub1', name: 'Mathematics', code: 'MATH10', class: '10', teacher: 'Dr. Kavitha Krishnan', periods: 6, type: 'core' },
    { id: 'sub2', name: 'Physics', code: 'PHY10', class: '10', teacher: 'Mr. Ramesh Varma', periods: 5, type: 'core' },
    { id: 'sub3', name: 'Chemistry', code: 'CHEM10', class: '10', teacher: 'Mr. Arun Pillai', periods: 5, type: 'core' },
    { id: 'sub4', name: 'English', code: 'ENG10', class: '10', teacher: 'Ms. Anjali Mishra', periods: 5, type: 'core' },
    { id: 'sub5', name: 'Computer Science', code: 'CS10', class: '10', teacher: 'Ms. Preethi Rao', periods: 4, type: 'elective' },
    { id: 'sub6', name: 'History', code: 'HIST9', class: '9', teacher: 'Mr. Sanjay Tiwari', periods: 4, type: 'core' },
];

// ──────────────────────────────────────────────────────────
// Fee Structures
// ──────────────────────────────────────────────────────────
export const mockFeeStructures: FeeStructure[] = [
    {
        id: 'fs1', name: 'Standard Fee - Class 10', class: '10',
        components: [
            { id: 'fc1', name: 'Tuition Fee', amount: 15000, category: 'tuition' },
            { id: 'fc2', name: 'Lab Fee', amount: 2000, category: 'activity' },
            { id: 'fc3', name: 'Sports Fee', amount: 1500, category: 'activity' },
            { id: 'fc4', name: 'Library Fee', amount: 500, category: 'other' },
        ],
        totalAmount: 19000,
        dueDate: '2024-04-15'
    },
    {
        id: 'fs2', name: 'Standard Fee - Class 9', class: '9',
        components: [
            { id: 'fc5', name: 'Tuition Fee', amount: 13000, category: 'tuition' },
            { id: 'fc6', name: 'Lab Fee', amount: 1500, category: 'activity' },
            { id: 'fc7', name: 'Sports Fee', amount: 1200, category: 'activity' },
        ],
        totalAmount: 15700,
        dueDate: '2024-04-15'
    },
];

// ──────────────────────────────────────────────────────────
// Fee Payments
// ──────────────────────────────────────────────────────────
export const mockFeePayments: FeePayment[] = [
    { id: 'fp1', studentId: 's1', studentName: 'Aarav Sharma', class: '10A', amount: 19000, date: '2024-04-10', method: 'online', receiptNo: 'RCP-2024-001', status: 'paid' },
    { id: 'fp2', studentId: 's2', studentName: 'Priya Patel', class: '10A', amount: 9500, date: '2024-04-12', method: 'cash', receiptNo: 'RCP-2024-002', status: 'partial' },
    { id: 'fp3', studentId: 's3', studentName: 'Rohan Mehta', class: '9B', amount: 15700, date: '2024-04-08', method: 'card', receiptNo: 'RCP-2024-003', status: 'paid' },
    { id: 'fp4', studentId: 's5', studentName: 'Karan Gupta', class: '8C', amount: 12500, date: '2024-04-05', method: 'online', receiptNo: 'RCP-2024-004', status: 'paid' },
    { id: 'fp5', studentId: 's4', studentName: 'Ananya Singh', class: '9A', amount: 0, date: '2024-04-01', method: 'cash', receiptNo: 'RCP-2024-005', status: 'overdue' },
];

// ──────────────────────────────────────────────────────────
// Attendance
// ──────────────────────────────────────────────────────────
export const mockAttendance: Attendance[] = [
    { id: 'a1', studentId: 's1', studentName: 'Aarav Sharma', date: '2024-04-15', class: '10', section: 'A', status: 'present' },
    { id: 'a2', studentId: 's2', studentName: 'Priya Patel', date: '2024-04-15', class: '10', section: 'A', status: 'absent' },
    { id: 'a3', studentId: 's3', studentName: 'Rohan Mehta', date: '2024-04-15', class: '9', section: 'B', status: 'present' },
    { id: 'a4', studentId: 's4', studentName: 'Ananya Singh', date: '2024-04-15', class: '9', section: 'A', status: 'late' },
    { id: 'a5', studentId: 's5', studentName: 'Karan Gupta', date: '2024-04-15', class: '8', section: 'C', status: 'present' },
    { id: 'a6', studentId: 's6', studentName: 'Siya Reddy', date: '2024-04-15', class: '8', section: 'B', status: 'excused' },
    { id: 'a7', studentId: 's7', studentName: 'Dev Kumar', date: '2024-04-15', class: '7', section: 'A', status: 'present' },
    { id: 'a8', studentId: 's8', studentName: 'Riya Joshi', date: '2024-04-15', class: '7', section: 'B', status: 'present' },
];

// ──────────────────────────────────────────────────────────
// Announcements
// ──────────────────────────────────────────────────────────
export const mockAnnouncements: Announcement[] = [
    { id: 'an1', title: 'Annual Sports Day', content: 'Annual Sports Day will be held on April 25th. All students are requested to participate in at least one event. Registration closes on April 20th.', target: 'all', date: '2024-04-10', author: 'Principal', priority: 'high' },
    { id: 'an2', title: 'Fee Due Reminder', content: 'All pending fees must be cleared by April 30th to avoid late payment charges. Please visit the finance office or pay online.', target: 'parents', date: '2024-04-12', author: 'Finance Office', priority: 'high' },
    { id: 'an3', title: 'Staff Meeting', content: 'A staff meeting will be held on April 18th at 3 PM in the conference hall. Attendance is mandatory for all teaching staff.', target: 'teachers', date: '2024-04-14', author: 'Principal', priority: 'medium' },
    { id: 'an4', title: 'Library Renovation', content: 'The library will be closed for renovation from April 22nd to April 28th. Alternative reading resources will be available online.', target: 'all', date: '2024-04-16', author: 'Admin', priority: 'low' },
];

// ──────────────────────────────────────────────────────────
// Chart Data
// ──────────────────────────────────────────────────────────
export const monthlyFeeData: ChartDataPoint[] = [
    { month: 'Aug', collected: 285000, pending: 45000 },
    { month: 'Sep', collected: 310000, pending: 38000 },
    { month: 'Oct', collected: 295000, pending: 52000 },
    { month: 'Nov', collected: 320000, pending: 28000 },
    { month: 'Dec', collected: 280000, pending: 60000 },
    { month: 'Jan', collected: 340000, pending: 22000 },
    { month: 'Feb', collected: 315000, pending: 35000 },
    { month: 'Mar', collected: 360000, pending: 18000 },
    { month: 'Apr', collected: 298000, pending: 42000 },
];

export const attendanceData: AttendanceChartData[] = [
    { day: 'Mon', percentage: 94 },
    { day: 'Tue', percentage: 91 },
    { day: 'Wed', percentage: 96 },
    { day: 'Thu', percentage: 88 },
    { day: 'Fri', percentage: 82 },
    { day: 'Sat', percentage: 90 },
];

export const classAttendanceData = [
    { class: 'Class 6', percentage: 92 },
    { class: 'Class 7', percentage: 88 },
    { class: 'Class 8', percentage: 91 },
    { class: 'Class 9', percentage: 86 },
    { class: 'Class 10', percentage: 93 },
];

// ──────────────────────────────────────────────────────────
// Dashboard Alerts
// ──────────────────────────────────────────────────────────
export const dashboardAlerts: Alert[] = [
    { id: 'al1', type: 'warning', title: 'Low Attendance Alert', message: '12 students have attendance below 75% this month', time: '2 hours ago' },
    { id: 'al2', type: 'error', title: 'Overdue Fees', message: '28 students have overdue fee payments totalling ₹5.2L', time: '4 hours ago' },
    { id: 'al3', type: 'info', title: 'Leave Requests', message: '5 teacher leave requests pending approval', time: '6 hours ago' },
    { id: 'al4', type: 'success', title: 'New Admissions', message: '8 new admission applications received this week', time: '1 day ago' },
    { id: 'al5', type: 'warning', title: 'Exam Timetable', message: 'Mid-term exams start in 2 weeks. Timetable pending approval.', time: '1 day ago' },
];
