import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegulationHistoryRefreshService {
  private readonly refreshSubject = new Subject<void>();

  readonly refresh$ = this.refreshSubject.asObservable();

  notify(): void {
    this.refreshSubject.next();
  }
}
