import type { User } from "../../../domain/entities/user.js";

export interface RegisterUserData {
  email: string;
  password: string;
}

export interface RegisterUser {
  execute(data: RegisterUserData): Promise<User>;
}
