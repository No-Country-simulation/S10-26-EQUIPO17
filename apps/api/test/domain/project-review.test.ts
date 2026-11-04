import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Project, type ProjectProps } from "../../src/domain/entities/project.js";
import { ConflictoError } from "../../src/domain/errors.js";
import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { ProjectStatus } from "../../src/domain/value-objects/project-status.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

const props = (): ProjectProps => ({
  id: "project-1",
  companyId: "company-1",
  title: "Marketplace",
  description: "A platform to connect buyers and sellers",
  vertical: new Vertical("E-commerce"),
  businessSectors: [new BusinessSector("IT")],
  projectStage: new ProjectStage("MVP"),
});

describe("Project review", () => {
  it("starts as pending", () => {
    assert.equal(Project.create(props()).status.getStatus(), "pending");
  });

  it("approve returns an approved copy and leaves the original pending", () => {
    const project = Project.create(props());
    const approved = project.approve();

    assert.notEqual(approved, project);
    assert.equal(approved.status.getStatus(), "approved");
    assert.equal(project.status.getStatus(), "pending");
    assert.equal(approved.id, project.id);
    assert.equal(approved.title, project.title);
  });

  it("rejects approving a project that was already reviewed", () => {
    for (const status of [ProjectStatus.APPROVED, ProjectStatus.REJECTED]) {
      assert.throws(() => Project.create({ ...props(), status }).approve(), {
        name: ConflictoError.name,
        message: `Project already reviewed (status: ${status.getStatus()})`,
      });
    }
  });

  it("reject returns a rejected copy and leaves the original pending", () => {
    const project = Project.create(props());
    const rejected = project.reject();

    assert.notEqual(rejected, project);
    assert.equal(rejected.status.getStatus(), "rejected");
    assert.equal(project.status.getStatus(), "pending");
    assert.equal(rejected.id, project.id);
  });

  it("rejects rejecting a project that was already reviewed", () => {
    for (const status of [ProjectStatus.APPROVED, ProjectStatus.REJECTED]) {
      assert.throws(() => Project.create({ ...props(), status }).reject(), {
        name: ConflictoError.name,
        message: `Project already reviewed (status: ${status.getStatus()})`,
      });
    }
  });
});