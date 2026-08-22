import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import {
  DashboardActivityItem,
  DashboardPeriod,
  DashboardStats
} from '../../../models/dashboard.model';

interface PeriodOption {
  label: string;
  value: DashboardPeriod;
}

interface MetricCard {
  label: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down' | 'flat' | 'sync' | 'file';
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'app-report-query',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonModule,
    ChartModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule
  ],
  templateUrl: './report-query.component.html',
  styleUrl: './report-query.component.css'
})
export class ReportQueryComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  lastUpdated = '—';
  loading = true;
  error: string | null = null;
  readonly initials = () => this.auth.initials();

  readonly periodOptions: PeriodOption[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' }
  ];

  selectedPeriod: DashboardPeriod = '30d';
  chartsReady = false;
  chartYear = new Date().getFullYear();

  uploadsChartData: { labels: string[]; datasets: object[] } | null = null;
  uploadsChartOptions: object | null = null;

  typesChartData: { labels: string[]; datasets: object[] } | null = null;
  typesChartOptions: object | null = null;

  reportsSharePct = 0;
  reportsCount = 0;
  regulationsCount = 0;

  metrics: MetricCard[] = [];
  activities: DashboardActivityItem[] = [];

  ngOnInit(): void {
    this.loadStats();
  }

  onPeriodChange(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading = true;
    this.error = null;
    this.dashboardService.getStats(this.selectedPeriod).subscribe({
      next: (stats) => {
        this.applyStats(stats);
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard stats error', err);
        this.error = 'Impossible de charger les statistiques.';
        this.loading = false;
      }
    });
  }

  private applyStats(stats: DashboardStats): void {
    this.lastUpdated = stats.lastUpdated;
    this.reportsCount = stats.reportsCount;
    this.regulationsCount = stats.regulationsCount;
    const totalTypes = stats.reportsCount + stats.regulationsCount;
    this.reportsSharePct = totalTypes > 0
      ? Math.round((stats.reportsCount * 100) / totalTypes)
      : 0;

    this.metrics = [
      {
        label: 'Total Documents',
        value: this.formatNumber(stats.totalDocuments),
        trend: this.formatTrend(stats.totalDocumentsTrendPct),
        trendType: this.trendType(stats.totalDocumentsTrendPct),
        icon: 'pi pi-file',
        iconClass: 'metric-icon-blue'
      },
      {
        label: 'Reports',
        value: this.formatNumber(stats.reportsCount),
        trend: this.formatTrend(stats.reportsTrendPct),
        trendType: this.trendType(stats.reportsTrendPct),
        icon: 'pi pi-chart-bar',
        iconClass: 'metric-icon-navy'
      },
      {
        label: 'Regulations',
        value: this.formatNumber(stats.regulationsCount),
        trend: this.formatTrend(stats.regulationsTrendPct),
        trendType: this.trendType(stats.regulationsTrendPct),
        icon: 'pi pi-book',
        iconClass: 'metric-icon-teal'
      },
      {
        label: 'Total Chunks',
        value: this.formatNumber(stats.totalChunks),
        trend: this.formatTrend(stats.chunksTrendPct),
        trendType: this.trendType(stats.chunksTrendPct),
        icon: 'pi pi-th-large',
        iconClass: 'metric-icon-purple'
      },
      {
        label: 'Embeddings Generated',
        value: this.formatNumber(stats.embeddingsCount),
        trend: stats.embeddingsSynced ? '● All synced' : '● Sync pending',
        trendType: 'sync',
        icon: 'pi pi-database',
        iconClass: 'metric-icon-green'
      },
      {
        label: 'Last Ingestion',
        value: stats.lastIngestion
          ? this.formatRelativeTime(stats.lastIngestion.uploadedAt)
          : '—',
        trend: stats.lastIngestion?.filename ?? 'No ingestion yet',
        trendType: 'file',
        icon: 'pi pi-upload',
        iconClass: 'metric-icon-orange'
      }
    ];

    this.activities = stats.recentActivity.map((item) => ({
      ...item,
      uploadedAt: this.formatRelativeTime(item.uploadedAt)
    }));

    if (isPlatformBrowser(this.platformId)) {
      this.initCharts(stats);
      this.chartsReady = true;
    }
  }

  private initCharts(stats: DashboardStats): void {
    const months = stats.uploadsByMonth ?? [];
    const reportData = months.map((m) => m.reports);
    const regulationData = months.map((m) => m.regulations);
    const maxValue = Math.max(1, ...reportData, ...regulationData);
    const yMax = Math.ceil(maxValue / 5) * 5 || 5;

    if (months.length > 0) {
      this.chartYear = months[months.length - 1].year;
    }

    this.uploadsChartData = {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: 'Reports',
          backgroundColor: '#3d8dff',
          borderRadius: 4,
          barThickness: 18,
          data: reportData
        },
        {
          label: 'Regulations',
          backgroundColor: '#1dd7c0',
          borderRadius: 4,
          barThickness: 18,
          data: regulationData
        }
      ]
    };

    this.uploadsChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 20,
            color: '#6b7488',
            font: { size: 12 }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8a94a6', font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: {
            stepSize: Math.max(1, Math.ceil(yMax / 3)),
            color: '#8a94a6',
            font: { size: 11 },
            precision: 0
          },
          grid: { color: 'rgba(160,190,255,0.14)' }
        }
      }
    };

    this.typesChartData = {
      labels: ['Reports', 'Regulations'],
      datasets: [
        {
          data: [
            Math.max(stats.reportsCount, 0),
            Math.max(stats.regulationsCount, 0)
          ],
          backgroundColor: ['#3d8dff', '#6eb6ff'],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };

    this.typesChartOptions = {
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    };
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value ?? 0);
  }

  private formatTrend(pct: number | null): string {
    if (pct == null) {
      return '— vs previous period';
    }
    const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
    return `${arrow} ${Math.abs(pct)}% vs previous period`;
  }

  private trendType(pct: number | null): 'up' | 'down' | 'flat' {
    if (pct == null || pct === 0) {
      return 'flat';
    }
    return pct > 0 ? 'up' : 'down';
  }

  private formatRelativeTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    if (sameDay) {
      return `Today ${time}`;
    }
    if (isYesterday) {
      return `Yesterday ${time}`;
    }
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
