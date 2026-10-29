import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { RegisterCompanyUseCase } from "../../src/application/use-cases/register-company.js";
import type { CompanyRepository } from "../../src/application/ports/out/company-repository.js";
import { InMemoryAuthProvider } from "../../src/adapters/out/auth/in-memory-auth-provider.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../../src/adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { ConflictoError, ValidacionError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

const data = {
  email: " Ana@Ejemplo.com ",
  password: "clave-segura",
  firstName: "Ana",
  lastName: "García",
  jobPosition: "CTO",
  companyName: "Acme",
  country: "Argentina",
  businessSector: "Technology",
  interests: ["Evaluate talent in real work experience"],
};

const anaEmail = Email.create("ana@ejemplo.com");

describe("RegisterCompany", () => {
  let users: InMemoryUserRepository;
  let auth: InMemoryAuthProvider;
  let companies: InMemoryCompanyRepository;
  let registerCompany: RegisterCompanyUseCase;

  beforeEach(() => {
    const ids = new GeneradorDeIdsUuid();
    users = new InMemoryUserRepository();
    auth = new InMemoryAuthProvider(users, ids);
    companies = new InMemoryCompanyRepository();
    registerCompany = new RegisterCompanyUseCase(auth, companies, ids);
  });

  it("creates the user with the company role and the company linked to it", async () => {
    const company = await registerCompany.execute(data);

    assert.ok(company.user);
    assert.equal(company.user.email.value, "ana@ejemplo.com");
    assert.equal(company.companyName, "Acme");
    assert.equal(auth.roleOf(company.user.id), "company");
    assert.deepEqual(await users.findById(company.user.id), company.user);
    assert.deepEqual(await companies.findById(company.id), company);
  });

  it("rejects invalid company data without creating the user", async () => {
    await assert.rejects(
      registerCompany.execute({ ...data, country: "Atlantis" }),
      ValidacionError,
    );
    await assert.rejects(registerCompany.execute({ ...data, companyName: " " }), ValidacionError);

    assert.equal(await users.findByEmail(anaEmail), null);
  });

  it("rejects an invalid email or short password without creating the user", async () => {
    await assert.rejects(
      registerCompany.execute({ ...data, email: "not-an-email" }),
      ValidacionError,
    );
    await assert.rejects(registerCompany.execute({ ...data, password: "corta" }), ValidacionError);

    assert.equal(await users.findByEmail(anaEmail), null);
  });

  it("rejects an already registered email", async () => {
    await registerCompany.execute(data);

    await assert.rejects(
      registerCompany.execute({ ...data, email: "ANA@ejemplo.com" }),
      ConflictoError,
    );
  });

  it("removes the created user when the company cannot be saved", async () => {
    const failure = new Error("database down");
    const failingCompanies: CompanyRepository = {
      save: async () => {
        throw failure;
      },
      findById: async () => null,
    };
    registerCompany = new RegisterCompanyUseCase(auth, failingCompanies, new GeneradorDeIdsUuid());

    await assert.rejects(registerCompany.execute(data), failure);

    assert.equal(await users.findByEmail(anaEmail), null);
  });

  it("reports both errors when the user cannot be removed either", async () => {
    const saveFailure = new Error("database down");
    const removeFailure = new Error("auth down");
    auth.remove = async () => {
      throw removeFailure;
    };
    const failingCompanies: CompanyRepository = {
      save: async () => {
        throw saveFailure;
      },
      findById: async () => null,
    };
    registerCompany = new RegisterCompanyUseCase(auth, failingCompanies, new GeneradorDeIdsUuid());

    await assert.rejects(registerCompany.execute(data), (error: AggregateError) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(error.errors, [saveFailure, removeFailure]);
      return true;
    });
  });
});
