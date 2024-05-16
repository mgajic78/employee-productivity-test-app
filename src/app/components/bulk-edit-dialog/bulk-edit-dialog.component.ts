import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker'
import { EmployeeDetails } from '../../models/employee';
import { Shift } from '../../models/shift';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { ShiftService } from '../../services/shift.service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface BulkEditDialogData {
  employees: EmployeeDetails[];
}

@Component({
  selector: 'app-bulk-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './bulk-edit-dialog.component.html',
  styleUrl: './bulk-edit-dialog.component.scss',
})
export class BulkEditDialogComponent {

  form: FormGroup = this.fb.group({});

  displayedColumns: string[] = ['shift', 'clockIn', 'clockOut', 'totalTime'];

  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<BulkEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkEditDialogData,
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private shiftService: ShiftService,
  ) {

  }

  ngOnInit(): void {
    this.form = this.fb.group({
      employees: this.fb.array(this.data.employees.map(employee => this.createEmployeeForm(employee)))
    });
  }

  createEmployeeForm(employee: EmployeeDetails): FormGroup {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of day

    const shiftsForToday = this.getShiftsByDate(employee.employeeShifts, today)

    return this.fb.group({
      id: [employee.id],
      name: [employee.name, Validators.required],
      hourlyRate: [employee.hourlyRate, Validators.required],
      hourlyRateOvertime: [employee.hourlyRateOvertime, Validators.required],
      selectedDate: [today],
      shifts: this.fb.array(this.createShiftsFormGroups(shiftsForToday, today))
    });
  }

  createShiftsFormGroups(shifts: Shift[], date: Date): FormGroup[] {
    return shifts.map(shift => this.createShiftForm(shift, date));
  }

  createShiftForm(shift: Shift, date: Date): FormGroup {
    const shiftForm = this.fb.group({
      id: [shift.id],
      employeeId: [shift.employeeId],
      clockIn: [this.formatDate(shift.clockIn), [Validators.required, timeFormatValidator()]],
      clockOut: [this.formatDate(shift.clockOut), [Validators.required, timeFormatValidator()]],
      totalTime: [this.calculateTotalTime(shift.clockIn, shift.clockOut)],
      selectedDate: [date]
    });

    shiftForm.get('clockIn')?.valueChanges.subscribe(newClockIn => {
      const clockOut = shiftForm.get('clockOut')?.value!;
      const selectedDate = shiftForm.get('selectedDate')?.value!;
      const clockInTimestamp = this.convertFormattedTimeToTimestamp(selectedDate, newClockIn!);
      const clockOutTimestamp = this.convertFormattedTimeToTimestamp(
        this.getClockOutDate(newClockIn!, clockOut, selectedDate), clockOut
      );
      shiftForm.patchValue({ totalTime: this.calculateTotalTime(clockInTimestamp, clockOutTimestamp) });
    });

    shiftForm.get('clockOut')?.valueChanges.subscribe(newClockOut => {
      const clockIn = shiftForm.get('clockIn')?.value!;
      const selectedDate = shiftForm.get('selectedDate')?.value!;
      const clockInTimestamp = this.convertFormattedTimeToTimestamp(selectedDate, clockIn);
      const clockOutTimestamp = this.convertFormattedTimeToTimestamp(
        this.getClockOutDate(clockIn, newClockOut!, selectedDate), newClockOut!
      );
      shiftForm.patchValue({ totalTime: this.calculateTotalTime(clockInTimestamp, clockOutTimestamp) });
    });

    return shiftForm;
  }

  displayEmployeeShiftsForDate(employeeIndex: number, date: Date): void {

    const shifts = this.data.employees[employeeIndex].employeeShifts;
    const shiftsForCurrentDate = this.getShiftsByDate(shifts, date);


    const employeeForm = (this.form.get('employees') as FormArray).at(employeeIndex) as FormGroup;
    employeeForm.setControl('shifts', this.fb.array(this.createShiftsFormGroups(shiftsForCurrentDate, date)));
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return this.formatTime(date.getHours(), date.getMinutes());
  }

  calculateTotalTime(clockIn: number, clockOut: number): string {
    let totalTime = clockOut - clockIn;

    // Convert totalTime from milliseconds to minutes
    totalTime /= 60000;

    const hours = Math.floor(totalTime / 60);
    const minutes = Math.round(totalTime % 60);

    return this.formatTime(hours, minutes);
  }

  private getShiftsByDate(allShifts: Shift[], date: Date): Shift[] {
    return allShifts.filter(shift => {
      const shiftDate = new Date(shift.clockIn);
      return shiftDate.getFullYear() === date.getFullYear() &&
                shiftDate.getMonth() === date.getMonth() && shiftDate.getDate() === date.getDate();
    });
  }

  private formatTime(hours: number, minutes: number): string {

    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedTime = `${formattedHours}:${formattedMinutes}`;

    return formattedTime;
  }

  get employees(): FormArray {
    return this.form.get('employees') as FormArray;
  }

  getShifts(employeeIndex: number): FormArray {
    return this.employees.at(employeeIndex)?.get('shifts') as FormArray;
  }

  onCancelBtnClick(): void {
    this.dialogRef.close();
  }

  onSaveBtnClick(): void {

    this.isSaving = true;
    const updateObservables = [];

    for (let i = 0; i < this.employees.length; i++) {
      const employeeGroup = this.employees.at(i) as FormGroup;
      const employee = employeeGroup.value
      updateObservables.push(this.employeeService.updateEmployee(employee.id, employee));

      const shifts = this.getShifts(i);

      for (let j = 0; j < shifts.length; j++) {

        const shiftGroup = shifts.at(j) as FormGroup;
        const shift = shiftGroup.value;

        const selectedDate = employeeGroup.get('selectedDate')?.value;

        shift.clockIn = this.convertFormattedTimeToTimestamp(selectedDate, shift.clockIn);
        const clockOutDate = this.getClockOutDate(shift.clockIn, shift.clockOut, selectedDate);
        shift.clockOut = this.convertFormattedTimeToTimestamp(clockOutDate, shift.clockOut);

        delete shift.totalTime;
        delete shift.selectedDate;

        updateObservables.push(this.shiftService.updateShift(shift.id, shift));
      }
    }

    forkJoin(updateObservables).subscribe({
      error: (err) => {
        console.error('Error updating data:', err);
        this.isSaving = false;
        // TODO show error message
      },
      complete: () => {
        console.log('Data updated successfully');
        // TODO: show success message
        this.dialogRef.close(true);
        this.isSaving = false;
      }
    });
  }

  private getClockOutDate(clockInFormattedTime: string, clockOutFormattedTime: string, date: Date): Date {
    return (clockOutFormattedTime < clockInFormattedTime ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date);
  }

  private convertFormattedTimeToTimestamp(date: Date, formattedTime: string): number {
    const timeParts = formattedTime.split(':');

    date.setHours(parseInt(timeParts[0]));
    date.setMinutes(parseInt(timeParts[1]));

    return date.getTime();
  }
}


function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    const valid = /^([01]\d|2[0-3]):?([0-5]\d)$/.test(control.value);
    return valid ? null : {invalidTime: {value: control.value}};
  };
}

