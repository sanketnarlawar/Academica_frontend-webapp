import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SalaryStructure, Payroll, SalarySlip, LoanAdvance } from '../types';

const SALARY_STRUCTURES = 'salaryStructures';
const PAYROLLS = 'payrolls';
const LOAN_ADVANCES = 'loanAdvances';

export const firebasePayrollService = {
  // Salary Structure Management
  /**
   * Get all salary structures
   */
  getSalaryStructures: async (): Promise<SalaryStructure[]> => {
    try {
      const snapshot = await getDocs(collection(db, SALARY_STRUCTURES));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SalaryStructure[];
    } catch (error) {
      console.error('Error fetching salary structures:', error);
      throw error;
    }
  },

  /**
   * Get salary structure by teacher ID
   */
  getSalaryStructureByTeacher: async (
    teacherId: string
  ): Promise<SalaryStructure | null> => {
    try {
      const q = query(
        collection(db, SALARY_STRUCTURES),
        where('teacherId', '==', teacherId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Get the most recent structure
      const structures = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SalaryStructure[];

      structures.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
      return structures[0];
    } catch (error) {
      console.error('Error fetching teacher salary structure:', error);
      throw error;
    }
  },

  /**
   * Add salary structure
   */
  addSalaryStructure: async (
    structureData: Omit<SalaryStructure, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, SALARY_STRUCTURES), {
        ...structureData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding salary structure:', error);
      throw error;
    }
  },

  /**
   * Update salary structure
   */
  updateSalaryStructure: async (
    id: string,
    updates: Partial<SalaryStructure>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, SALARY_STRUCTURES, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating salary structure:', error);
      throw error;
    }
  },

  /**
   * Delete salary structure
   */
  deleteSalaryStructure: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, SALARY_STRUCTURES, id));
    } catch (error) {
      console.error('Error deleting salary structure:', error);
      throw error;
    }
  },

  // Payroll Management
  /**
   * Get all payroll records
   */
  getPayrolls: async (month?: string, year?: number): Promise<Payroll[]> => {
    try {
      let q = query(collection(db, PAYROLLS), orderBy('year', 'desc'), orderBy('month', 'desc'));

      if (month && year) {
        q = query(
          collection(db, PAYROLLS),
          where('month', '==', month),
          where('year', '==', year)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payroll[];
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      throw error;
    }
  },

  /**
   * Get payroll by teacher
   */
  getPayrollByTeacher: async (
    teacherId: string,
    year?: number
  ): Promise<Payroll[]> => {
    try {
      let q = query(
        collection(db, PAYROLLS),
        where('teacherId', '==', teacherId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );

      if (year) {
        q = query(q, where('year', '==', year));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payroll[];
    } catch (error) {
      console.error('Error fetching teacher payroll:', error);
      throw error;
    }
  },

  /**
   * Generate monthly payroll
   */
  generateMonthlyPayroll: async (
    month: string,
    year: number,
    teacherIds?: string[]
  ): Promise<number> => {
    try {
      const { firebaseTeacherService } = await import('./firebaseTeacherService');
      const { firebaseTeacherAttendanceService } = await import(
        './firebaseTeacherAttendanceService'
      );

      // Get all teachers or specific teachers
      const allTeachers = await firebaseTeacherService.getTeachers();
      const teachers = teacherIds
        ? allTeachers.filter((t) => teacherIds.includes(t.id))
        : allTeachers.filter((t) => t.status === 'active');

      const monthNumberFromInput = (() => {
        const numericMonth = Number(month);
        if (!Number.isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          return numericMonth;
        }

        const parsed = new Date(`${month} 1, ${year}`).getMonth() + 1;
        return Number.isNaN(parsed) || parsed < 1 || parsed > 12 ? 1 : parsed;
      })();

      let processedCount = 0;

      for (const teacher of teachers) {
        // Check if payroll already exists
        const existing = await getDocs(
          query(
            collection(db, PAYROLLS),
            where('teacherId', '==', teacher.id),
            where('month', '==', month),
            where('year', '==', year)
          )
        );

        if (!existing.empty) {
          continue; // Skip if already processed
        }

        // Get salary structure
        const structure = await firebasePayrollService.getSalaryStructureByTeacher(
          teacher.id
        );

        const effectiveStructure = structure || {
          basicPay: teacher.salary || 0,
          allowances: [],
          deductions: [],
          paymentMethod: 'bank-transfer' as const,
        };

        // Calculate attendance
        const monthString = String(monthNumberFromInput).padStart(2, '0');
        const startDate = `${year}-${monthString}-01`;
        const endDate = `${year}-${monthString}-31`;
        const attendanceRecords =
          await firebaseTeacherAttendanceService.getAttendanceByTeacher(
            teacher.id,
            startDate,
            endDate
          );

        const workingDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          (r) => r.status === 'present' || r.status === 'late'
        ).length;
        const halfDays = attendanceRecords.filter((r) => r.status === 'half-day').length;
        const leaveDays = attendanceRecords.filter((r) => r.status === 'on-leave').length;
        const paidDays = presentDays + halfDays * 0.5 + leaveDays;

        // Calculate salary
        const dailyBasicPay = effectiveStructure.basicPay / 30;
        const basicPay = dailyBasicPay * paidDays;

        const allowances = effectiveStructure.allowances.map((comp) => ({
          name: comp.name,
          amount: comp.category === 'percentage'
            ? (basicPay * (comp.percentage || 0)) / 100
            : (comp.amount / 30) * paidDays,
          taxable: comp.taxable,
        }));

        const deductions = effectiveStructure.deductions.map((comp) => ({
          name: comp.name,
          amount: comp.category === 'percentage'
            ? (basicPay * (comp.percentage || 0)) / 100
            : comp.amount,
          taxable: comp.taxable,
        }));

        // Check for loan/advance deductions
        const loanDeductions = await firebasePayrollService.getLoanInstallments(
          teacher.id,
          month,
          year
        );
        deductions.push(...loanDeductions);

        const grossSalary =
          basicPay + allowances.reduce((sum, a) => sum + a.amount, 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        const netSalary = grossSalary - totalDeductions;

        // Create payroll record
        const payrollData: Omit<Payroll, 'id'> = {
          teacherId: teacher.id,
          teacherName: teacher.name,
          department: teacher.department || 'General',
          month,
          year,
          workingDays,
          presentDays,
          paidDays,
          leaveDays,
          basicPay,
          allowances,
          deductions,
          grossSalary,
          totalDeductions,
          netSalary,
          status: 'draft',
          paymentMethod: effectiveStructure.paymentMethod,
        };

        await addDoc(collection(db, PAYROLLS), {
          ...payrollData,
          createdAt: Timestamp.now(),
        });

        processedCount++;
      }

      return processedCount;
    } catch (error) {
      console.error('Error generating monthly payroll:', error);
      throw error;
    }
  },

  /**
   * Update payroll
   */
  updatePayroll: async (id: string, updates: Partial<Payroll>): Promise<void> => {
    try {
      await updateDoc(doc(db, PAYROLLS, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  },

  /**
   * Process payment (mark as paid)
   */
  processPayment: async (
    payrollId: string,
    transactionId: string,
    remarks?: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, PAYROLLS, payrollId), {
        status: 'paid',
        paidDate: new Date().toISOString(),
        transactionId,
        remarks,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  /**
   * Generate salary slip
   */
  generateSalarySlip: async (payrollId: string): Promise<SalarySlip | null> => {
    try {
      const payrollDoc = await getDoc(doc(db, PAYROLLS, payrollId));

      if (!payrollDoc.exists()) {
        return null;
      }

      const payroll = { id: payrollDoc.id, ...payrollDoc.data() } as Payroll;
      const { firebaseTeacherService } = await import('./firebaseTeacherService');
      const teacher = await firebaseTeacherService.getTeacherById(payroll.teacherId);

      if (!teacher) {
        return null;
      }

      const structure = await firebasePayrollService.getSalaryStructureByTeacher(
        payroll.teacherId
      );

      const inWords = firebasePayrollService.numberToWords(payroll.netSalary);

      const salarySlip: SalarySlip = {
        payrollId: payroll.id,
        teacherId: payroll.teacherId,
        teacherName: payroll.teacherName,
        employeeId: teacher.employeeId,
        department: payroll.department,
        designation: teacher.qualification,
        month: payroll.month,
        year: payroll.year,
        payPeriod: `${payroll.month} ${payroll.year}`,
        generatedDate: new Date().toISOString(),
        bankDetails: structure?.bankDetails || {
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: '',
        },
        earnings: [
          { name: 'Base Pay', amount: payroll.basicPay, taxable: true },
          ...payroll.allowances,
        ],
        deductions: payroll.deductions,
        grossEarnings: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netPay: payroll.netSalary,
        inWords,
      };

      return salarySlip;
    } catch (error) {
      console.error('Error generating salary slip:', error);
      throw error;
    }
  },

  /**
   * Number to words converter
   */
  numberToWords: (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero Rupees Only';

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      return '';
    };

    const lakhs = Math.floor(num / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const hundreds = num % 1000;

    let result = '';
    if (lakhs) result += convert(lakhs) + ' Lakh ';
    if (thousands) result += convert(thousands) + ' Thousand ';
    if (hundreds) result += convert(hundreds);

    return result.trim() + ' Rupees Only';
  },

  // Loan & Advance Management
  /**
   * Get all loans and advances
   */
  getLoansAdvances: async (teacherId?: string): Promise<LoanAdvance[]> => {
    try {
      let q = query(collection(db, LOAN_ADVANCES), orderBy('requestDate', 'desc'));

      if (teacherId) {
        q = query(q, where('teacherId', '==', teacherId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LoanAdvance[];
    } catch (error) {
      console.error('Error fetching loans/advances:', error);
      throw error;
    }
  },

  /**
   * Request loan/advance
   */
  requestLoanAdvance: async (
    loanData: Omit<LoanAdvance, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, LOAN_ADVANCES), {
        ...loanData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error requesting loan/advance:', error);
      throw error;
    }
  },

  /**
   * Update loan/advance
   */
  updateLoanAdvance: async (
    id: string,
    updates: Partial<LoanAdvance>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, LOAN_ADVANCES, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating loan/advance:', error);
      throw error;
    }
  },

  /**
   * Get loan installments for payroll deduction
   */
  getLoanInstallments: async (
    teacherId: string,
    _month: string,
    _year: number
  ): Promise<Array<{ name: string; amount: number; taxable: boolean }>> => {
    try {
      void _month;
      void _year;
      const loans = await firebasePayrollService.getLoansAdvances(teacherId);
      const activeLoans = loans.filter(
        (loan) => loan.status === 'approved' && loan.remainingAmount > 0
      );

      const installments: Array<{ name: string; amount: number; taxable: boolean }> = [];

      for (const loan of activeLoans) {
        if (loan.paidInstallments < loan.installments) {
          installments.push({
            name: `${loan.type === 'loan' ? 'Loan' : 'Advance'} Recovery`,
            amount: Math.min(loan.installmentAmount, loan.remainingAmount),
            taxable: false,
          });

          // Update loan record
          await firebasePayrollService.updateLoanAdvance(loan.id, {
            paidInstallments: loan.paidInstallments + 1,
            remainingAmount: Math.max(
              0,
              loan.remainingAmount - loan.installmentAmount
            ),
            status:
              loan.paidInstallments + 1 >= loan.installments ||
              loan.remainingAmount - loan.installmentAmount <= 0
                ? 'closed'
                : 'approved',
          });
        }
      }

      return installments;
    } catch (error) {
      console.error('Error getting loan installments:', error);
      return [];
    }
  },

  // Reports
  /**
   * Get payroll summary for a month
   */
  getPayrollSummary: async (
    month: string,
    year: number
  ): Promise<{
    totalPayroll: number;
    totalProcessed: number;
    totalPaid: number;
    totalPending: number;
    departmentWise: Array<{ department: string; amount: number; count: number }>;
  }> => {
    try {
      const payrolls = await firebasePayrollService.getPayrolls(month, year);

      const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
      const totalProcessed = payrolls.filter((p) => p.status === 'processed' || p.status === 'paid').length;
      const totalPaid = payrolls.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);
      const totalPending = payrolls.filter((p) => p.status === 'draft' || p.status === 'processed').reduce((sum, p) => sum + p.netSalary, 0);

      const deptMap = new Map<string, { amount: number; count: number }>();

      payrolls.forEach((p) => {
        const current = deptMap.get(p.department) || { amount: 0, count: 0 };
        current.amount += p.netSalary;
        current.count += 1;
        deptMap.set(p.department, current);
      });

      const departmentWise = Array.from(deptMap.entries()).map(([department, data]) => ({
        department,
        amount: data.amount,
        count: data.count,
      }));

      return {
        totalPayroll,
        totalProcessed,
        totalPaid,
        totalPending,
        departmentWise,
      };
    } catch (error) {
      console.error('Error getting payroll summary:', error);
      throw error;
    }
  },
};
