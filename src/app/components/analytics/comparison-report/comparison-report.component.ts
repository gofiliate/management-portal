import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportTokenService } from '../../../services/report-token.service';

@Component({
  selector: 'app-comparison-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-report.component.html',
  styleUrl: './comparison-report.component.scss'
})
export class ComparisonReportComponent implements OnInit {
  tokensReady: boolean = false;
  availableInstances: Array<{id: number, name: string}> = [];

  constructor(private reportTokenService: ReportTokenService) {}

  ngOnInit() {
    // Fetch report tokens on component initialization
    this.reportTokenService.fetchTokens().subscribe({
      next: (response) => {
        console.log('[ComparisonReport] Report tokens fetched successfully');
        
        // Build list of available instances from tokens
        const tokens = this.reportTokenService.getAllTokens();
        this.availableInstances = Array.from(tokens.values()).map(token => ({
          id: token.instance_id,
          name: `Instance ${token.instance_id}` // TODO: Get actual instance names from API
        }));
        
        this.tokensReady = true;
      },
      error: (error) => {
        console.error('[ComparisonReport] Failed to fetch report tokens:', error);
        this.tokensReady = false;
      }
    });
  }
}
