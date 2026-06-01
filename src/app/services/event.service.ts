import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private translations: { [key: string]: string } = {
    'L_DATE': 'Date',
    'L_ADMIN_ID': 'Admin ID',
    'L_ADMIN_NAME': 'Affiliate Manager',
    'L_USER_ID': 'User ID',
    'L_USERNAME': 'Username',
    'L_PLAYER_ID': 'Player ID',
    'L_KEY': 'Key',
    'L_PARAMETER': 'Parameter',
    'L_COMMISSION_DESC': 'Commission Plan',
    'L_CAMPAIGN_NAME': 'Campaign',
    'L_COUNTRY': 'Country',
    'L_EVENT_1': 'GGR',
    'L_EVENT_2': 'Impressions',
    'L_EVENT_3': 'Clicks',
    'L_EVENT_4': 'NRC',
    'L_EVENT_5': 'NDC',
    'L_EVENT_6': 'Net Rev',
    'L_EVENT_7': 'Earnings',
    'L_EVENT_8': 'qNDC',
    'L_EVENT_9': 'Deposits',
    'L_EVENT_10': 'Withdrawals',
    'L_EVENT_11': 'Bets',
    'L_EVENT_12': 'Wins',
    'L_EVENT_13': 'Net Gaming',
    'L_EVENT_14': 'Chargebacks',
    'L_EVENT_15': 'Costs',
    'L_EVENT_16': 'Sub Affiliate Earnings',
    'L_EVENT_17': 'Net Rev Earnings',
    'L_EVENT_18': 'CPA Earnings',
    'L_EVENT_19': 'FTD',
    'L_EVENT_24': 'Same Day FTD',
    'L_EVENT_25': 'No. Deposits',
    'L_EVENT_26': 'Vat',
    'L_EVENT_99': 'Unique Clicks',
    'L_EVENT_117': 'Admin Fee',
    'L_ACCOUNT_LOGINS': 'Aff Logins',
    'L_UNIQUE_PLAYERS': 'Monthly Players',
    'L_PERCENT': '%',
    'L_TOTAL': 'Revenue',
    'L_PAYMENT': 'Earnings'
  };

  constructor() { }

  /**
   * Translate event key to human-readable label
   */
  translate(key: string): string {
    return this.translations[key] || key;
  }

  /**
   * Get event name from event ID
   */
  getEventName(eventId: number): string {
    return this.translate(`L_EVENT_${eventId}`);
  }

  /**
   * Format value based on event key - matches admin-angular EventService
   */
  formatValue(val: string | number, key: string): string {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    if (isNaN(numVal)) return '0';

    switch (key) {
      case 'L_ADMIN_ID':
      case 'L_USER_ID':
      case 'L_PLAYER_ID':
      case 'L_KEY':
      case 'L_PARAMETER':
      case 'L_DATE':
      case 'L_ADMIN_NAME':
      case 'L_USERNAME':
      case 'L_COMMISSION_DESC':
      case 'L_CAMPAIGN_NAME':
      case 'L_COUNTRY':
        return val.toString();

      case 'L_EVENT_2':
      case 'L_EVENT_3':
      case 'L_EVENT_4':
      case 'L_EVENT_5':
      case 'L_EVENT_8':
      case 'L_EVENT_19':
      case 'L_EVENT_24':
      case 'L_EVENT_99':
        return this.formatWithCurrency(numVal, 0, key);

      default:
        return this.formatWithCurrency(numVal, 2, key);
    }
  }

  /**
   * Format number with specified decimal places
   */
  private numberFormat(value: number, decimals: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format number with currency symbol based on event type
   */
  private formatWithCurrency(value: number, decimals: number, key: string): string {
    const formattedNumber = this.numberFormat(value, decimals);
    
    // Events that should NOT show currency (non-monetary events)
    const nonMonetaryEvents = [
      'L_EVENT_2',  // Impressions
      'L_EVENT_3',  // Clicks
      'L_EVENT_4',  // NRC
      'L_EVENT_5',  // NDC
      'L_EVENT_8',  // QNDC
      'L_EVENT_19', // FTD
      'L_EVENT_24'  // SAME DAY DEPOSIT
    ];
    
    // If this is a non-monetary event, return just the number
    if (nonMonetaryEvents.includes(key)) {
      return formattedNumber;
    }
    
    // For monetary events, add currency symbol
    const currencySymbol = environment.app_currency_symbol || '$';
    const currencyPosition = environment.app_currency_position || 'before';
    
    if (currencyPosition === 'before') {
      return `${currencySymbol}${formattedNumber}`;
    } else {
      return `${formattedNumber}${currencySymbol}`;
    }
  }

  /**
   * Check if an event should be formatted as integer (no decimals)
   */
  isIntegerEvent(eventId: number): boolean {
    const integerEvents = [2, 3, 4, 5, 8, 19, 24, 99];
    return integerEvents.includes(eventId);
  }

  /**
   * Check if an event should display currency symbol
   */
  isMonetaryEvent(eventId: number): boolean {
    const nonMonetaryEvents = [2, 3, 4, 5, 8, 19, 24];
    return !nonMonetaryEvents.includes(eventId);
  }

  /**
   * Parse date from L_DATE format to readable format
   */
  parseEventDate(dateValue: string | number): string {
    const dateStr = dateValue.toString();
    
    // If it's a date range format like "2026-04-01 - 2026-04-24"
    if (dateStr.includes(' - ') && dateStr.length > 10) {
      try {
        const parts = dateStr.split(' - ');
        if (parts.length === 2) {
          const startDate = new Date(parts[0]);
          const endDate = new Date(parts[1]);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const formatOptions: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            };
            
            // If same month and year, use compact format
            if (startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth()) {
              const monthYear = startDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              });
              return `${monthYear} ${startDate.getDate()} - ${endDate.getDate()}`;
            }
            
            // Different months or years, show full dates
            const start = startDate.toLocaleDateString('en-US', formatOptions);
            const end = endDate.toLocaleDateString('en-US', formatOptions);
            return `${start} - ${end}`;
          }
        }
      } catch {
        // If parsing fails, fall through to return original
      }
    }
    
    // If it's YYYYMM format
    if (dateStr.length === 6 && !isNaN(Number(dateStr))) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    }
    
    return dateStr;
  }
}
