import type { Company } from "../../../domain/entities/company.js";
import type { Session } from "../../../application/ports/in/log-in.js";
import type { User } from "../../../domain/entities/user.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";

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
  country: string;
  businessSector: string;
  interests: string[];
  user: UserResponse | null;
}

export const userToResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email.value,
});

/** Tokens are left out on purpose: they only travel in HttpOnly cookies. */
export interface SessionResponse {
  user: UserResponse & { role: UserRole | null };
}

export const sessionToResponse = (session: Session): SessionResponse => ({
  user: { ...userToResponse(session.user), role: session.role },
});

export const companyToResponse =(company: Company): CompanyResponse => ({
  id: company.id,
  firstName: company.firstName,
  lastName: company.lastName,
  jobPosition: company.jobPosition,
  companyName: company.companyName,
  country: company.country.getCountry(),
  businessSector: company.businessSector.getSector(),
  interests: company.interests.getInterest(),
  user: company.user ? userToResponse(company.user) : null,
});
