import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getStats(period = '30d'): Observable<DashboardStats> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`, { params });
  }
}
