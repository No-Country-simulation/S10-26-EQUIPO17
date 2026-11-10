import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { InMemoryCompanyRepository } from "../../src/adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryProjectRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-repository.js";

import { ListProjectsUseCase } from "../../src/application/use-cases/list-projects.js";

import { Company } from "../../src/domain/entities/company.js";
import { Project } from "../../src/domain/entities/project.js";
import { User } from "../../src/domain/entities/user.js";

import { AccesoDenegadoError } from "../../src/domain/errors.js";

import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { Country } from "../../src/domain/value-objects/country.js";
import { Email } from "../../src/domain/value-objects/email.js";
import { OrganizationType } from "../../src/domain/value-objects/organization-type.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

describe("ListProjects", () => {
  const owner = { userId: "user-1", role: "company" } as const;
  const anotherOwner = { userId: "user-2", role: "company" } as const;

  let companies: InMemoryCompanyRepository;
  let projects: InMemoryProjectRepository;
  let listProjects: ListProjectsUseCase;

  beforeEach(async () => {
    companies = new InMemoryCompanyRepository();
    projects = new InMemoryProjectRepository();

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
        user: User.create({
          id: owner.userId,
          email: Email.create("ana@ejemplo.com"),
        }),
      }),
    );

    await companies.save(
      Company.create({
        id: "company-2",
        firstName: "Juan",
        lastName: "Pérez",
        jobPosition: "CEO",
        companyName: "Other Company",
        country: new Country("Argentina"),
        businessSector: new BusinessSector("Product"),
        organizationType: new OrganizationType("Educational Institute"),
        user: User.create({
          id: anotherOwner.userId,
          email: Email.create("juan@ejemplo.com"),
        }),
      }),
    );

    listProjects = new ListProjectsUseCase(companies, projects);
  });

  function createProject(id: string, companyId: string): Project {
    return Project.create({
      id,
      companyId,
      title: `Project ${id}`,
      description: "Test project",
      vertical: new Vertical("E-commerce"),
      businessSectors: [new BusinessSector("IT")],
      projectStage: new ProjectStage("MVP"),
    });
  }

  it("lists only the projects belonging to the authenticated company", async () => {
    await projects.save(createProject("project-1", "company-1"));
    await projects.save(createProject("project-2", "company-1"));
    await projects.save(createProject("project-3", "company-2"));

    const result = await listProjects.execute(owner);

    assert.deepEqual(
      result.map((project) => project.id),
      ["project-1", "project-2"],
    );
  });

  it("returns an empty list when the company has no projects", async () => {
    const result = await listProjects.execute(owner);

    assert.deepEqual(result, []);
  });

  it("rejects a user without the company role", async () => {
    await assert.rejects(
      listProjects.execute({ userId: owner.userId, role: null }),
      AccesoDenegadoError,
    );
  });

  it("rejects a company role whose user has no associated company", async () => {
    await assert.rejects(
      listProjects.execute({
        userId: "user-without-company",
        role: "company",
      }),
      AccesoDenegadoError,
    );
  });
});
