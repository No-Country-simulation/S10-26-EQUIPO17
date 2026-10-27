import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CreateCompanyUseCase } from "../../src/application/use-cases/create-company.js";
import { GetCompanyUseCase } from "../../src/application/use-cases/get-company.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../../src/adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { User } from "../../src/domain/entities/user.js";
import { NoEncontradoError, ValidacionError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

const data = {
  firstName: " Ana ",
  lastName: "García",
  jobPosition: "CTO",
  companyName: "Acme",
};

describe("CreateCompany and GetCompany", () => {
  let users: InMemoryUserRepository;
  let createCompany: CreateCompanyUseCase;
  let getCompany: GetCompanyUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    const companies = new InMemoryCompanyRepository();
    createCompany = new CreateCompanyUseCase(companies, users, new GeneradorDeIdsUuid());
    getCompany = new GetCompanyUseCase(companies);
  });

  it("creates a company without a user", async () => {
    const company = await createCompany.execute(data);

    assert.equal(company.firstName, "Ana");
    assert.equal(company.lastName, "García");
    assert.equal(company.jobPosition, "CTO");
    assert.equal(company.companyName, "Acme");
    assert.equal(company.user, null);
    assert.equal(await getCompany.execute(company.id), company);
  });

  it("creates a company linked to an existing user", async () => {
    const user = User.create({
      id: "u-1",
      email: Email.create("ana@ejemplo.com"),
      passwordHash: "hash",
    });
    await users.save(user);

    const company = await createCompany.execute({ ...data, userId: "u-1" });

    assert.equal(company.user, user);
  });

  it("rejects a user that does not exist", async () => {
    await assert.rejects(
      createCompany.execute({ ...data, userId: "no-existe" }),
      NoEncontradoError,
    );
  });

  it("rejects empty required fields", async () => {
    for (const field of ["firstName", "lastName", "jobPosition", "companyName"] as const) {
      await assert.rejects(createCompany.execute({ ...data, [field]: "  " }), ValidacionError);
    }
  });

  it("fails to get a company that does not exist", async () => {
    await assert.rejects(getCompany.execute("no-existe"), NoEncontradoError);
  });
});
