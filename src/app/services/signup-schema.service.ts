import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api/api.service';
import {
  CreateSignupSchemaRequest,
  PublishSignupSchemaResponse,
  SaveSignupSchemaRequest,
  SignupSchema,
  SignupSchemaSummary
} from '../models/signup-schema.model';

@Injectable({
  providedIn: 'root'
})
export class SignupSchemaService {
  constructor(private api: ApiService) {}

  listSchemas(instanceId: number): Observable<SignupSchemaSummary[]> {
    return this.api.get(`/instances/${instanceId}/signup-schemas`, false);
  }

  getSchema(instanceId: number, schemaId: number): Observable<SignupSchema> {
    return this.api.get(`/instances/${instanceId}/signup-schemas/${schemaId}`, false);
  }

  createDraft(instanceId: number, request: CreateSignupSchemaRequest): Observable<SignupSchema> {
    return this.api.post(`/instances/${instanceId}/signup-schemas`, request, false);
  }

  saveSchema(instanceId: number, schemaId: number, request: SaveSignupSchemaRequest): Observable<SignupSchema> {
    return this.api.put(`/instances/${instanceId}/signup-schemas/${schemaId}`, request, false);
  }

  publishSchema(instanceId: number, schemaId: number): Observable<PublishSignupSchemaResponse> {
    return this.api.post(`/instances/${instanceId}/signup-schemas/${schemaId}/publish`, {}, false);
  }

  deleteSchema(instanceId: number, schemaId: number): Observable<{ message: string; schema_id: number }> {
    return this.api.delete(`/instances/${instanceId}/signup-schemas/${schemaId}`, false);
  }
}
