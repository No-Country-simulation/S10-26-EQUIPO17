import type { Company } from "../../../domain/entities/company.js";
import type { User } from "../../../domain/entities/user.js";

// DTOs de salida. El password (aunque esté hasheado) nunca sale de la API.
export interface UserResponse {
  id: string;
  email: string;
}

export interface CompanyResponse {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  user: UserResponse | null;
}

export const userToResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email.value,
});

export const companyToResponse = (company: Company): CompanyResponse => ({
  id: company.id,
  firstName: company.firstName,
  lastName: company.lastName,
  jobPosition: company.jobPosition,
  companyName: company.companyName,
  user: company.user ? userToResponse(company.user) : null,
});
