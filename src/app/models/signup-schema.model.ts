export type SignupFieldType = 'text' | 'password' | 'checkbox' | 'checkbox_group' | 'select';

export interface SignupSchemaSummary {
  schema_id: number;
  instance_id: number;
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

export interface SignupSchemaOption {
  option_id: number;
  option_value: string;
  option_label: string;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
}

export interface SignupSchemaField {
  field_id: number;
  field_key: string;
  field_type: SignupFieldType;
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  step_index: number;
  display_order: number;
  is_system: boolean;
  is_required: boolean;
  is_active: boolean;
  options_source?: string | null;
  validation?: Record<string, unknown> | null;
  options: SignupSchemaOption[];
}

export interface SignupSchema extends SignupSchemaSummary {
  fields: SignupSchemaField[];
}

export interface CreateSignupSchemaRequest {
  label?: string;
  clone_from_schema_id?: number;
}

export interface SignupSchemaOptionInput {
  option_value: string;
  option_label: string;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
}

export interface SignupSchemaFieldInput {
  field_key: string;
  field_type: SignupFieldType;
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  step_index: number;
  display_order: number;
  is_system: boolean;
  is_required: boolean;
  is_active: boolean;
  options_source?: string | null;
  validation?: Record<string, unknown> | null;
  options: SignupSchemaOptionInput[];
}

export interface SaveSignupSchemaRequest {
  label: string;
  fields: SignupSchemaFieldInput[];
}

export interface PublishSignupSchemaResponse {
  message: string;
  schema: SignupSchema;
}
