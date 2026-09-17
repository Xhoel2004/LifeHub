import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionRequest, SubscriptionResponse } from '../../shared/models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subscriptions`;

  list(): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(this.baseUrl);
  }

  create(request: SubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(this.baseUrl, request);
  }

  update(id: number, request: SubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.put<SubscriptionResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  pause(id: number): Observable<SubscriptionResponse> {
    return this.http.patch<SubscriptionResponse>(`${this.baseUrl}/${id}/pause`, {});
  }

  resume(id: number): Observable<SubscriptionResponse> {
    return this.http.patch<SubscriptionResponse>(`${this.baseUrl}/${id}/resume`, {});
  }

  cancel(id: number): Observable<SubscriptionResponse> {
    return this.http.patch<SubscriptionResponse>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
