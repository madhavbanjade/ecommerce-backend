export interface AuthResponseDto {
  id: string;
  name: string | null;
  email: string;
  access_token: string;
  refresh_token: string;
}
