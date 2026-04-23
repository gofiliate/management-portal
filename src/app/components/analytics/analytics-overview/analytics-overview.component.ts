import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportTokenService } from '../../../services/report-token.service';

@Component({
  selector: 'app-analytics-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-overview.component.html',
  styleUrl: './analytics-overview.component.scss'
})
export class AnalyticsOverviewComponent implements OnInit {
  tokensReady: boolean = false;
  availableInstances: Array<{id: number, name: string}> = [];

  constructor(private reportTokenService: ReportTokenService) {}

  ngOnInit() {
    // Fetch report tokens on component initialization
    this.reportTokenService.fetchTokens().subscribe({
      next: (response) => {
        console.log('[AnalyticsOverview] Report tokens fetched successfully');
        
        // Build list of available instances from tokens
        const tokens = this.reportTokenService.getAllTokens();
        this.availableInstances = Array.from(tokens.values()).map(token => ({
          id: token.instance_id,
          name: `Instance ${token.instance_id}` // TODO: Get actual instance names from API
        }));
        
        this.tokensReady = true;
      },
      error: (error) => {
        console.error('[AnalyticsOverview] Failed to fetch report tokens:', error);
        this.tokensReady = false;
      }
    });
  }
}
