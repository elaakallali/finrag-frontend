import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conversation, ConversationMessage } from '../../models/conversation.model';
import { IngestionResponse, RagQueryResponse, ReportSource } from '../../models/chat.model';

/** Evenement SSE envoye par le backend (ChatStreamEvent Java). */
export interface ChatStreamEvent {
  type: 'token' | 'sources' | 'done' | 'error';
  text: string | null;
  sources: ReportSource[] | null;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/conversations`;

  create(title?: string): Observable<Conversation> {
    let params = new HttpParams();
    if (title?.trim()) {
      params = params.set('title', title.trim());
    }
    return this.http.post<Conversation>(this.baseUrl, null, { params });
  }

  list(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.baseUrl);
  }

  getMessages(conversationId: string): Observable<ConversationMessage[]> {
    return this.http.get<ConversationMessage[]>(`${this.baseUrl}/${conversationId}/messages`);
  }

  /** Ancien endpoint JSON (garde pour tests). */
  ask(conversationId: string, question: string): Observable<RagQueryResponse> {
    const params = new HttpParams().set('question', question);
    return this.http.post<RagQueryResponse>(`${this.baseUrl}/${conversationId}/ask`, null, { params });
  }

  /**
   * Chat SSE : recoit token -> sources -> done (ou error).
   * fetch + ReadableStream car POST SSE n'est pas gere proprement par HttpClient/EventSource.
   */
  askStream(conversationId: string, question: string): Observable<ChatStreamEvent> {
    return new Observable<ChatStreamEvent>((subscriber) => {
      const url =
        `${this.baseUrl}/${conversationId}/ask/stream` +
        `?question=${encodeURIComponent(question)}`;

      const controller = new AbortController();

      fetch(url, {
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            subscriber.error(new Error(`SSE HTTP ${response.status}`));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() ?? '';

            for (const chunk of chunks) {
              const dataLine = chunk
                .split('\n')
                .find((line) => line.startsWith('data:'));

              if (!dataLine) {
                continue;
              }

              const json = dataLine.replace(/^data:\s*/, '').trim();
              if (!json) {
                continue;
              }

              try {
                const event = JSON.parse(json) as ChatStreamEvent;
                subscriber.next(event);

                if (event.type === 'done' || event.type === 'error') {
                  subscriber.complete();
                  return;
                }
              } catch {
                // ignore fragment JSON incomplet
              }
            }
          }

          subscriber.complete();
        })
        .catch((error: { name?: string }) => {
          if (error?.name !== 'AbortError') {
            subscriber.error(error);
          }
        });

      return () => controller.abort();
    });
  }

  upload(conversationId: string, file: File): Observable<IngestionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', 'TABLE_AWARE');
    return this.http.post<IngestionResponse>(`${this.baseUrl}/${conversationId}/upload`, formData);
  }
}
