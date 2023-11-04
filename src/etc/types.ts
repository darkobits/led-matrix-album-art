/**
 * Shape of user data stored in DynamoDB.
 */
export interface SpotifyUserData {
  id: string;
  email: string;
  accessToken: string;
  expires: number;
  refreshToken: string;
  scopes: string;
}
