// Forma de las filas en Postgres (ver supabase/migrations) y su traducción a entidades.
// El dominio no conoce nombres de columnas: eso queda encerrado acá.
import type { PostgrestError } from "@supabase/supabase-js";
import { BusinessSector } from "../../../../domain/value-objects/business-sector.js";
import { Company } from "../../../../domain/entities/company.js";
import { Country } from "../../../../domain/value-objects/country.js";
import { ExplorationInterest } from "../../../../domain/value-objects/exploration-interest.js";
import { User } from "../../../../domain/entities/user.js";
import { ConflictoError } from "../../../../domain/errors.js";
import { Email } from "../../../../domain/value-objects/email.js";

export interface UserRow {
  id: string;
  email: string;
}

export interface CompanyRow {
  id: string;
  first_name: string;
  last_name: string;
  job_position: string;
  company_name: string;
  country: string;
  business_sector: string;
  interests: string[];
  user_id: string | null;
}

export type CompanyWithUserRow = Omit<CompanyRow, "user_id"> & {
  user: UserRow | null;
};

export const USER_COLUMNS = "id, email";
export const COMPANY_WITH_USER_COLUMNS = `id, first_name, last_name, job_position, company_name, country, business_sector, interests, user:users(${USER_COLUMNS})`;

export const rowToUser = (row: UserRow): User =>
  User.create({
    id: row.id,
    email: Email.create(row.email),
  });

export const companyToRow = (company: Company): CompanyRow => ({
  id: company.id,
  first_name: company.firstName,
  last_name: company.lastName,
  job_position: company.jobPosition,
  company_name: company.companyName,
  country: company.country.getCountry(),
  business_sector: company.businessSector.getSector(),
  interests: company.interests.getInterest(),
  user_id: company.user?.id ?? null,
});

export const rowToCompany = (row: CompanyWithUserRow): Company =>
  Company.create({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    jobPosition: row.job_position,
    companyName: row.company_name,
    country: new Country(row.country),
    businessSector: new BusinessSector(row.business_sector),
    interests: new ExplorationInterest(row.interests),
    user: row.user ? rowToUser(row.user) : null,
  });

// Códigos de error de Postgres que el adaptador traduce.
const VIOLACION_UNICA = "23505";
export const TEXTO_NO_ES_UUID = "22P02";

export function traducirError(error: PostgrestError): Error {
  if (error.code === VIOLACION_UNICA) {
    return new ConflictoError("El registro ya existe");
  }
  return new Error(`Supabase: ${error.message}`, { cause: error });
}
