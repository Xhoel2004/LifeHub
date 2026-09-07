import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HabitRequest, HabitResponse, HeatmapDayResponse } from '../../shared/models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/habits`;

  list(): Observable<HabitResponse[]> {
    return this.http.get<HabitResponse[]>(this.baseUrl);
  }

  create(request: HabitRequest): Observable<HabitResponse> {
    return this.http.post<HabitResponse>(this.baseUrl, request);
  }

  update(id: number, request: HabitRequest): Observable<HabitResponse> {
    return this.http.put<HabitResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  logCompletion(id: number, date: string): Observable<HabitResponse> {
    return this.http.put<HabitResponse>(`${this.baseUrl}/${id}/log/${date}`, {});
  }

  unlogCompletion(id: number, date: string): Observable<HabitResponse> {
    return this.http.delete<HabitResponse>(`${this.baseUrl}/${id}/log/${date}`);
  }

  getHeatmap(weeks = 12): Observable<HeatmapDayResponse[]> {
    return this.http.get<HeatmapDayResponse[]>(`${this.baseUrl}/heatmap`, { params: { weeks } });
  }
}
