import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IngestionProgressResponse } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class IngestionProgressWebSocketService {

  connect(jobId: string): Observable<IngestionProgressResponse> {
    return new Observable<IngestionProgressResponse>((observer) => {
      const socket = new WebSocket(this.buildUrl(jobId));
      let intentionallyClosed = false;

      socket.onmessage = (event) => {
        try {
          observer.next(JSON.parse(event.data) as IngestionProgressResponse);
        } catch (error) {
          observer.error(error);
        }
      };

      socket.onerror = () => {
        if (!intentionallyClosed) {
          observer.error(new Error('WebSocket connection failed.'));
        }
      };

      socket.onclose = () => {
        if (!intentionallyClosed) {
          observer.complete();
        }
      };

      return () => {
        intentionallyClosed = true;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'Client disconnected');
        }
      };
    });
  }

  private buildUrl(jobId: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/ingestion?jobId=${encodeURIComponent(jobId)}`;
  }
}
