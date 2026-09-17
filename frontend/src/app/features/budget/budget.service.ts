import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetEntryRequest,
  BudgetEntryResponse,
  BudgetSummaryResponse,
  MonthlyOverviewResponse,
} from '../../shared/models/budget-entry.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/budget`;

  list(month: string): Observable<BudgetEntryResponse[]> {
    return this.http.get<BudgetEntryResponse[]>(this.baseUrl, { params: { month } });
  }

  summary(month: string): Observable<BudgetSummaryResponse> {
    return this.http.get<BudgetSummaryResponse>(`${this.baseUrl}/summary`, { params: { month } });
  }

  create(request: BudgetEntryRequest): Observable<BudgetEntryResponse> {
    return this.http.post<BudgetEntryResponse>(this.baseUrl, request);
  }

  update(id: number, request: BudgetEntryRequest): Observable<BudgetEntryResponse> {
    return this.http.put<BudgetEntryResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  overview(months = 6): Observable<MonthlyOverviewResponse[]> {
    return this.http.get<MonthlyOverviewResponse[]>(`${this.baseUrl}/overview`, { params: { months } });
  }
}
