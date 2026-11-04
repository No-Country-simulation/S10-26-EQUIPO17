import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { InMemoryProjectRepository } from "../../src/adapters/out/persistence/memory/in-memory-project-repository.js";
import { RejectProjectUseCase } from "../../src/application/use-cases/reject-project.js";
import { Project } from "../../src/domain/entities/project.js";
import {
  AccesoDenegadoError,
  ConflictoError,
  NoEncontradoError,
} from "../../src/domain/errors.js";
import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { ProjectStatus } from "../../src/domain/value-objects/project-status.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

const nuevoProyecto = (status?: ProjectStatus) =>
  Project.create({
    id: "project-1",
    companyId: "company-1",
    title: "Marketplace",
    description: "A platform to connect buyers and sellers",
    vertical: new Vertical("E-commerce"),
    businessSectors: [new BusinessSector("IT")],
    projectStage: new ProjectStage("MVP"),
    status,
  });

describe("RejectProject", () => {
  const admin = { userId: "admin-1", role: "admin" } as const;
  let projects: InMemoryProjectRepository;
  let rejectProject: RejectProjectUseCase;

  const estadoGuardado = async () =>
    (await projects.findById("project-1"))?.status.getStatus();

  beforeEach(async () => {
    projects = new InMemoryProjectRepository();
    await projects.save(nuevoProyecto());
    rejectProject = new RejectProjectUseCase(projects);
  });

  it("lets an admin reject a pending project and saves it", async () => {
    const rejected = await rejectProject.execute(admin, "project-1");

    assert.equal(rejected.status.getStatus(), "rejected");
    assert.equal(await estadoGuardado(), "rejected");
  });

  it("rejects users who are not admins and leaves the project pending", async () => {
    for (const user of [
      { userId: "user-1", role: "company" },
      { userId: "user-2", role: null },
    ] as const) {
      await assert.rejects(
        rejectProject.execute(user, "project-1"),
        AccesoDenegadoError,
      );
    }
    assert.equal(await estadoGuardado(), "pending");
  });

  it("rejects an unknown project id", async () => {
    await assert.rejects(
      rejectProject.execute(admin, "no-existe"),
      NoEncontradoError,
    );
  });

  it("rejects a project that was already accepted or rejected", async () => {
    for (const status of [ProjectStatus.APPROVED, ProjectStatus.REJECTED]) {
      await projects.save(nuevoProyecto(status));
      await assert.rejects(
        rejectProject.execute(admin, "project-1"),
        ConflictoError,
      );
      assert.equal(await estadoGuardado(), status.getStatus());
    }
  });
});
