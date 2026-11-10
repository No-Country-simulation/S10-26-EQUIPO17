import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ProjectEditRequestRepository } from "../../src/application/ports/out/project-edit-request-repository.js";
import { ListPendingProjectEditRequestsUseCase } from "../../src/application/use-cases/list-pending-project-edit-requests.js";

import { ProjectEditRequest } from "../../src/domain/entities/project-edit-request.js";
import { Project } from "../../src/domain/entities/project.js";
import { AccesoDenegadoError } from "../../src/domain/errors.js";

import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

describe("ListPendingProjectEditRequests", () => {
  const admin = { userId: "admin-1", role: "admin" } as const;
  const company = { userId: "company-1", role: "company" } as const;

  function createRequest(): ProjectEditRequest {
    const project = Project.create({
      id: "project-1",
      companyId: "company-1",
      title: "Marketplace",
      description: "A platform to connect buyers and sellers",
      vertical: new Vertical("E-commerce"),
      businessSectors: [new BusinessSector("IT")],
      projectStage: new ProjectStage("MVP"),
    });

    return ProjectEditRequest.create({
      id: "request-1",
      proposedProject: project,
      requestedByUserId: "company-user-1",
    });
  }

  function createRepository(
    findPending: () => Promise<ProjectEditRequest[]>,
  ): ProjectEditRequestRepository {
    return {
      save: async () => {},
      findById: async () => null,
      findPendingByProjectId: async () => null,
      findPending,
      review: async () => {},
    };
  }

  it("returns pending requests for an admin", async () => {
    const pendingRequest = createRequest();

    const repository = createRepository(async () => [pendingRequest]);
    const useCase = new ListPendingProjectEditRequestsUseCase(repository);

    const result = await useCase.execute(admin);

    assert.deepEqual(result, [pendingRequest]);
  });
  // verifies this: the company user receives an authorization error and the repository is never queried.
  it("rejects a company user without querying the repository", async () => {
    let repositoryWasQueried = false;

    const repository = createRepository(async () => {
      repositoryWasQueried = true;
      return [];
    });

    const useCase = new ListPendingProjectEditRequestsUseCase(repository);

    await assert.rejects(useCase.execute(company), AccesoDenegadoError);

    assert.equal(repositoryWasQueried, false);
  });
});
