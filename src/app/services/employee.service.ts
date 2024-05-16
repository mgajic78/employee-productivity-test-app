import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from './shared/constants';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly employeesUrl = `${BASE_URL}/employees`;

  constructor(private http: HttpClient) { }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.employeesUrl);
  }

  getEmployeesWithPagination(page: number, limit: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.employeesUrl}?_page=${page}&_limit=${limit}`);
  }

  getEmployeesSortedByName(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.employeesUrl}?_sort=name&_order=asc`);
  }

  updateEmployee(employeeId: string, employeeData: Employee): Observable<Employee> {
    return this.http.patch<Employee>(`${this.employeesUrl}/${employeeId}`, employeeData);
  }
}