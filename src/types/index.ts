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
    target: 'all' | 'student' | 'students' | 'teachers' | 'parent' | 'parents' | 'student_parent';
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

// ============================================================
// HR & Staff Management Types
// ============================================================

// Teacher Attendance Types
export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
export type CheckInMethod = 'manual' | 'biometric' | 'qr-code' | 'self-checkin';

export interface TeacherAttendance {
    id: string;
    teacherId: string;
    teacherName: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    status: TeacherAttendanceStatus;
    method: CheckInMethod;
    lateMinutes?: number;
    notes?: string;
    location?: string;
}

export interface TeacherAttendanceStats {
    teacherId: string;
    teacherName: string;
    department: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    leaveDays: number;
    attendancePercentage: number;
    punctualityPercentage: number;
}

// Leave Management Types
export type LeaveType = 'sick' | 'casual' | 'maternity' | 'paternity' | 'earned' | 'compensatory' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveDuration = 'full-day' | 'half-day' | 'multiple-days';

export interface LeaveApplication {
    id: string;
    teacherId: string;
    teacherName: string;
    department: string;
    leaveType: LeaveType;
    duration: LeaveDuration;
    fromDate: string;
    toDate: string;
    totalDays: number;
    reason: string;
    documents?: string[];
    status: LeaveStatus;
    appliedDate: string;
    approvalChain: ApprovalStep[];
    currentApprover?: string;
    finalRemarks?: string;
}

export interface ApprovalStep {
    level: number;
    approverRole: string;
    approverName: string;
    approverId?: string;
    status: 'pending' | 'approved' | 'rejected';
    remarks?: string;
    actionDate?: string;
}

export interface LeaveBalance {
    teacherId: string;
    teacherName: string;
    year: number;
    leaveAllocations: LeaveAllocation[];
    updatedAt: string;
}

export interface LeaveAllocation {
    leaveType: LeaveType;
    allocated: number;
    used: number;
    balance: number;
    carriedForward?: number;
}

export interface LeavePolicy {
    id: string;
    role: string;
    leaveType: LeaveType;
    annualQuota: number;
    maxConsecutiveDays: number;
    carryForwardAllowed: boolean;
    maxCarryForward?: number;
    encashmentAllowed: boolean;
    requiresDocument: boolean;
    approvalLevels: string[];
}

// Payroll & Salary Types
export type PaymentMethod = 'bank-transfer' | 'cash' | 'cheque';
export type SalaryStatus = 'draft' | 'processed' | 'paid' | 'on-hold';

export interface SalaryStructure {
    id: string;
    teacherId: string;
    teacherName: string;
    effectiveFrom: string;
    basicPay: number;
    allowances: SalaryComponent[];
    deductions: SalaryComponent[];
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    paymentMethod: PaymentMethod;
    bankDetails?: BankDetails;
}

export interface SalaryComponent {
    id: string;
    name: string;
    type: 'allowance' | 'deduction';
    category: 'fixed' | 'variable' | 'percentage';
    amount: number;
    percentage?: number;
    baseComponent?: string;
    taxable: boolean;
}

export interface BankDetails {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
}

export interface Payroll {
    id: string;
    teacherId: string;
    teacherName: string;
    department: string;
    month: string;
    year: number;
    workingDays: number;
    presentDays: number;
    paidDays: number;
    leaveDays: number;
    basicPay: number;
    allowances: PayrollComponent[];
    deductions: PayrollComponent[];
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: SalaryStatus;
    processedDate?: string;
    paidDate?: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    remarks?: string;
}

export interface PayrollComponent {
    name: string;
    amount: number;
    taxable: boolean;
}

export interface SalarySlip {
    payrollId: string;
    teacherId: string;
    teacherName: string;
    employeeId: string;
    department: string;
    designation: string;
    month: string;
    year: number;
    payPeriod: string;
    generatedDate: string;
    bankDetails: BankDetails;
    earnings: PayrollComponent[];
    deductions: PayrollComponent[];
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    inWords: string;
}

export interface LoanAdvance {
    id: string;
    teacherId: string;
    teacherName: string;
    type: 'loan' | 'advance';
    amount: number;
    approvedAmount: number;
    reason: string;
    requestDate: string;
    approvalDate?: string;
    status: 'pending' | 'approved' | 'rejected' | 'closed';
    installments: number;
    installmentAmount: number;
    paidInstallments: number;
    remainingAmount: number;
    startDate?: string;
    endDate?: string;
}

// Performance Management Types
export type ReviewCycle = 'quarterly' | 'half-yearly' | 'annual';
export type ReviewStatus = 'not-started' | 'in-progress' | 'completed' | 'acknowledged';
export type RatingScale = 1 | 2 | 3 | 4 | 5;

export interface PerformanceReview {
    id: string;
    teacherId: string;
    teacherName: string;
    department: string;
    reviewCycle: ReviewCycle;
    reviewPeriodStart: string;
    reviewPeriodEnd: string;
    reviewDate: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
    status: ReviewStatus;
    goals: PerformanceGoal[];
    competencies: CompetencyRating[];
    overallRating: RatingScale;
    strengths: string[];
    areasOfImprovement: string[];
    trainingRecommendations: string[];
    comments: string;
    employeeComments?: string;
    acknowledgedDate?: string;
}

export interface PerformanceGoal {
    id: string;
    title: string;
    description: string;
    category: 'teaching' | 'research' | 'admin' | 'professional-development' | 'other';
    targetDate: string;
    weight: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
    achievement: number;
    rating?: RatingScale;
    comments?: string;
}

export interface CompetencyRating {
    competency: string;
    category: 'technical' | 'behavioral' | 'leadership' | 'communication';
    rating: RatingScale;
    comments?: string;
}

export interface TeacherFeedback {
    id: string;
    teacherId: string;
    teacherName: string;
    subject: string;
    class: string;
    feedbackType: 'student' | 'peer' | 'parent' | 'observation';
    feedbackDate: string;
    submittedBy: string;
    submitterRole: string;
    ratings: FeedbackRating[];
    averageRating: number;
    comments: string;
    anonymous: boolean;
}

export interface FeedbackRating {
    parameter: string;
    rating: RatingScale;
}

// Contract & Document Management Types
export type ContractType = 'permanent' | 'temporary' | 'contract' | 'probation' | 'part-time';
export type ContractStatus = 'active' | 'expired' | 'terminated' | 'renewed';
export type DocumentType = 'resume' | 'certificate' | 'id-proof' | 'address-proof' | 'photo' | 'bank-document' | 'medical' | 'background-verification' | 'training' | 'other';
export type DocumentStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface EmploymentContract {
    id: string;
    teacherId: string;
    teacherName: string;
    contractType: ContractType;
    designation: string;
    department: string;
    startDate: string;
    endDate?: string;
    probationPeriod?: number;
    noticePeriod: number;
    salary: number;
    terms: string[];
    responsibilities: string[];
    benefits: string[];
    signedDate: string;
    contractDocument?: string;
    status: ContractStatus;
    renewalDate?: string;
    terminationDate?: string;
    terminationReason?: string;
    renewalHistory: ContractRenewal[];
}

export interface ContractRenewal {
    renewalDate: string;
    previousEndDate: string;
    newEndDate: string;
    salaryChange?: number;
    termsChanged: boolean;
    remarks: string;
}

export interface TeacherDocument {
    id: string;
    teacherId: string;
    teacherName: string;
    documentType: DocumentType;
    documentName: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedDate: string;
    uploadedBy: string;
    status: DocumentStatus;
    verifiedBy?: string;
    verifiedDate?: string;
    remarks?: string;
}

export interface DocumentCategory {
    category: DocumentType;
    displayName: string;
    required: boolean;
    requiresVerification: boolean;
    expiryTracking: boolean;
}

// HR Dashboard Types
export interface HRDashboardStats {
    totalStaff: number;
    presentToday: number;
    onLeave: number;
    absentToday: number;
    pendingLeaveApplications: number;
    upcomingContractRenewals: number;
    pendingDocumentVerifications: number;
    averageAttendance: number;
}

export interface HRAlert {
    id: string;
    type: 'leave-pending' | 'contract-expiring' | 'document-expiring' | 'performance-due' | 'salary-pending';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    relatedId: string;
    relatedType: string;
    actionRequired: boolean;
    createdDate: string;
}

// ============================================================
// Examination Management Types
// ============================================================

export type ExamType = 'unit-test' | 'midterm' | 'final' | 'practical' | 'oral';
export type ExamLifecycleStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published' | 'archived';
export type MarksEntryStatus = 'draft' | 'submitted' | 'verified' | 'locked';

export interface ExamTerm {
    id: string;
    name: string;
    academicYear: string;
    examType: ExamType;
    startDate: string;
    endDate: string;
    status: ExamLifecycleStatus;
    createdBy: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExamSchedule {
    id: string;
    examTermId: string;
    examName: string;
    className: string;
    section: string;
    subjectCode: string;
    subjectName: string;
    examDate: string;
    startTime: string;
    endTime: string;
    room: string;
    invigilatorTeacherId?: string;
    invigilatorName?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt?: string;
    updatedAt?: string;
}

export interface MarksEntry {
    id: string;
    examTermId: string;
    className: string;
    section: string;
    subjectCode: string;
    subjectName: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    maxMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    result: 'pass' | 'fail' | 'absent';
    absent: boolean;
    remarks?: string;
    enteredBy: string;
    status: MarksEntryStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExamResult {
    id: string;
    examTermId: string;
    className: string;
    section: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    totalSubjects: number;
    totalMaxMarks: number;
    totalObtainedMarks: number;
    overallPercentage: number;
    overallGrade: string;
    rank?: number;
    resultStatus: 'pass' | 'fail';
    published: boolean;
    publishedAt?: string;
}

export interface ReportCard {
    id: string;
    examTermId: string;
    studentId: string;
    studentName: string;
    className: string;
    section: string;
    rollNo: string;
    examName: string;
    academicYear: string;
    subjects: Array<{
        subjectCode: string;
        subjectName: string;
        maxMarks: number;
        obtainedMarks: number;
        grade: string;
        result: 'pass' | 'fail' | 'absent';
    }>;
    totalMaxMarks: number;
    totalObtainedMarks: number;
    overallPercentage: number;
    overallGrade: string;
    finalResult: 'pass' | 'fail';
    generatedAt: string;
}
