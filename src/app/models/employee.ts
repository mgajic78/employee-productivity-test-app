import { Shift } from './shift';

export interface Employee {
  email: string;
  hourlyRate: number;
  hourlyRateOvertime: number;
  id: string;
  name: string;
}

export interface EmployeeTotals extends Employee {
  totalClockedInTime: number;
  totalRegularHoursAmount: number;
  totalOvertimeAmount: number;
  employeeShifts: Shift[];
}

export interface EmployeeDetails extends Employee, EmployeeTotals {
}