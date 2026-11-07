import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../../src/adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryProjectRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-repository.js";
import { UploadProjectUseCase } from "../../src/application/use-cases/upload-project.js";
import { Company } from "../../src/domain/entities/company.js";
import { User } from "../../src/domain/entities/user.js";
import { AccesoDenegadoError, ValidacionError } from "../../src/domain/errors.js";
import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { Country } from "../../src/domain/value-objects/country.js";
import { Email } from "../../src/domain/value-objects/email.js";
import { OrganizationType } from "../../src/domain/value-objects/organization-type.js";

const datos = {
  title: " Marketplace ",
  description: "A platform to connect buyers and sellers",
  vertical: "E-commerce",
  businessSectors: ["Product", "IT"],
  projectStage: "MVP",
};

describe("UploadProject", () => {
  const owner = { userId: "user-1", role: "company" } as const;
  let projects: InMemoryProjectRepository;
  let uploadProject: UploadProjectUseCase;

  beforeEach(async () => {
    const companies = new InMemoryCompanyRepository();
    await companies.save(
      Company.create({
        id: "company-1",
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: new Country("Argentina"),
        businessSector: new BusinessSector("IT"),
        organizationType: new OrganizationType("Educational Institute"),
        user: User.create({ id: owner.userId, email: Email.create("ana@ejemplo.com") }),
      }),
    );
    projects = new InMemoryProjectRepository();
    uploadProject = new UploadProjectUseCase(companies, projects, new GeneradorDeIdsUuid());
  });

  it("saves the project under the company of the authenticated user", async () => {
    const project = await uploadProject.execute(owner, datos);

    assert.ok(project.id);
    assert.equal(project.companyId, "company-1");
    assert.equal(project.title, "Marketplace");
    assert.equal(project.vertical.getVertical(), "E-commerce");
    assert.deepEqual(
      project.businessSectors.map((sector) => sector.getSector()),
      ["Product", "IT"],
    );
    assert.equal(project.projectStage.getStage(), "MVP");
    assert.equal(await projects.findById(project.id), project);
  });

  it("rejects a user without the company role and saves nothing", async () => {
    await assert.rejects(
      uploadProject.execute({ userId: owner.userId, role: null }, datos),
      AccesoDenegadoError,
    );
    assert.equal(projects.count(), 0);
  });

  it("rejects a company role whose user has no company and saves nothing", async () => {
    await assert.rejects(
      uploadProject.execute({ userId: "user-without-company", role: "company" }, datos),
      AccesoDenegadoError,
    );
    assert.equal(projects.count(), 0);
  });

  it("rejects invalid data and saves nothing", async () => {
    const cases = [
      { vertical: "Magic" },
      { projectStage: "Beta" },
      { businessSectors: ["Magic"] },
      { businessSectors: [] },
      { title: "  " },
      { description: "  " },
    ];

    for (const override of cases) {
      await assert.rejects(
        uploadProject.execute(owner, { ...datos, ...override }),
        ValidacionError,
        JSON.stringify(override),
      );
    }
    assert.equal(projects.count(), 0);
  });
});
