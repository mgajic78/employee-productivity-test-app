import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BulkEditDialogComponent, BulkEditDialogData } from '../bulk-edit-dialog/bulk-edit-dialog.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { ApiErrorInterceptor } from '../../services/api-error.interceptor';
import { EmployeeShiftService } from '../../services/employee-shift.service';
import { Observable, first, map, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeTotals } from '../../models/employee';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface EmployeeTableRowData extends EmployeeTotals {
  isSelected: boolean
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
    HttpClient,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  // TODO: use GeneralInfo[] instead of any
  dataSource$: Observable<any> | null = null;
  detailedDataSource = new MatTableDataSource<EmployeeTableRowData>();

  // TODO: rename columns
  displayedColumns: string[] = ['totalEmployees', 'totalClockedInTime', 'totalRegularHoursAmount', 'totalOvertimeAmount'];
  detailedDisplayedColumns: string[] = ['isSelected', 'column2', 'column3', 'column4', 'column5', 'column6'];

  isGeneralInfoLoaded = false;
  isDetailedInfoLoaded = false;

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    public dialog: MatDialog,
    private employeeShiftService: EmployeeShiftService,
    private employeeService: EmployeeService,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.detailedDataSource.paginator = this.paginator;
  }

  private fetchGeneralInfo(): void {
    this.dataSource$ = this.employeeShiftService.getGeneralInfo().pipe(
      startWith([]),
    );
  }

  private fetchDetailedInfo(): void {
    this.employeeShiftService.getDetailedInfo().pipe(
      first(),
      map((data: EmployeeTotals[]) => data.map((employee: EmployeeTotals) => ({ ...employee, isSelected: false }))
      )).subscribe(data => {
      this.detailedDataSource.data = data;
      this.isDetailedInfoLoaded = true;
    });
  }

  private loadData(): void {
    console.log('Loading data...');
    this.fetchGeneralInfo();
    this.fetchDetailedInfo();
  }

  getSelectedRows(): EmployeeTableRowData[] {
    return this.detailedDataSource.data.filter(row => row.isSelected);
  }

  sortByName(): void {
    // backup the EmployeeTableRowData of the rows before sorting
    const employeeTableRowDataMap = this.detailedDataSource.data.reduce((acc: any, row) => {
      acc[row.id] = row;
      return acc;
    }, {});

    this.employeeService.getEmployeesSortedByName().pipe(first()).subscribe(employees => {
      // restore them after sorting
      this.detailedDataSource.data = employees.map(employee => {
        const existingRowData = employeeTableRowDataMap[employee.id];
        return existingRowData ? existingRowData : {
          employee: employee,
          isSelected: false,
          totalClockedInTime: 0,
          totalRegularHoursAmount: 0,
          totalOvertimeAmount: 0,
          employeeShifts: []
        };
      });
    });
  }

  openBulkEditDialog(): void {
    const selectedRows = this.getSelectedRows();
    console.log(selectedRows)
    const dialogRef = this.dialog.open(BulkEditDialogComponent, {
      data: { employees: selectedRows } as BulkEditDialogData,
      width: '80vw', // 80% of viewport width
      height: '80vh', // 80% of viewport height
      panelClass: 'bulk-edit-dialog',
    });

    dialogRef.afterClosed().pipe(first()).subscribe(isSaved => {
      if (isSaved) {
        this.loadData();
      }
    });
  }
}
