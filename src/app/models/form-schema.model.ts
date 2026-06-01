import {
  SignupFieldType,
  SignupSchemaOption,
  SignupSchemaOptionInput
} from './signup-schema.model';

export type FormFieldType = SignupFieldType;
export type FormSchemaOption = SignupSchemaOption;
export type FormSchemaOptionInput = SignupSchemaOptionInput;

export interface FormSchemaField {
  field_id: number;
  field_key: string;
  field_type: FormFieldType | 'email' | 'tel' | 'url' | 'number' | 'date' | 'color' | 'textarea';
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  section_key?: string | null;
  step_index: number;
  display_order: number;
  is_system: boolean;
  is_required: boolean;
  is_active: boolean;
  options_source?: string | null;
  validation?: Record<string, unknown> | null;
  options: SignupSchemaOption[];
}

export interface FormSchemaFieldInput {
  field_key: string;
  field_type: FormSchemaField['field_type'];
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  section_key?: string | null;
  step_index: number;
  display_order: number;
  is_system: boolean;
  is_required: boolean;
  is_active: boolean;
  options_source?: string | null;
  validation?: Record<string, unknown> | null;
  options: SignupSchemaOptionInput[];
}

export interface FormSchemaSection {
  section_id: number;
  section_key: string;
  label: string;
  description?: string | null;
  step_index: number;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
}

export interface FormSchemaSectionInput {
  section_key: string;
  label: string;
  description?: string | null;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
}

export interface FormSchemaSummary {
  schema_id: number;
  form_type: string;
  schema_type: string;
  schema_key: string;
  version: number;
  label: string;
  status: string;
  is_active: boolean;
  is_default_seed: boolean;
  published_at?: string | null;
  last_synced_at?: string | null;
  sync_error?: string | null;
  created: string;
  updated: string;
}

export interface FormSchema extends FormSchemaSummary {
  sections?: FormSchemaSection[];
  fields: FormSchemaField[];
}

export interface FormSchemaDistribution {
  distribution_id: number;
  schema_id?: number;
  form_schema_id?: number;
  instance_id: number;
  instance_name: string;
  client_id?: number | null;
  client_name?: string | null;
  adapter_type?: string;
  adapter_schema_id?: number | null;
  is_current?: boolean;
  distributed_at?: string | null;
  distributed_by?: string | null;
  published_at?: string | null;
  last_synced_at?: string | null;
  status: string;
  error?: string | null;
  sync_error?: string | null;
  created?: string;
  updated?: string;
}

export interface FormSchemaDistributionSummary extends FormSchemaDistribution {
}

export interface InstanceSummary {
  instance_id: number;
  instance_name: string;
  client_name?: string;
  is_active: boolean;
}

export interface CreateFormSchemaRequest {
  form_type: string;
  schema_type?: string;
  schema_key?: string;
  label?: string;
  clone_from_schema_id?: number;
}

export interface SaveFormSchemaRequest {
  label: string;
  sections?: FormSchemaSectionInput[];
  fields: FormSchemaFieldInput[];
}

export interface PublishFormSchemaRequest {
  instance_ids?: number[];
  distribute_all?: boolean;
}

export interface PublishFormSchemaResponse {
  message: string;
  schema: FormSchema;
  distribution_count?: number;
  distributions?: FormSchemaDistributionSummary[];
}
