# Platform Data Sync Architecture

## Overview

The platform data synchronization system enables caching of platform data (account managers, affiliates, brands, commission plans) in the management-api database. This architecture uses a service-based approach with individual entity sync services orchestrated by a master service.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ManageInstanceComponent                      │
│  - Manages UI state and user interactions                      │
│  - Injects individual sync services or master orchestrator     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ Uses
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   InterfaceSyncService                          │
│  - Master orchestrator for syncing all platform data            │
│  - syncAll(): Parallel execution with forkJoin                  │
│  - Individual entity methods: syncAccounts(), syncAffiliates()  │
│  - Progress tracking for each entity                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┬─────────────┐
         │             │             │             │
         ▼             ▼             ▼             ▼
┌─────────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────┐
│  Account    │ │  Affiliate   │ │  Brand   │ │ Commission │
│  Sync       │ │  Sync        │ │  Sync    │ │ Sync       │
│  Service    │ │  Service     │ │  Service │ │ Service    │
└─────────────┘ └──────────────┘ └──────────┘ └────────────┘
       │               │               │              │
       └───────────────┴───────────────┴──────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │    Management API Backend    │
         │  - Soft delete pattern       │
         │  - Transaction safety        │
         │  - Last sync tracking        │
         └─────────────────────────────┘
```

## Service Structure

### 1. InterfaceSyncService (Master Orchestrator)

**Purpose**: Coordinates synchronization across all platform entity types

**Key Methods**:
- `syncAll(instanceId, apiEndpoint, accessToken)`: Executes all syncs in parallel using `forkJoin`
- `syncAccounts()`: Sync account managers only
- `syncAffiliates()`: Sync affiliates only
- `syncBrands()`: Sync brands only
- `syncCommissions()`: Sync commission plans only
- `getProgress(entity)`: Get sync progress for a specific entity
- `getAllProgress()`: Get progress for all entities

**Return Type**: `Observable<SyncAllResult>`
```typescript
interface SyncAllResult {
  success: boolean;
  results: {
    accounts?: AccountSyncResult;
    affiliates?: AffiliateSyncResult;
    brands?: BrandSyncResult;
    commissions?: CommissionSyncResult;
  };
  errors: string[];
  totalSynced: number;
}
```

**Progress Tracking**:
- Maintains a `Map<string, SyncProgress>` with entity status
- States: `pending`, `syncing`, `complete`, `error`
- Progress percentages: 0% (pending), 50% (syncing), 100% (complete)

---

### 2. AccountSyncService (Entity Service)

**Purpose**: Handles account manager synchronization

**Key Methods**:
- `sync(instanceId, apiEndpoint, accessToken)`: Fetch from platform API and save to management-api
- `loadFromCache(instanceId)`: Load cached data from management-api
- `saveToDatabase(accounts, instanceId, userId)`: Internal helper to persist data

**API Endpoints**:
- Platform: `GET ${apiEndpoint}/admin/settings/permissions/affiliate-managers`
- Management-API: 
  - `GET /clients/instance/${instanceId}/user-accounts`
  - `POST /clients/instance/user-accounts/sync`

**Return Type**: `Observable<AccountSyncResult>`
```typescript
interface AccountSyncResult {
  success: boolean;
  managers: Manager[];
  error?: string;
  inserted?: number;
  updated?: number;
  unchanged?: number;
}
```

**Data Transformation**:
```typescript
// Platform API format
{
  user_id: number,
  username: string,
  user_role: string,
  role_id: number,
  email: string,
  status: string
}

// Management-API format
{
  instance_id: number,
  user_id: number,
  account_username: string,
  account_email: string,
  account_role_id: number,
  account_role_label: string,
  account_status: string,
  creator_id: number
}
```

---

### 3. AffiliateSyncService (Stub)

**Purpose**: Handles affiliate synchronization (to be implemented)

**Methods**: Same pattern as AccountSyncService
- `sync(instanceId, apiEndpoint, accessToken)`
- `loadFromCache(instanceId)`

**TODO**:
- Determine platform API endpoint for affiliates
- Create management-api table (`instance_affiliates`)
- Implement backend sync logic
- Add data transformation

---

### 4. BrandSyncService (Stub)

**Purpose**: Handles brand synchronization (to be implemented)

**Methods**: Same pattern as AccountSyncService

**TODO**:
- Determine platform API endpoint for brands
- Create management-api table (`instance_brands`)
- Implement backend sync logic

---

### 5. CommissionSyncService (Stub)

**Purpose**: Handles commission plan synchronization (to be implemented)

**Methods**: Same pattern as AccountSyncService

**TODO**:
- Determine platform API endpoint for commission plans
- Create management-api table (`instance_commission_plans`)
- Implement backend sync logic

---

## Database Pattern: Soft Delete with Last Sync Tracking

### Table Schema Example (instance_user_accounts)

```sql
CREATE TABLE instance_user_accounts (
  instance_id INT NOT NULL,
  user_id INT NOT NULL,
  account_username VARCHAR(255) NOT NULL,
  account_email VARCHAR(255) NOT NULL,
  account_role_id INT NOT NULL,
  account_role_label VARCHAR(100) NOT NULL,
  account_status VARCHAR(50) NOT NULL,
  creator_id INT NOT NULL,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater_id INT DEFAULT NULL,
  updated DATETIME DEFAULT NULL,
  last_synced DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (instance_id, user_id, created),
  INDEX idx_active (instance_id, updated)
);
```

### Soft Delete Logic

**Active Records**: `updated IS NULL`
**Historical Records**: `updated IS NOT NULL`

When syncing:
1. Load current active records (`WHERE updated IS NULL`)
2. Compare with incoming data
3. For each incoming record:
   - **If changed**: Soft delete old (set `updater_id`, `updated`), insert new with `last_synced`
   - **If unchanged**: Update `last_synced` only
   - **If new**: Insert with `last_synced`

### Last Sync Tracking

**Purpose**: Track verification time separately from data changes

- `last_synced`: Updated on **every** sync regardless of data changes
- `updated`: Only set when record is soft deleted (data changed or removed)

**Benefits**:
- Know when data was last verified even if unchanged
- Distinguish between "never synced" and "synced but no changes"
- Audit trail shows when records became historical

---

## Component Integration

### ManageInstanceComponent

**Inject Services**:
```typescript
constructor(
  private accountSync: AccountSyncService,
  private interfaceSync: InterfaceSyncService
) {}
```

**Load Cached Data**:
```typescript
private loadAccountManagersFromDB(): void {
  this.accountSync.loadFromCache(this.instanceId).subscribe({
    next: (result) => {
      if (result.success && result.managers.length > 0) {
        this.managers = result.managers;
      } else {
        this.syncAccountManagers(); // Fallback to sync
      }
    }
  });
}
```

**Sync Individual Entity**:
```typescript
public syncAccountManagers(): void {
  this.syncing = true;
  this.accountSync.sync(
    this.instanceId, 
    this.instance.api_endpoint, 
    this.linkedToken.access_token
  ).subscribe({
    next: (result) => {
      this.syncing = false;
      if (result.success) {
        this.managers = result.managers;
      }
    }
  });
}
```

**Sync All Entities**:
```typescript
public syncAll(): void {
  this.syncing = true;
  this.interfaceSync.syncAll(
    this.instanceId,
    this.instance.api_endpoint,
    this.linkedToken.access_token
  ).subscribe({
    next: (result) => {
      this.syncing = false;
      if (result.success) {
        // Update UI with results
        if (result.results.accounts) {
          this.managers = result.results.accounts.managers;
        }
      }
    }
  });
}
```

---

## Usage Patterns

### 1. Individual Entity Sync
User clicks on "Account Managers" card
→ Component calls `accountSync.sync()`
→ Service fetches from platform API
→ Service saves to management-api
→ Component updates UI

### 2. Orchestrated Sync All
User clicks "Sync All" button
→ Component calls `interfaceSync.syncAll()`
→ Master service executes all entity syncs in parallel with `forkJoin`
→ Progress tracking updated for each entity
→ Component receives aggregated results
→ UI shows total synced count and any errors

### 3. Load from Cache
Component initializes or refreshes
→ Component calls `accountSync.loadFromCache()`
→ Service queries management-api for active records
→ If cached data exists, return immediately
→ If no cache, fallback to sync

---

## Error Handling

### Individual Service Errors
- Caught within service's `catchError` operator
- Returns `Observable.of({ success: false, error: message }))`
- Doesn't propagate error to subscriber

### Master Orchestrator Errors
- Individual entity failures don't stop other syncs
- Aggregates all errors in `SyncAllResult.errors[]`
- Returns `success: false` if any entity failed
- Still returns partial results for successful syncs

---

## Future Enhancements

### 1. Implement Remaining Services
- Complete `AffiliateSyncService`
- Complete `BrandSyncService`
- Complete `CommissionSyncService`
- Uncomment orchestration in `InterfaceSyncService.syncAll()`

### 2. Progress UI
- Display real-time progress for each entity during sync all
- Show last sync time for each entity type
- Visual indicators for stale data (e.g., not synced in 24 hours)

### 3. Incremental Sync
- Add delta sync support (only fetch changes since last sync)
- Track `last_sync_cursor` for each entity type
- Reduce API load for large datasets

### 4. Background Sync
- Implement scheduled background syncing
- Web Worker for non-blocking syncs
- Service Worker for offline support

### 5. Conflict Resolution
- Handle platform data deleted but cached locally
- User-driven resolution for conflicting changes
- Tombstone pattern for permanent deletions

---

## Testing Strategy

### Unit Tests
- Mock HttpClient responses
- Test data transformations
- Verify soft delete logic
- Test error handling paths

### Integration Tests
- Test full sync flow from platform API to management-api
- Verify cached data retrieval
- Test orchestrated sync with multiple entities
- Validate transaction rollback on errors

### E2E Tests
- Test UI interactions (clicking sync buttons)
- Verify progress indicators update correctly
- Test error toasts display properly
- Validate cached data displays after refresh

---

## Maintenance Notes

### Adding New Entity Type

1. **Create Service** (`src/app/services/sync/${entity}-sync.service.ts`)
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class EntitySyncService {
     sync(instanceId, apiEndpoint, token): Observable<EntitySyncResult> { }
     loadFromCache(instanceId): Observable<EntitySyncResult> { }
   }
   ```

2. **Create Database Table** (management-api)
   ```sql
   CREATE TABLE instance_entities (
     instance_id INT,
     entity_id INT,
     -- entity fields
     creator_id INT,
     created DATETIME DEFAULT CURRENT_TIMESTAMP,
     updater_id INT DEFAULT NULL,
     updated DATETIME DEFAULT NULL,
     last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (instance_id, entity_id, created)
   );
   ```

3. **Add Backend Endpoints** (management-api)
   - GET `/clients/instance/{id}/entities`
   - POST `/clients/instance/entities/sync`

4. **Update InterfaceSyncService**
   - Inject new service
   - Add `syncEntities()` method
   - Add to `syncAll()` forkJoin

5. **Update Component**
   - Add entity array property
   - Update `managePlatformSection()` switch
   - Add entity-specific sync method

---

## Troubleshooting

### "No cached data found"
- Verify instance_id is correct
- Check database table exists
- Ensure `updated IS NULL` records exist
- Run sync to populate cache

### "Sync completed but no UI update"
- Check transformation logic matches database columns
- Verify component subscribes to result
- Ensure managers array assignment happens in success callback

### "Transaction rolled back"
- Check backend logs for SQL errors
- Verify all required fields provided
- Ensure creator_id/updater_id are valid user IDs

### "Token expired during sync"
- Implement token refresh logic
- Show re-authentication modal
- Queue sync to retry after auth

---

## Related Files

### Frontend
- `src/app/services/sync/account-sync.service.ts`
- `src/app/services/sync/affiliate-sync.service.ts`
- `src/app/services/sync/brand-sync.service.ts`
- `src/app/services/sync/commission-sync.service.ts`
- `src/app/services/sync/interface-sync.service.ts`
- `src/app/components/clients/manage-instance/manage-instance.component.ts`

### Backend (management-api)
- `src/orm/definitions.go`
- `src/orm/get-instance-user-accounts-db.go`
- `src/orm/get-instance-user-accounts.go`
- `src/orm/sync-instance-user-accounts-db.go`
- `src/orm/sync-instance-user-accounts.go`
- `src/routes/client-routes.go`

### Documentation
- `docs/SYNC-ARCHITECTURE.md` (this file)
