import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../../../services/comparison-report.service';

interface EventGroup {
  title: string;
  events: Event[];
  type: 'common' | 'specific';
}

@Component({
  selector: 'app-event-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-selector.component.html',
  styleUrl: './event-selector.component.scss'
})
export class EventSelectorComponent implements OnChanges {
  @Input() eventsByInstance: Map<number, Event[]> = new Map();
  @Input() selectedInstances: number[] = [];
  @Output() selectedEventsChange = new EventEmitter<number[]>();

  selectedEvents: number[] = [];
  eventGroups: EventGroup[] = [];
  validationError: string = '';
  selectAllCommon: boolean = true;
  selectAllSpecific: boolean = false;
  private hasAutoSelected: boolean = false;
  private readonly STORAGE_KEY = 'comparison_report_selected_events';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['eventsByInstance'] || changes['selectedInstances']) {
      // Load from localStorage on first load
      if (!this.hasAutoSelected) {
        this.loadSelectionFromStorage();
      }
      this.updateEventGroups();
    }
  }

  private loadSelectionFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.selectedEvents = JSON.parse(stored);
        console.log('[EventSelector] Loaded selection from localStorage:', this.selectedEvents);
      }
    } catch (error) {
      console.error('[EventSelector] Failed to load from localStorage:', error);
    }
  }

  private saveSelectionToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.selectedEvents));
      console.log('[EventSelector] Saved selection to localStorage:', this.selectedEvents);
    } catch (error) {
      console.error('[EventSelector] Failed to save to localStorage:', error);
    }
  }

  clearStoredSelection() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[EventSelector] Cleared selection from localStorage');
    } catch (error) {
      console.error('[EventSelector] Failed to clear localStorage:', error);
    }
  }

  private updateEventGroups() {
    if (this.eventsByInstance.size === 0) {
      this.eventGroups = [];
      return;
    }

    // Get common events
    const commonEventIds = this.getCommonEvents();
    const allEvents = this.getAllUniqueEvents();

    // Separate into common and instance-specific
    const commonEvents = allEvents.filter(e => commonEventIds.has(e.event_id));
    const specificEvents = allEvents.filter(e => !commonEventIds.has(e.event_id));

    this.eventGroups = [];

    if (commonEvents.length > 0) {
      this.eventGroups.push({
        title: 'Common Events',
        events: commonEvents,
        type: 'common'
      });
    }

    if (specificEvents.length > 0) {
      this.eventGroups.push({
        title: 'Instance-Specific Events',
        events: specificEvents,
        type: 'specific'
      });
    }

    // Auto-select all common events ONLY on first load if no localStorage selection
    if (!this.hasAutoSelected && this.selectedEvents.length === 0 && commonEvents.length > 0) {
      this.selectedEvents = commonEvents.map(e => e.event_id);
      this.hasAutoSelected = true;
      this.saveSelectionToStorage();
      this.validateAndEmit();
    } else {
      // Preserve selections, filtering to valid event IDs
      this.hasAutoSelected = true;
      
      const validEventIds = new Set(allEvents.map(e => e.event_id));
      this.selectedEvents = this.selectedEvents.filter(id => validEventIds.has(id));
      this.updateSelectAllStates();
      this.validateAndEmit();
    }
  }

  private getCommonEvents(): Set<number> {
    if (this.eventsByInstance.size === 0) return new Set();

    const eventSets = Array.from(this.eventsByInstance.values()).map(events =>
      new Set(events.map(e => e.event_id))
    );

    if (eventSets.length === 0) return new Set();

    // Find intersection
    const common = Array.from(eventSets[0]).filter(eventId =>
      eventSets.every(set => set.has(eventId))
    );

    return new Set(common);
  }

  private getAllUniqueEvents(): Event[] {
    const eventMap = new Map<number, Event>();

    this.eventsByInstance.forEach((events, instanceId) => {
      events.forEach(event => {
        if (!eventMap.has(event.event_id)) {
          eventMap.set(event.event_id, { ...event, instance_id: instanceId });
        } else {
          // Event exists on multiple instances, mark it
          const existing = eventMap.get(event.event_id)!;
          if (existing.instance_id !== instanceId) {
            existing.instance_id = -1; // Multiple instances
          }
        }
      });
    });

    return Array.from(eventMap.values()).sort((a, b) => a.event_id - b.event_id);
  }

  toggleEvent(eventId: number) {
    const index = this.selectedEvents.indexOf(eventId);
    if (index > -1) {
      this.selectedEvents.splice(index, 1);
    } else {
      this.selectedEvents.push(eventId);
    }

    this.updateSelectAllStates();
    this.validateAndEmit();
  }

  toggleSelectAllCommon() {
    const commonGroup = this.eventGroups.find(g => g.type === 'common');
    if (!commonGroup) return;

    if (this.selectAllCommon) {
      // Add all common events
      commonGroup.events.forEach(event => {
        if (!this.selectedEvents.includes(event.event_id)) {
          this.selectedEvents.push(event.event_id);
        }
      });
    } else {
      // Remove all common events
      const commonEventIds = new Set(commonGroup.events.map(e => e.event_id));
      this.selectedEvents = this.selectedEvents.filter(id => !commonEventIds.has(id));
    }

    this.validateAndEmit();
  }

  toggleSelectAllSpecific() {
    const specificGroup = this.eventGroups.find(g => g.type === 'specific');
    if (!specificGroup) return;

    if (this.selectAllSpecific) {
      // Add all specific events
      specificGroup.events.forEach(event => {
        if (!this.selectedEvents.includes(event.event_id)) {
          this.selectedEvents.push(event.event_id);
        }
      });
    } else {
      // Remove all specific events
      const specificEventIds = new Set(specificGroup.events.map(e => e.event_id));
      this.selectedEvents = this.selectedEvents.filter(id => !specificEventIds.has(id));
    }

    this.validateAndEmit();
  }

  private updateSelectAllStates() {
    const commonGroup = this.eventGroups.find(g => g.type === 'common');
    const specificGroup = this.eventGroups.find(g => g.type === 'specific');

    if (commonGroup) {
      this.selectAllCommon = commonGroup.events.every(e => this.selectedEvents.includes(e.event_id));
    }

    if (specificGroup) {
      this.selectAllSpecific = specificGroup.events.every(e => this.selectedEvents.includes(e.event_id));
    }
  }

  isSelected(eventId: number): boolean {
    return this.selectedEvents.includes(eventId);
  }

  getInstanceBadgeLabel(event: Event): string {
    if (!event.instance_id) return '';
    if (event.instance_id === -1) return 'Multiple';
    return `Instance ${event.instance_id}`;
  }

  getInstanceBadgeClass(event: Event): string {
    if (!event.instance_id) return '';
    if (event.instance_id === -1) return 'bg-warning';
    return 'bg-info';
  }

  private validateAndEmit() {
    this.validationError = '';

    // Save to localStorage on every change
    this.saveSelectionToStorage();

    if (this.selectedEvents.length === 0) {
      this.validationError = 'At least one event must be selected';
      this.selectedEventsChange.emit([]);
      return;
    }

    this.selectedEventsChange.emit([...this.selectedEvents]);
  }
}
