import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../../src/adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryProjectRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-repository.js";
import { InMemoryProjectEditRequestRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-edit-request-repository.js";

import { SubmitProjectEditRequestUseCase } from "../../src/application/use-cases/submit-project-edit-request.js";

import { Company } from "../../src/domain/entities/company.js";
import { Project } from "../../src/domain/entities/project.js";
import { User } from "../../src/domain/entities/user.js";

import {
  AccesoDenegadoError,
  ConflictoError,
  NoEncontradoError,
  ValidacionError,
} from "../../src/domain/errors.js";

import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { Country } from "../../src/domain/value-objects/country.js";
import { Email } from "../../src/domain/value-objects/email.js";
import { OrganizationType } from "../../src/domain/value-objects/organization-type.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

describe("SubmitProjectEditRequest", () => {
  const owner = { userId: "user-1", email: "user-1@ejemplo.com", role: "company" } as const;
  const anotherOwner = { userId: "user-2", email: "user-2@ejemplo.com", role: "company" } as const;

  let companies: InMemoryCompanyRepository;
  let projects: InMemoryProjectRepository;
  let editRequests: InMemoryProjectEditRequestRepository;
  let submitRequest: SubmitProjectEditRequestUseCase;
  let originalProject: Project;

  beforeEach(async () => {
    companies = new InMemoryCompanyRepository();
    projects = new InMemoryProjectRepository();
    editRequests = new InMemoryProjectEditRequestRepository(projects);

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

    originalProject = Project.create({
      id: "project-1",
      companyId: "company-1",
      title: "Marketplace",
      description: "An existing marketplace",
      vertical: new Vertical("E-commerce"),
      businessSectors: [new BusinessSector("IT")],
      projectStage: new ProjectStage("MVP"),
    });

    await projects.save(originalProject);

    submitRequest = new SubmitProjectEditRequestUseCase(
      companies,
      projects,
      editRequests,
      new GeneradorDeIdsUuid(),
    );
  });

  it("creates a pending request with the proposed changes", async () => {
    const request = await submitRequest.execute(owner, "project-1", {
      title: "Marketplace Plus",
    });

    assert.equal(request.status, "pending");
    assert.equal(request.proposedProject.title, "Marketplace Plus");
    assert.equal(
      request.proposedProject.description,
      "An existing marketplace",
    );
    assert.equal(request.proposedProject.companyId, "company-1");
  });

  it("preserves the original project until approval", async () => {
    await submitRequest.execute(owner, "project-1", {
      title: "Marketplace Plus",
    });

    const unchanged = await projects.findById("project-1");

    assert.ok(unchanged);
    assert.equal(unchanged.title, "Marketplace");
  });

  it("allows changing multiple fields while preserving the others", async () => {
    const request = await submitRequest.execute(owner, "project-1", {
      title: "Marketplace Plus",
      projectStage: "Scaling",
    });

    assert.equal(request.proposedProject.title, "Marketplace Plus");
    assert.equal(request.proposedProject.projectStage.getStage(), "Scaling");
    assert.equal(
      request.proposedProject.description,
      originalProject.description,
    );
  });

  it("rejects a user without the company role", async () => {
    await assert.rejects(
      submitRequest.execute({ userId: owner.userId, email: owner.email, role: null }, "project-1", {
        title: "New title",
      }),
      AccesoDenegadoError,
    );
  });

  it("rejects a user without an associated company", async () => {
    await assert.rejects(
      submitRequest.execute(
        { userId: "unknown-user", email: "unknown-user@ejemplo.com", role: "company" },
        "project-1",
        { title: "New title" },
      ),
      AccesoDenegadoError,
    );
  });

  it("does not allow a company to request edits to another company's project", async () => {
    await assert.rejects(
      submitRequest.execute(anotherOwner, "project-1", {
        title: "Unauthorized title",
      }),
      NoEncontradoError,
    );
  });

  it("rejects a project that does not exist", async () => {
    await assert.rejects(
      submitRequest.execute(owner, "unknown-project", { title: "New title" }),
      NoEncontradoError,
    );
  });

  it("rejects a request without any proposed changes", async () => {
    await assert.rejects(
      submitRequest.execute(owner, "project-1", {}),
      ValidacionError,
    );
  });
  it("rejects a request when its proposed values do not change the project", async () => {
    await assert.rejects(
      submitRequest.execute(owner, "project-1", {
        title: " Marketplace ",
      }),
      {
        name: ValidacionError.name,
        message: "The proposed changes are identical to the current project",
      },
    );

    const pending = await editRequests.findPendingByProjectId("project-1");
    assert.equal(pending, null);
  });
  it("rejects invalid proposed values", async () => {
    await assert.rejects(
      submitRequest.execute(owner, "project-1", { vertical: "Magic" }),
      ValidacionError,
    );
  });

  it("does not allow a second pending request for the same project", async () => {
    await submitRequest.execute(owner, "project-1", {
      title: "First proposed title",
    });

    await assert.rejects(
      submitRequest.execute(owner, "project-1", {
        title: "Second proposed title",
      }),
      ConflictoError,
    );
  });
});
