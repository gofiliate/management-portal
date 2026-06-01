import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api/api.service';
import {
  CreateFormSchemaRequest,
  FormSchema,
  FormSchemaDistributionSummary,
  FormSchemaSummary,
  InstanceSummary,
  PublishFormSchemaResponse,
  PublishFormSchemaRequest,
  SaveFormSchemaRequest
} from '../models/form-schema.model';

@Injectable({
  providedIn: 'root'
})
export class FormSchemaService {
  constructor(private api: ApiService) {}

  listSchemas(formType?: string, schemaType?: string): Observable<FormSchemaSummary[]> {
    const queryParams: string[] = [];
    if (formType) {
      queryParams.push(`form_type=${encodeURIComponent(formType)}`);
    }
    if (schemaType) {
      queryParams.push(`schema_type=${encodeURIComponent(schemaType)}`);
    }

    const slug = queryParams.length > 0
      ? `/form-schemas?${queryParams.join('&')}`
      : '/form-schemas';

    return this.api.get(slug, false);
  }

  getSchema(id: number): Observable<FormSchema> {
    return this.api.get(`/form-schemas/${id}`, false);
  }

  createDraft(request: CreateFormSchemaRequest): Observable<FormSchema> {
    return this.api.post('/form-schemas', request, false);
  }

  saveSchema(id: number, request: SaveFormSchemaRequest): Observable<FormSchema> {
    return this.api.put(`/form-schemas/${id}`, request, false);
  }

  deleteSchema(id: number): Observable<{ message: string; schema_id: number }> {
    return this.api.delete(`/form-schemas/${id}`, false);
  }

  publishSchema(id: number, request: PublishFormSchemaRequest): Observable<PublishFormSchemaResponse> {
    return this.api.post(`/form-schemas/${id}/publish`, request, false);
  }

  listDistributions(id: number): Observable<FormSchemaDistributionSummary[]> {
    return this.api.get(`/form-schemas/${id}/distributions`, false);
  }

  distributeSchema(id: number, request: PublishFormSchemaRequest): Observable<PublishFormSchemaResponse> {
    return this.api.post(`/form-schemas/${id}/distribute`, request, false);
  }

  listInstances(): Observable<InstanceSummary[]> {
    return this.api.get('/instances', false).pipe(
      map((instances: InstanceSummary[]) =>
        instances.map((instance) => ({
          ...instance,
          is_active: instance.is_active ?? true
        }))
      )
    );
  }
}
