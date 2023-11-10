/**
 * Shape of persisted user data.
 */
export interface SpotifyUserData {
  id: string;
  email: string;
  accessToken: string;
  expires: number;
  refreshToken: string;
  scopes: string;
}


/**
 * Shape of persisted certificate data.
 */
export interface CertificateData {
  commonName: string;
  cert: string;
  key: string;
  expires: number;
}
