import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmployeeService } from './employee.service';
import { ShiftService } from './shift.service';
import { Employee, EmployeeTotals } from '../models/employee';
import { GeneralInfo } from '../models/general-info';

interface Totals {
  totalClockedInTime: number;
  totalRegularHoursAmount: number;
  totalOvertimeAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeShiftService {

  constructor(
    private employeeService: EmployeeService,
    private shiftService: ShiftService,
  ) { }

  private calculateTotals(shifts: any[], employee: any): Totals {
    let totalClockedInTime = 0;
    let totalRegularHoursAmount = 0;
    let totalOvertimeAmount = 0;

    for (const shift of shifts) {
        const clockIn = new Date(shift.clockIn);
        const clockOut = new Date(shift.clockOut);

        let hoursWorkedToday = 0;
        let hoursWorkedTomorrow = 0;

        if (clockOut < clockIn) {
            // Shift crosses over to the next day
            const midnight = new Date(clockIn);
            midnight.setHours(24, 0, 0, 0);
            hoursWorkedToday = (midnight.getTime() - clockIn.getTime()) / 1000 / 60 / 60;
            hoursWorkedTomorrow = (clockOut.getTime() - midnight.getTime()) / 1000 / 60 / 60;
        } else {
            // Shift does not cross over to the next day
            hoursWorkedToday = (clockOut.getTime() - clockIn.getTime()) / 1000 / 60 / 60;
        }

        totalClockedInTime += hoursWorkedToday + hoursWorkedTomorrow;

        const regularHours = 8;

        // Calculate totals for today
        if (hoursWorkedToday <= regularHours) {
            totalRegularHoursAmount += hoursWorkedToday * employee.hourlyRate;
        } else {
            const overtimeHours = hoursWorkedToday - regularHours;
            totalRegularHoursAmount += regularHours * employee.hourlyRate;
            totalOvertimeAmount += overtimeHours * employee.hourlyRateOvertime;
        }

        // Calculate totals for tomorrow
        if (hoursWorkedTomorrow > 0) {
            if (hoursWorkedTomorrow <= regularHours) {
                totalRegularHoursAmount += hoursWorkedTomorrow * employee.hourlyRate;
            } else {
                const overtimeHours = hoursWorkedTomorrow - regularHours;
                totalRegularHoursAmount += regularHours * employee.hourlyRate;
                totalOvertimeAmount += overtimeHours * employee.hourlyRateOvertime;
            }
        }
    }

    return {
        totalClockedInTime,
        totalRegularHoursAmount,
        totalOvertimeAmount
    };
}

  getGeneralInfo(): Observable<GeneralInfo[]> {
    return forkJoin({
      employees: this.employeeService.getAllEmployees(),
      shifts: this.shiftService.getAllShifts(),
    }).pipe(
      map(({ employees, shifts }) => {
        const totalEmployees = employees.length;
        let totalClockedInTime = 0;
        let totalRegularHoursAmount = 0;
        let totalOvertimeAmount = 0;

        for (const shift of shifts) {
          const employee = employees.find((employee: Employee) => employee.id === shift.employeeId);
          if (employee) {
            const totals = this.calculateTotals([shift], employee);
            totalClockedInTime += totals.totalClockedInTime;
            totalRegularHoursAmount += totals.totalRegularHoursAmount;
            totalOvertimeAmount += totals.totalOvertimeAmount;
          }
        }

        return [{
          totalEmployees,
          totalClockedInTime,
          totalRegularHoursAmount,
          totalOvertimeAmount
        }];
      })
    );
  }

  getDetailedInfo(): Observable<EmployeeTotals[]> {
    return forkJoin({
      employees: this.employeeService.getAllEmployees(),
      shifts: this.shiftService.getAllShifts(),
    }).pipe(
      map(({ employees, shifts }) => {
        return employees.map((employee: any) => {
          const employeeShifts = shifts.filter((shift: any) => shift.employeeId === employee.id);

          return {
            ...employee,
            ...this.calculateTotals(employeeShifts, employee),
            employeeShifts,
          };
        });
      })
    );
  }
}