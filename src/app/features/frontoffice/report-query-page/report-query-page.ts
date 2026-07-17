import { Component } from '@angular/core';

import { AskPanel } from '../components/ask-panel/ask-panel';
import { UploadReportPanel } from '../components/upload-report-panel/upload-report-panel';

@Component({
  selector: 'app-report-query-page',
  imports: [UploadReportPanel, AskPanel],
  templateUrl: './report-query-page.html',
  styleUrl: './report-query-page.scss'
})
export class ReportQueryPage {}
