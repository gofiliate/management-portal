import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, mergeMap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth.service';

export interface TextLink {
  url_item_id: number;
  url_item_description: string;
  internal_description: string;
  url: string;
  [key: string]: any;
}

export interface GeoGroup {
  geo_id: number;
  user_id: number;
  brand_id: number;
  description: string;
  internal_description: string;
  status: number;
  links?: GeoLink[]; // Detailed breakdown
  [key: string]: any;
}

export interface GeoLink {
  geo_id: number;
  commission_id: number;
  country_code: string;
  url_item_id: number;
  default: number;
  [key: string]: any;
}

export interface LandingPageSyncResult {
  success: boolean;
  textLinks: TextLink[];
  geoGroups: GeoGroup[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LandingPageSyncService {

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  /**
   * Sync landing pages (text links and geo groups with details) from platform API
   * @param instanceId - The instance ID to sync
   * @param apiEndpoint - The platform API endpoint
   * @param accessToken - The JWT access token for authentication
   * @param forceSync - If true, soft-deletes all existing active records then creates new entries
   */
  sync(instanceId: number, apiEndpoint: string, accessToken: string, forceSync: boolean = false): Observable<LandingPageSyncResult> {
    const textLinksUrl = `${apiEndpoint}/admin/media/text-links`;
    const geoGroupsUrl = `${apiEndpoint}/admin/media/geo-location`;
    const headers = { 'Authorization': accessToken };

    console.log('[LandingPageSync] ========================================');
    console.log('[LandingPageSync] FETCHING LANDING PAGE DATA');
    console.log('[LandingPageSync] ========================================');
    console.log('[LandingPageSync] Text Links URL:', textLinksUrl);
    console.log('[LandingPageSync] Geo Groups URL:', geoGroupsUrl);
    console.log('[LandingPageSync] Force Sync:', forceSync);

    return forkJoin({
      textLinks: this.http.get<any>(textLinksUrl, { headers }).pipe(
        catchError(error => {
          console.error('[LandingPageSync] Error fetching text links:', error);
          return of([]);
        })
      ),
      geoGroups: this.http.get<any>(geoGroupsUrl, { headers }).pipe(
        catchError(error => {
          console.error('[LandingPageSync] Error fetching geo groups:', error);
          return of([]);
        })
      )
    }).pipe(
      switchMap(results => {
        // Log text links
        console.log('[LandingPageSync] ========================================');
        console.log('[LandingPageSync] TEXT LINKS RESPONSE:');
        console.log('[LandingPageSync] ========================================');
        console.log('[LandingPageSync] Response type:', Array.isArray(results.textLinks) ? 'Array' : typeof results.textLinks);
        console.log('[LandingPageSync] Number of text links:', Array.isArray(results.textLinks) ? results.textLinks.length : 'N/A');
        console.log('[LandingPageSync] Full response:', JSON.stringify(results.textLinks, null, 2));
        
        if (Array.isArray(results.textLinks) && results.textLinks.length > 0) {
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] FIRST TEXT LINK SAMPLE:');
          console.log('[LandingPageSync] ========================================');
          console.log(JSON.stringify(results.textLinks[0], null, 2));
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] ALL TEXT LINK FIELDS:');
          console.log('[LandingPageSync] ========================================');
          Object.keys(results.textLinks[0]).forEach(key => {
            const value = results.textLinks[0][key];
            const type = typeof value;
            const sample = type === 'string' ? `"${value}"` : value;
            console.log(`[LandingPageSync]   ${key}: ${type} = ${sample}`);
          });
          console.log('[LandingPageSync] ========================================');
        }

        console.log('[LandingPageSync] ========================================');
        console.log('[LandingPageSync] GEO GROUPS RESPONSE (TOP LEVEL):');
        console.log('[LandingPageSync] ========================================');
        console.log('[LandingPageSync] Response type:', Array.isArray(results.geoGroups) ? 'Array' : typeof results.geoGroups);
        console.log('[LandingPageSync] Number of geo groups:', Array.isArray(results.geoGroups) ? results.geoGroups.length : 'N/A');
        console.log('[LandingPageSync] Full response:', JSON.stringify(results.geoGroups, null, 2));
        
        if (Array.isArray(results.geoGroups) && results.geoGroups.length > 0) {
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] FIRST GEO GROUP SAMPLE:');
          console.log('[LandingPageSync] ========================================');
          console.log(JSON.stringify(results.geoGroups[0], null, 2));
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] ALL GEO GROUP FIELDS:');
          console.log('[LandingPageSync] ========================================');
          Object.keys(results.geoGroups[0]).forEach(key => {
            const value = results.geoGroups[0][key];
            const type = typeof value;
            const sample = type === 'string' ? `"${value}"` : value;
            console.log(`[LandingPageSync]   ${key}: ${type} = ${sample}`);
          });
          console.log('[LandingPageSync] ========================================');

          // Now fetch detailed links for each geo group
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] FETCHING DETAILED GEO LINKS FOR EACH GROUP:');
          console.log('[LandingPageSync] ========================================');

          const geoLinkRequests = results.geoGroups.map((group: any) => 
            this.http.get<any>(`${geoGroupsUrl}/${group.geo_id}`, { headers }).pipe(
              map(links => ({ 
                ...group, 
                links: Array.isArray(links) ? links : [] 
              })),
              catchError(error => {
                console.error(`[LandingPageSync] Error fetching links for geo group ${group.geo_id}:`, error);
                return of({ ...group, links: [] });
              })
            )
          );

          return forkJoin(geoLinkRequests).pipe(
            mergeMap(geoGroupsWithLinks => {
              console.log('[LandingPageSync] ========================================');
              console.log('[LandingPageSync] GEO GROUPS WITH DETAILED LINKS:');
              console.log('[LandingPageSync] ========================================');
              console.log('[LandingPageSync] Full response with links:', JSON.stringify(geoGroupsWithLinks, null, 2));

              if (geoGroupsWithLinks.length > 0 && geoGroupsWithLinks[0].links && geoGroupsWithLinks[0].links.length > 0) {
                console.log('[LandingPageSync] ========================================');
                console.log('[LandingPageSync] FIRST GEO LINK BREAKDOWN SAMPLE:');
                console.log('[LandingPageSync] ========================================');
                console.log(JSON.stringify(geoGroupsWithLinks[0].links[0], null, 2));
                console.log('[LandingPageSync] ========================================');
                console.log('[LandingPageSync] ALL GEO LINK FIELDS:');
                console.log('[LandingPageSync] ========================================');
                Object.keys(geoGroupsWithLinks[0].links[0]).forEach(key => {
                  const value = geoGroupsWithLinks[0].links[0][key];
                  const type = typeof value;
                  const sample = type === 'string' ? `"${value}"` : value;
                  console.log(`[LandingPageSync]   ${key}: ${type} = ${sample}`);
                });
                console.log('[LandingPageSync] ========================================');
              }

              console.log('[LandingPageSync] ========================================');
              console.log('[LandingPageSync] SAVING TO MANAGEMENT-API');
              console.log('[LandingPageSync] ========================================');

              // Transform and save text links
              const transformedTextLinks = results.textLinks.map((link: any) => ({
                link_id: parseInt(link.url_item_id, 10),
                brand_id: parseInt(link.brand_id, 10),
                user_id: link.user_id === 0 ? null : parseInt(link.user_id, 10),
                link_url: link.url_item_destination,
                link_description: link.internal_description,
                is_exclusive: link.isExclusive,
                active: link.url_item_status
              }));

              // Transform geo groupings (without links)
              const transformedGeoGroupings = geoGroupsWithLinks.map((group: any) => ({
                geo_id: parseInt(group.geo_id, 10),
                brand_id: parseInt(group.brand_id, 10),
                user_id: group.user_id === 0 ? null : parseInt(group.user_id, 10),
                geo_description: group.internal_description,
                status: parseInt(group.status, 10)
              }));

              // Flatten all geo links from all groups
              const allGeoLinks: any[] = [];
              geoGroupsWithLinks.forEach((group: any) => {
                if (group.links && Array.isArray(group.links)) {
                  group.links.forEach((link: any) => {
                    allGeoLinks.push({
                      geo_id: parseInt(link.geo_id, 10),
                      geo_country: link.country_code,
                      link_id: parseInt(link.url_item_id, 10),
                      default: parseInt(link.default, 10)
                    });
                  });
                }
              });

              console.log('[LandingPageSync] Transformed text links:', transformedTextLinks.length);
              console.log('[LandingPageSync] Transformed geo groupings:', transformedGeoGroupings.length);
              console.log('[LandingPageSync] Transformed geo links:', allGeoLinks.length);

              // Save all three types to management-api
              return forkJoin({
                textLinks: this.api.post('/clients/instance/textlinks/sync', {
                  instance_id: instanceId,
                  text_links: transformedTextLinks,
                  user_id: this.auth.getUserId(),
                  force_sync: forceSync
                }, false),
                geoGroupings: this.api.post('/clients/instance/geo-groupings/sync', {
                  instance_id: instanceId,
                  geo_groupings: transformedGeoGroupings,
                  user_id: this.auth.getUserId(),
                  force_sync: forceSync
                }, false),
                geoLinks: this.api.post('/clients/instance/geo-links/sync', {
                  instance_id: instanceId,
                  geo_links: allGeoLinks,
                  user_id: this.auth.getUserId(),
                  force_sync: forceSync
                }, false)
              }).pipe(
                mergeMap((syncResults: any) => {
                  console.log('[LandingPageSync] ========================================');
                  console.log('[LandingPageSync] SAVED TO MANAGEMENT-API');
                  console.log('[LandingPageSync] ========================================');
                  console.log('[LandingPageSync] Text Links:', syncResults.textLinks);
                  console.log('[LandingPageSync] Geo Groupings:', syncResults.geoGroupings);
                  console.log('[LandingPageSync] Geo Links:', syncResults.geoLinks);

                  // Load fresh data from cache
                  return this.loadFromCache(instanceId);
                })
              );
            })
          );
        } else {
          // No geo groups, only process text links
          console.log('[LandingPageSync] ========================================');
          console.log('[LandingPageSync] No geo groups found, syncing text links only');
          console.log('[LandingPageSync] ========================================');

          const transformedTextLinks = results.textLinks.map((link: any) => ({
            link_id: parseInt(link.url_item_id, 10),
            brand_id: parseInt(link.brand_id, 10),
            user_id: link.user_id === 0 ? null : parseInt(link.user_id, 10),
            link_url: link.url_item_destination,
            link_description: link.internal_description,
            is_exclusive: link.isExclusive,
            active: link.url_item_status
          }));

          return this.api.post('/clients/instance/textlinks/sync', {
            instance_id: instanceId,
            text_links: transformedTextLinks,
            user_id: this.auth.getUserId(),
            force_sync: forceSync
          }, false).pipe(
            mergeMap((syncResult: any) => {
              console.log('[LandingPageSync] Text Links Saved:', syncResult);
              return this.loadFromCache(instanceId);
            })
          );
        }
      }),
      catchError(error => {
        console.error('[LandingPageSync] Error during sync:', error);
        return of({
          success: false,
          textLinks: [],
          geoGroups: [],
          error: error.message || 'Failed to fetch landing pages'
        });
      })
    );
  }

  /**
   * Force sync landing pages
   */
  forceSync(instanceId: number, apiEndpoint: string, accessToken: string): Observable<LandingPageSyncResult> {
    console.log('[LandingPageSync] Force sync requested');
    return this.sync(instanceId, apiEndpoint, accessToken, true);
  }

  /**
   * Load landing pages from management-api cache
   */
  loadFromCache(instanceId: number): Observable<LandingPageSyncResult> {
    console.log('[LandingPageSync] Loading from cache for instance:', instanceId);

    return forkJoin({
      textLinks: this.api.get(`/clients/instance/textlinks/${instanceId}`, false),
      geoGroupings: this.api.get(`/clients/instance/geo-groupings/${instanceId}`, false),
      geoLinks: this.api.get(`/clients/instance/geo-links/${instanceId}`, false)
    }).pipe(
      map((cacheData: any) => {
        console.log('[LandingPageSync] Loaded from cache');
        console.log('[LandingPageSync] Text Links:', cacheData.textLinks?.length || 0);
        console.log('[LandingPageSync] Geo Groupings:', cacheData.geoGroupings?.length || 0);
        console.log('[LandingPageSync] Geo Links:', cacheData.geoLinks?.length || 0);

        // Convert back to platform format for display
        const textLinks = Array.isArray(cacheData.textLinks) ? cacheData.textLinks.map((link: any) => ({
          url_item_id: link.link_id,
          brand_id: link.brand_id,
          user_id: link.user_id || 0,
          url_item_destination: link.link_url,
          url_item_description: link.link_description,
          internal_description: link.link_description,
          isExclusive: link.is_exclusive,
          url_item_status: link.active
        })) : [];

        const geoGroups = Array.isArray(cacheData.geoGroupings) ? cacheData.geoGroupings.map((group: any) => {
          // Find links for this geo group
          const groupLinks = Array.isArray(cacheData.geoLinks) 
            ? cacheData.geoLinks.filter((link: any) => link.geo_id === group.geo_id).map((link: any) => ({
                geo_id: link.geo_id,
                commission_id: 0, // Not stored in DB
                country_code: link.geo_country,
                url_item_id: link.link_id,
                default: link.default
              }))
            : [];

          return {
            geo_id: group.geo_id,
            brand_id: group.brand_id,
            user_id: group.user_id || 0,
            description: group.geo_description,
            internal_description: group.geo_description,
            status: group.status,
            links: groupLinks
          };
        }) : [];

        return {
          success: true,
          textLinks: textLinks,
          geoGroups: geoGroups
        };
      }),
      catchError(error => {
        console.error('[LandingPageSync] Error loading from cache:', error);
        return of({
          success: false,
          textLinks: [],
          geoGroups: [],
          error: error.message || 'Failed to load from cache'
        });
      })
    );
  }
}
