export interface JWTUser {
  access_label: string;  // ACL role name e.g. "Gofiliate"
  access_level: number;  // ACL role_id e.g. 1
  is_god: boolean;       // God mode from users table
  bearer: string;        // JWT token
  exp: number;           // Unix timestamp (seconds)
  iat: number;           // Unix timestamp (seconds)
  user_id: number;       // User ID
  username: string;      // e.g. "david@gofiliate.com"
  first_name: string;    // User's first name
  last_name: string;     // User's last name
  profile_picture: string; // Google profile picture URL
  totp_enabled?: boolean; // Whether 2FA is enabled
  backup_codes_remaining?: number; // Number of backup codes left
}

export interface TOTPRequiredResponse {
  requires_totp: boolean;
  username: string;
  message: string;
}
