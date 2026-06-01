import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { ReportTokenDetails } from './report-token.service';

export interface Event {
  event_id: number;
  description: string;
  instance_id?: number;
}

export interface InstanceEventsResult {
  instance_id: number;
  events: Event[];
  error?: string;
}

export interface ComparisonParams {
  instanceIds: number[];
  startDate: string;
  endDate: string;
  dateGroupId: number;
  eventIds: number[];
  tokens: Map<number, ReportTokenDetails>;
}

export interface InstanceReportResult {
  instance_id: number;
  data: any[];
  error?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonReportService {

  constructor(private http: HttpClient) {}

  /**
   * Fetch events from multiple instances in parallel
   * @param instanceIds Array of instance IDs to fetch events from
   * @param tokens Map of instance tokens from ReportTokenService
   * @returns Observable of event results per instance
   */
  fetchEventsForInstances(
    instanceIds: number[],
    tokens: Map<number, ReportTokenDetails>
  ): Observable<InstanceEventsResult[]> {
    
    const requests: Observable<InstanceEventsResult>[] = instanceIds.map(instanceId => {
      const tokenDetail = tokens.get(instanceId);
      
      if (!tokenDetail || !tokenDetail.token || !tokenDetail.api_endpoint) {
        return of({
          instance_id: instanceId,
          events: [],
          error: 'No authentication token or API endpoint available'
        });
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': tokenDetail.token
      });

      // Call the instance API endpoint
      const url = `${tokenDetail.api_endpoint}/admin/settings/events`;

      return this.http.get<Event[]>(url, { headers }).pipe(
        timeout(10000), // 10 second timeout per instance
        map(events => ({
          instance_id: instanceId,
          events: events.map(e => ({ ...e, instance_id: instanceId })),
          error: undefined
        })),
        catchError(error => {
          console.error(`[ComparisonReportService] Error fetching events from instance ${instanceId}:`, error);
          return of({
            instance_id: instanceId,
            events: [],
            error: error.message || 'Failed to fetch events'
          });
        })
      );
    });

    // Execute all requests in parallel
    return forkJoin(requests);
  }

  /**
   * Fetch comparison report data from multiple instances in parallel
   * @param params Comparison parameters including instances, dates, events, and tokens
   * @returns Observable of report results per instance
   */
  fetchComparisonData(params: ComparisonParams): Observable<InstanceReportResult[]> {
    
    const requests: Observable<InstanceReportResult>[] = params.instanceIds.map(instanceId => {
      const tokenDetail = params.tokens.get(instanceId);
      
      if (!tokenDetail || !tokenDetail.token) {
        return of({
          instance_id: instanceId,
          data: [],
          error: 'No authentication token available'
        });
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': tokenDetail.token
      });

      // Build the payload matching admin-angular breakdown report structure
      const payload = {
        date_group_id: params.dateGroupId,
        user_group_id: 1, // All Affiliates
        commission_group_id: 1, // All Commissions
        campaign_group_id: 1, // All Campaigns
        depth_group_id: 1, // Affiliate Level
        country_group_id: 1, // All Countries
        user_id: '#',
        commission_id: '#',
        campaign_id: '#',
        country_id: '#',
        start_date: params.startDate,
        end_date: params.endDate,
        events: params.eventIds,
        order: '#',
        limit: '#'
      };

      const endpoint = `${tokenDetail.api_endpoint}/admin/reports/breakdown`;
      
      return this.http.post<any>(endpoint, payload, { headers }).pipe(
        map(response => {
          // Handle response wrapper if present
          const data = Array.isArray(response) ? response : (response.data ? response.data : []);
          
          return {
            instance_id: instanceId,
            data: data,
            error: null
          };
        }),
        catchError(error => {
          console.error(`[ComparisonReportService] Failed to fetch data from instance ${instanceId}:`, error);
          return of({
            instance_id: instanceId,
            data: [],
            error: error.message || 'Failed to fetch report data'
          });
        })
      );
    });

    return forkJoin(requests).pipe(
      timeout(30000), // 30 second timeout
      catchError(error => {
        console.error('[ComparisonReportService] Error fetching comparison data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate common events across all instances
   * @param eventsByInstance Map of events per instance
   * @returns Array of common event IDs
   */
  getCommonEvents(eventsByInstance: Map<number, Event[]>): number[] {
    if (eventsByInstance.size === 0) return [];
    
    const allEventSets = Array.from(eventsByInstance.values()).map(events => 
      new Set(events.map(e => e.event_id))
    );
    
    if (allEventSets.length === 0) return [];
    
    // Find intersection of all sets
    const commonEventIds = Array.from(allEventSets[0]).filter(eventId =>
      allEventSets.every(set => set.has(eventId))
    );
    
    return commonEventIds;
  }

  /**
   * Get events that are specific to certain instances (not common to all)
   * @param eventsByInstance Map of events per instance
   * @returns Array of events with instance_id marked
   */
  getInstanceSpecificEvents(eventsByInstance: Map<number, Event[]>): Event[] {
    const commonEventIds = new Set(this.getCommonEvents(eventsByInstance));
    const specificEvents: Event[] = [];
    
    eventsByInstance.forEach((events, instanceId) => {
      events.forEach(event => {
        if (!commonEventIds.has(event.event_id)) {
          // Check if we already have this event_id from another instance
          const existing = specificEvents.find(e => e.event_id === event.event_id);
          if (existing) {
            // Mark as available on multiple instances
            if (!existing.instance_id) {
              existing.instance_id = -1; // Special marker for "multiple but not all"
            }
          } else {
            specificEvents.push({
              ...event,
              instance_id: instanceId
            });
          }
        }
      });
    });
    
    return specificEvents;
  }
}
