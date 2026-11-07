import type { User } from "../../../domain/entities/user.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";

export interface LogInData {
  email: string;
  password: string;
}

export interface Session {
  user: User;
  /** Lets the frontend pick what to show; authorization still happens in the API. */
  role: UserRole | null;
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

export interface LogIn {
  execute(data: LogInData): Promise<Session>;
}
