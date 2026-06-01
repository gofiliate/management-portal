import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportTokenService, ReportTokenDetails } from '../../../services/report-token.service';
import { ComparisonReportService, Event, InstanceReportResult } from '../../../services/comparison-report.service';
import { DateRangeFilterComponent, DateRange } from './date-range-filter/date-range-filter.component';
import { InstanceSelectorComponent, Instance } from './instance-selector/instance-selector.component';
import { EventSelectorComponent } from './event-selector/event-selector.component';
import { ComparisonTableComponent } from './comparison-table/comparison-table.component';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-comparison-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DateRangeFilterComponent,
    InstanceSelectorComponent,
    EventSelectorComponent,
    ComparisonTableComponent
  ],
  templateUrl: './comparison-report.component.html',
  styleUrl: './comparison-report.component.scss'
})
export class ComparisonReportComponent implements OnInit {
  // Token management
  tokensReady: boolean = false;
  availableInstances: Instance[] = [];
  tokenMap: Map<number, ReportTokenDetails> = new Map();

  // Filter state
  selectedInstances: number[] = [];
  dateRange: DateRange = { startDate: '', endDate: '' };
  selectedEvents: number[] = [];
  dateGrouping: number = 3; // Default to Monthly (1=Day, 2=Week, 3=Month)

  // Event data
  eventsByInstance: Map<number, Event[]> = new Map();
  loadingEvents: boolean = false;

  // Report data
  isLoadingReport: boolean = false;
  reportResults: InstanceReportResult[] | null = null;

  // Validation
  canRunComparison: boolean = false;

  dateGroupingOptions = [
    { value: 1, label: 'Daily' },
    { value: 2, label: 'Weekly' },
    { value: 3, label: 'Monthly' }
  ];

  constructor(
    private reportTokenService: ReportTokenService,
    private comparisonService: ComparisonReportService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Fetch both report tokens and instance names in parallel
    forkJoin({
      tokens: this.reportTokenService.fetchTokens(),
      instanceNames: this.reportTokenService.fetchInstanceNames()
    }).subscribe({
      next: ({ tokens: response, instanceNames }) => {
        console.log('[ComparisonReport] Report tokens and instance names fetched successfully');
        
        // Cache tokens
        const tokens = this.reportTokenService.getAllTokens();
        this.tokenMap = tokens;
        
        // Build list of available instances with real names
        this.availableInstances = Array.from(tokens.values()).map(token => ({
          id: token.instance_id,
          name: instanceNames.get(token.instance_id) || `Instance ${token.instance_id}`
        }));
        
        console.log(`[ComparisonReport] ${this.availableInstances.length} instances available:`, this.availableInstances);
        
        this.tokensReady = true;
      },
      error: (error) => {
        console.error('[ComparisonReport] Failed to fetch report tokens or instance names:', error);
        this.tokensReady = false;
        this.toastr.error('Failed to load instance access data', 'Error');
      }
    });
  }

  onInstancesChange(instanceIds: number[]) {
    this.selectedInstances = instanceIds;
    this.validateFilters();
    
    // Load events for selected instances
    if (instanceIds.length > 0) {
      this.loadEventsForInstances();
    } else {
      this.eventsByInstance = new Map(); // Create new empty Map
      this.selectedEvents = [];
    }
  }

  onDateRangeChange(dateRange: DateRange) {
    this.dateRange = dateRange;
    this.validateFilters();
  }

  onEventsChange(eventIds: number[]) {
    this.selectedEvents = eventIds;
    this.validateFilters();
  }

  onDateGroupingChange() {
    this.validateFilters();
  }

  private validateFilters() {
    this.canRunComparison = 
      this.selectedInstances.length >= 2 &&
      this.selectedEvents.length >= 1 &&
      this.dateRange.startDate !== '' &&
      this.dateRange.endDate !== '';
  }

  private loadEventsForInstances() {
    this.loadingEvents = true;
    console.log('[ComparisonReport] Loading events for instances:', this.selectedInstances);

    this.comparisonService.fetchEventsForInstances(this.selectedInstances, this.tokenMap).subscribe({
      next: (results) => {
        // Build a NEW eventsByInstance map (not clear/reuse) to trigger ngOnChanges
        const newEventsByInstance = new Map<number, Event[]>();
        
        let totalEvents = 0;
        let failedInstances: number[] = [];

        results.forEach(result => {
          if (result.error) {
            console.error(`[ComparisonReport] Failed to fetch events for instance ${result.instance_id}:`, result.error);
            failedInstances.push(result.instance_id);
          } else {
            newEventsByInstance.set(result.instance_id, result.events);
            totalEvents += result.events.length;
          }
        });

        // Assign new Map reference to trigger ngOnChanges in child components
        this.eventsByInstance = newEventsByInstance;
        this.loadingEvents = false;

        // Show results
        if (failedInstances.length > 0) {
          this.toastr.warning(
            `Failed to load events from ${failedInstances.length} instance(s)`,
            'Partial Success'
          );
        }

        if (this.eventsByInstance.size > 0) {
          console.log(`[ComparisonReport] Loaded ${totalEvents} total events from ${this.eventsByInstance.size} instances`);
        } else {
          this.toastr.error('No events loaded from any instance', 'Error');
        }
      },
      error: (error) => {
        console.error('[ComparisonReport] Error loading events:', error);
        this.loadingEvents = false;
        this.eventsByInstance = new Map(); // Create new empty Map
        this.toastr.error('Failed to load events from instances', 'Error');
      }
    });
  }

  runComparison() {
    if (!this.canRunComparison) {
      this.toastr.warning('Please select at least 2 instances, a date range, and events', 'Invalid Filters');
      return;
    }

    this.isLoadingReport = true;
    this.reportResults = null;
    
    console.log('[ComparisonReport] Running comparison with filters:', {
      instances: this.selectedInstances,
      dateRange: this.dateRange,
      events: this.selectedEvents,
      grouping: this.dateGrouping
    });

    // Build comparison parameters
    const comparisonParams = {
      instanceIds: this.selectedInstances,
      startDate: this.dateRange.startDate,
      endDate: this.dateRange.endDate,
      eventIds: this.selectedEvents,
      dateGroupId: this.dateGrouping,
      tokens: this.tokenMap
    };

    // Fetch comparison data from all instances
    this.comparisonService.fetchComparisonData(comparisonParams).subscribe({
      next: (results) => {
        console.log('[ComparisonReport] Comparison data fetched:', results);
        
        // Check for errors
        const failedInstances = results.filter(r => r.error !== null);
        const successfulInstances = results.filter(r => r.error === null);
        
        if (failedInstances.length > 0) {
          console.error('[ComparisonReport] Failed instances:', failedInstances);
          this.toastr.warning(
            `Failed to load data from ${failedInstances.length} instance(s)`,
            'Partial Success'
          );
        }
        
        if (successfulInstances.length === 0) {
          this.toastr.error('Failed to load data from all instances', 'Error');
          this.isLoadingReport = false;
          return;
        }
        
        // Store results
        this.reportResults = results;
        this.isLoadingReport = false;
        
        this.toastr.success(
          `Loaded comparison data from ${successfulInstances.length} instance(s)`,
          'Success'
        );
      },
      error: (error) => {
        console.error('[ComparisonReport] Error fetching comparison data:', error);
        this.isLoadingReport = false;
        this.toastr.error('Failed to fetch comparison data', 'Error');
      }
    });
  }

  resetFilters() {
    this.selectedInstances = [];
    this.dateRange = { startDate: '', endDate: '' };
    this.selectedEvents = [];
    this.dateGrouping = 3;
    this.reportResults = null;
    this.canRunComparison = false;
    this.toastr.info('Filters reset', 'Reset');
  }

  get instanceNamesMap(): Map<number, string> {
    const map = new Map<number, string>();
    this.availableInstances.forEach(instance => {
      map.set(instance.id, instance.name);
    });
    return map;
  }
}
