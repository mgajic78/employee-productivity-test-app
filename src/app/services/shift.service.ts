import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from './shared/constants';
import { Shift } from '../models/shift';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private readonly shiftsUrl = `${BASE_URL}/shifts`;

  constructor(private http: HttpClient) { }

  getAllShifts(): Observable<Shift[]> {
    return this.http.get<Shift[]>(this.shiftsUrl);
  }

  getShiftsWithPagination(page: number, limit: number): Observable< Shift[]> {
    return this.http.get<Shift[]>(`${this.shiftsUrl}?_page=${page}&_limit=${limit}`);
  }

  getShiftsSortedByStart(): Observable<any> {
    return this.http.get<Shift[]>(`${this.shiftsUrl}?_sort=start&_order=asc`);
  }

  updateShift(shiftId: string, shiftData: Shift): Observable<Shift> {
    return this.http.patch<Shift>(`${this.shiftsUrl}/${shiftId}`, shiftData);
  }
}