import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JournalEntryRequest, JournalEntryResponse } from '../../shared/models/journal-entry.model';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/journal`;

  list(): Observable<JournalEntryResponse[]> {
    return this.http.get<JournalEntryResponse[]>(this.baseUrl);
  }

  get(id: number): Observable<JournalEntryResponse> {
    return this.http.get<JournalEntryResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: JournalEntryRequest): Observable<JournalEntryResponse> {
    return this.http.post<JournalEntryResponse>(this.baseUrl, request);
  }

  update(id: number, request: JournalEntryRequest): Observable<JournalEntryResponse> {
    return this.http.put<JournalEntryResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
