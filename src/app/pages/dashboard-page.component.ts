import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Administration</p>
        <h1>Manage regulation ingestion</h1>
        <p class="lead">
          Upload regulatory documents, launch ingestion, and review the result of each indexing run.
        </p>
      </div>

      <div class="hero-card">
        <div class="stat">
          <span class="stat-label">Action</span>
          <strong>Upload a regulation document</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Result</span>
          <strong>See when ingestion finishes</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Follow-up</span>
          <strong>Check chunk count and history</strong>
        </div>
      </div>
    </section>

    <section class="action-grid single-action">
      <a class="action-card" routerLink="/regulation-ingestion">
        <span class="card-kicker">01</span>
        <h2>Regulation Ingestion</h2>
        <p>Upload a regulatory reference document and add it to the regulation knowledge base.</p>
      </a>
    </section>
  `,
  styles: [`
    :host {
      display: grid;
      gap: 2rem;
    }

    .hero {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
      align-items: stretch;
    }

    .hero-copy,
    .hero-card,
    .action-card {
      border: 1px solid rgba(12, 52, 61, 0.12);
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(14px);
      border-radius: 1.5rem;
      box-shadow: 0 22px 50px rgba(25, 63, 72, 0.08);
    }

    .hero-copy {
      padding: 2rem;
    }

    .hero-card {
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
      align-content: start;
    }

    .eyebrow,
    .card-kicker,
    .stat-label {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.72rem;
      color: #5b7b82;
    }

    h1 {
      margin: 0.6rem 0 1rem;
      font-size: clamp(2rem, 5vw, 3.75rem);
      line-height: 1.02;
      color: #0c343d;
    }

    .lead {
      margin: 0;
      font-size: 1.05rem;
      line-height: 1.7;
      color: #345960;
      max-width: 55ch;
    }

    .stat {
      display: grid;
      gap: 0.2rem;
      padding: 0.9rem 0 0.9rem;
      border-bottom: 1px solid rgba(12, 52, 61, 0.08);
    }

    .stat:last-child {
      border-bottom: 0;
    }

    .stat strong {
      font-size: 1.05rem;
      color: #173f49;
    }

    .action-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .action-grid.single-action {
      grid-template-columns: minmax(0, 1fr);
      max-width: 34rem;
    }

    .action-card {
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }

    .action-card:hover {
      transform: translateY(-2px);
      border-color: rgba(15, 100, 98, 0.28);
      box-shadow: 0 28px 60px rgba(20, 84, 87, 0.12);
    }

    h2 {
      margin: 0.7rem 0 0.5rem;
      color: #12373e;
      font-size: 1.25rem;
    }

    .action-card p {
      margin: 0;
      color: #4a6870;
      line-height: 1.65;
    }

    @media (max-width: 980px) {
      .hero,
      .action-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPageComponent {}
