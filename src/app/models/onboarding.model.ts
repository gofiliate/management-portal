export interface OnboardingRequest {
  request_id: number;
  request_reference: string;
  company_name_preliminary: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  status: 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';
  completion_percentage: number;
  created_by: number;
  assigned_admin?: number;
  guest_user_id?: number;
  invitation_token?: string;
  invitation_sent_at?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  review_notes?: string;
  client_id?: number;
  created_at: string;
  updated_at: string;
  sections?: OnboardingRequestSection[];
  assignments?: OnboardingRequestAssignment[];
}

export interface OnboardingRequestSection {
  section_id: number;
  request_id: number;
  section_type: string;
  section_title: string;
  section_description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  is_required: boolean;
  section_data?: { [key: string]: any };
  completed_by?: number;
  completed_at?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingRequestAssignment {
  assignment_id: number;
  request_id: number;
  section_id: number;
  user_id: number;
  assigned_by: number;
  assignment_note?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  last_viewed_at?: string;
  created_at: string;
}

export interface OnboardingRequestActivity {
  activity_id: number;
  request_id: number;
  performed_by: number;
  activity_type: string;
  activity_description: string;
  target_user_id?: number;
  section_id?: number;
  metadata?: { [key: string]: any };
  created_at: string;
}

// Request DTOs
export interface CreateOnboardingRequestRequest {
  company_name_preliminary: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  guest_email?: string;      // For inviting NEW guest
  guest_user_id?: number;    // For assigning EXISTING guest
  assigned_admin?: number;
  sections: CreateOnboardingRequestSectionDTO[];
}

export interface CreateOnboardingRequestSectionDTO {
  section_type: string;
  section_title: string;
  section_description?: string;
  is_required: boolean;
  display_order: number;
}

export interface UpdateOnboardingRequestRequest {
  company_name_preliminary?: string;
  status?: string;
  assigned_admin?: number;
  admin_notes?: string;
}

export interface UpdateSectionDataRequest {
  section_data: { [key: string]: any };
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface ApproveOnboardingRequest {
  admin_notes?: string;
}

export interface RejectOnboardingRequest {
  rejection_reason: string;
  admin_notes?: string;
}

export interface AssignUserToSectionRequest {
  section_id: number;
  user_id: number;
  note?: string;
}

export interface LinkClientRequest {
  client_id: number;
}

export interface OnboardingListFilter {
  status?: 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';
}
