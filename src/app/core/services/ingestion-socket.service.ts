import { Injectable, NgZone, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { IngestionProgress } from '../../models/document.model';

/**
 * Suit une ingestion via STOMP/WebSocket (/topic/ingestion/{id}).
 * Le backend envoie un snapshot a l'abonnement, puis les updates suivantes.
 */
@Injectable({ providedIn: 'root' })
export class IngestionSocketService {
  private readonly zone = inject(NgZone);

  /**
   * S'abonne au topic d'une ingestion et emet chaque progress recu.
   * Se desabonne automatiquement a la completion INDEXED/FAILED ou au unsubscribe RxJS.
   */
  watch(ingestionId: string): Observable<IngestionProgress> {
    return new Observable<IngestionProgress>((subscriber) => {
      let stompSubscription: StompSubscription | null = null;

      const client = new Client({
        brokerURL: this.resolveBrokerUrl(),
        reconnectDelay: 3000,
        onConnect: () => {
          stompSubscription = client.subscribe(
            `/topic/ingestion/${ingestionId}`,
            (message: IMessage) => {
              try {
                const progress = JSON.parse(message.body) as IngestionProgress;
                // STOMP tourne hors NgZone : forcer la maj UI
                this.zone.run(() => {
                  subscriber.next(progress);
                  if (progress.status === 'INDEXED' || progress.status === 'FAILED') {
                    subscriber.complete();
                  }
                });
              } catch (error) {
                this.zone.run(() => subscriber.error(error));
              }
            }
          );
        },
        onStompError: (frame) => {
          this.zone.run(() =>
            subscriber.error(new Error(frame.headers['message'] ?? 'Erreur STOMP'))
          );
        },
        onWebSocketError: () => {
          this.zone.run(() =>
            subscriber.error(new Error('Impossible de se connecter au WebSocket d\'ingestion.'))
          );
        }
      });

      client.activate();

      return () => {
        try {
          stompSubscription?.unsubscribe();
        } catch {
          // ignore
        }
        void client.deactivate();
      };
    });
  }

  /** ws(s)://host/ws — passe par le proxy Angular en dev. */
  private resolveBrokerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
}
