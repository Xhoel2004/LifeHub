export interface UserResponse {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  email: string;
}
