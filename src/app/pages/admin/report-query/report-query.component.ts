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

interface PeriodOption {
  label: string;
  value: string;
}

interface ActivityItem {
  title: string;
  status: string;
  time: string;
  tone: 'success' | 'primary' | 'teal';
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

  readonly lastUpdated = '26 June 2026 — 09:14 AM';

  readonly periodOptions: PeriodOption[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' }
  ];

  selectedPeriod = '30d';
  chartsReady = false;

  uploadsChartData: { labels: string[]; datasets: object[] } | null = null;
  uploadsChartOptions: object | null = null;

  typesChartData: { labels: string[]; datasets: object[] } | null = null;
  typesChartOptions: object | null = null;

  readonly metrics = [
    {
      label: 'Total Documents',
      value: '1,248',
      trend: '↑ 12% vs last month',
      trendType: 'up',
      icon: 'pi pi-file',
      iconClass: 'metric-icon-blue'
    },
    {
      label: 'Reports',
      value: '784',
      trend: '↑ 8% vs last month',
      trendType: 'up',
      icon: 'pi pi-chart-bar',
      iconClass: 'metric-icon-navy'
    },
    {
      label: 'Regulations',
      value: '464',
      trend: '↑ 5% vs last month',
      trendType: 'up',
      icon: 'pi pi-book',
      iconClass: 'metric-icon-teal'
    },
    {
      label: 'Total Chunks',
      value: '42,810',
      trend: '↑ 13% vs last month',
      trendType: 'up',
      icon: 'pi pi-th-large',
      iconClass: 'metric-icon-purple'
    },
    {
      label: 'Embeddings Generated',
      value: '42,810',
      trend: '● All synced',
      trendType: 'sync',
      icon: 'pi pi-database',
      iconClass: 'metric-icon-green'
    },
    {
      label: 'Last Ingestion',
      value: 'Today 09:02',
      trend: 'BDF_Rapport_Q2_2026.pdf',
      trendType: 'file',
      icon: 'pi pi-upload',
      iconClass: 'metric-icon-orange'
    }
  ];

  readonly activities: ActivityItem[] = [
    {
      title: 'BDF_Rapport_Q2',
      status: 'completed',
      time: 'Today 09:02',
      tone: 'success'
    },
    {
      title: 'AMF_Annual_2025',
      status: 'parsing',
      time: 'Today 08:40',
      tone: 'primary'
    },
    {
      title: 'ESMA_Regulation',
      status: 'indexed',
      time: 'yesterday 16:30',
      tone: 'teal'
    }
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCharts();
      this.chartsReady = true;
    }
  }

  private initCharts(): void {
    this.uploadsChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Reports',
          backgroundColor: '#243f95',
          borderRadius: 4,
          barThickness: 18,
          data: [32, 38, 42, 48, 52, 60]
        },
        {
          label: 'Regulations',
          backgroundColor: '#1dd7c0',
          borderRadius: 4,
          barThickness: 18,
          data: [18, 22, 24, 28, 30, 35]
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
          max: 60,
          ticks: {
            stepSize: 20,
            color: '#8a94a6',
            font: { size: 11 }
          },
          grid: { color: '#eef1f6' }
        }
      }
    };

    this.typesChartData = {
      labels: ['Reports', 'Regulations'],
      datasets: [
        {
          data: [784, 464],
          backgroundColor: ['#243f95', '#1dd7c0'],
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
}
