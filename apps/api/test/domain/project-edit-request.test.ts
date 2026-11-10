import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Project } from "../../src/domain/entities/project.js";
import { ProjectEditRequest } from "../../src/domain/entities/project-edit-request.js";
import { ConflictoError, ValidacionError } from "../../src/domain/errors.js";

import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

function createProject(): Project {
  return Project.create({
    id: "project-1",
    companyId: "company-1",
    title: "Marketplace Plus",
    description: "An improved marketplace",
    vertical: new Vertical("E-commerce"),
    businessSectors: [new BusinessSector("IT")],
    projectStage: new ProjectStage("Scaling"),
  });
}

function createRequest(): ProjectEditRequest {
  return ProjectEditRequest.create({
    id: "request-1",
    proposedProject: createProject(),
    requestedByUserId: "user-1",
    createdAt: new Date("2026-11-07T12:00:00Z"),
  });
}

describe("ProjectEditRequest", () => {
  it("creates a pending edit request", () => {
    const request = createRequest();

    assert.equal(request.id, "request-1");
    assert.equal(request.status, "pending");
    assert.equal(request.proposedProject.title, "Marketplace Plus");
    assert.equal(request.reviewedByUserId, null);
    assert.equal(request.reviewedAt, null);
  });

  it("approves a pending request", () => {
    const request = createRequest();

    const approved = request.approve(
      "organizer-1",
      new Date("2026-11-08T12:00:00Z"),
    );

    assert.equal(approved.status, "approved");
    assert.equal(approved.reviewedByUserId, "organizer-1");
    assert.ok(approved.reviewedAt);
    assert.equal(request.status, "pending");
  });

  it("rejects a pending request and records the reason", () => {
    const request = createRequest();

    const rejected = request.reject(
      "organizer-1",
      "Please correct the project description",
      new Date("2026-11-08T12:00:00Z"),
    );

    assert.equal(rejected.status, "rejected");
    assert.equal(
      rejected.rejectionReason,
      "Please correct the project description",
    );
    assert.equal(request.status, "pending");
  });

  it("does not allow an already reviewed request to be approved again", () => {
    const approved = createRequest().approve("organizer-1");

    assert.throws(() => approved.approve("organizer-2"), ConflictoError);
  });

  it("does not allow an already reviewed request to be rejected", () => {
    const rejected = createRequest().reject("organizer-1");

    assert.throws(() => rejected.reject("organizer-2"), ConflictoError);
  });
  it("rejects an invalid creation date", () => {
    assert.throws(
      () =>
        ProjectEditRequest.create({
          id: "request-1",
          proposedProject: createProject(),
          requestedByUserId: "user-1",
          createdAt: new Date("invalid"),
        }),
      {
        name: ValidacionError.name,
        message: "Invalid request creation date",
      },
    );
  });

  it("preserves a reviewed request after its requester and reviewer are deleted", () => {
    const request = ProjectEditRequest.create({
      id: "request-1",
      proposedProject: createProject(),
      requestedByUserId: null,
      status: "approved",
      reviewedByUserId: null,
      reviewedAt: new Date("2026-11-09T12:00:00Z"),
    });

    assert.equal(request.status, "approved");
    assert.equal(request.requestedByUserId, null);
    assert.equal(request.reviewedByUserId, null);
    assert.ok(request.reviewedAt);
  });

  it("rejects an invalid review date", () => {
    assert.throws(
      () =>
        ProjectEditRequest.create({
          id: "request-1",
          proposedProject: createProject(),
          requestedByUserId: "user-1",
          status: "approved",
          reviewedByUserId: "admin-1",
          reviewedAt: new Date("invalid"),
        }),
      {
        name: ValidacionError.name,
        message: "Invalid request review date",
      },
    );
  });

  it("rejects invalid review information", () => {
    assert.throws(
      () =>
        ProjectEditRequest.create({
          id: "request-1",
          proposedProject: createProject(),
          requestedByUserId: "user-1",
          status: "approved",
        }),
      ValidacionError,
    );
  });
});
