export interface TOTPSetupResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
  manual_entry: string;
}

export interface TOTPVerifySetupRequest {
  secret: string;
  code: string;
  backup_codes: string[];
}

export interface TOTPVerifyLoginRequest {
  username: string;
  code: string;
}

export interface TOTPDisableRequest {
  password: string;
}

export interface BackupCodeRequest {
  username: string;
  backup_code: string;
}
