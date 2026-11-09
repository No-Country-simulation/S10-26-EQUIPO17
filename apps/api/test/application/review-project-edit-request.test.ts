import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { InMemoryProjectRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-repository.js";
import { InMemoryProjectEditRequestRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-edit-request-repository.js";

import { ReviewProjectEditRequestUseCase } from "../../src/application/use-cases/review-project-edit-request.js";

import { Project } from "../../src/domain/entities/project.js";
import { ProjectEditRequest } from "../../src/domain/entities/project-edit-request.js";

import {
  ConflictoError,
  NoEncontradoError,
  AccesoDenegadoError,
} from "../../src/domain/errors.js";

import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

describe("ReviewProjectEditRequest", () => {
  const reviewer = { userId: "reviewer-1", role: "admin" } as const;

  let projects: InMemoryProjectRepository;
  let editRequests: InMemoryProjectEditRequestRepository;
  let reviewRequest: ReviewProjectEditRequestUseCase;

  beforeEach(async () => {
    projects = new InMemoryProjectRepository();
    editRequests = new InMemoryProjectEditRequestRepository(projects);

    const originalProject = Project.create({
      id: "project-1",
      companyId: "company-1",
      title: "Marketplace",
      description: "Original description",
      vertical: new Vertical("E-commerce"),
      businessSectors: [new BusinessSector("IT")],
      projectStage: new ProjectStage("MVP"),
    });

    const proposedProject = Project.create({
      id: "project-1",
      companyId: "company-1",
      title: "Marketplace Plus",
      description: "Updated description",
      vertical: new Vertical("E-commerce"),
      businessSectors: [new BusinessSector("IT")],
      projectStage: new ProjectStage("Scaling"),
    });

    await projects.save(originalProject);

    await editRequests.save(
      ProjectEditRequest.create({
        id: "request-1",
        proposedProject,
        requestedByUserId: "company-user-1",
      }),
    );

    reviewRequest = new ReviewProjectEditRequestUseCase(editRequests);
  });

  it("approves a request and applies the proposed project changes", async () => {
    const result = await reviewRequest.execute(reviewer, "request-1", {
      type: "approve",
    });

    assert.equal(result.status, "approved");
    assert.equal(result.reviewedByUserId, reviewer.userId);

    const updatedProject = await projects.findById("project-1");

    assert.ok(updatedProject);
    assert.equal(updatedProject.title, "Marketplace Plus");
    assert.equal(updatedProject.description, "Updated description");
    assert.equal(updatedProject.projectStage.getStage(), "Scaling");
  });

  it("rejects a request without modifying the original project", async () => {
    const result = await reviewRequest.execute(reviewer, "request-1", {
      type: "reject",
      reason: "Please improve the description",
    });

    assert.equal(result.status, "rejected");
    assert.equal(result.rejectionReason, "Please improve the description");

    const unchangedProject = await projects.findById("project-1");

    assert.ok(unchangedProject);
    assert.equal(unchangedProject.title, "Marketplace");
    assert.equal(unchangedProject.description, "Original description");
    assert.equal(unchangedProject.projectStage.getStage(), "MVP");
  });

  it("rejects a review when the request does not exist", async () => {
    await assert.rejects(
      reviewRequest.execute(reviewer, "unknown-request", {
        type: "approve",
      }),
      NoEncontradoError,
    );
  });
  //ensuring company cannot access reject or approve projects, which is exclusive to admin
  it("rejects companies trying to review edit requests", async () => {
    const company = { userId: "company-user-1", role: "company" } as const;

    await assert.rejects(
      reviewRequest.execute(company, "request-1", {
        type: "approve",
      }),
      AccesoDenegadoError,
    );

    await assert.rejects(
      reviewRequest.execute(company, "request-1", {
        type: "reject",
        reason: "Unauthorized",
      }),
      AccesoDenegadoError,
    );
  });
  it("does not allow an already reviewed request to be approved again", async () => {
    await reviewRequest.execute(reviewer, "request-1", {
      type: "approve",
    });

    await assert.rejects(
      reviewRequest.execute(reviewer, "request-1", {
        type: "approve",
      }),
      ConflictoError,
    );
  });
});
