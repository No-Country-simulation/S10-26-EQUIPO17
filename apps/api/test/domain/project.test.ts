import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Project, type ProjectProps } from "../../src/domain/entities/project.js";
import { ValidacionError } from "../../src/domain/errors.js";
import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../../src/domain/value-objects/project-stage.js";
import { Vertical } from "../../src/domain/value-objects/vertical.js";

const props = (): ProjectProps => ({
  id: "project-1",
  title: " Marketplace ",
  description: " A platform to connect buyers and sellers ",
  vertical: new Vertical("E-commerce"),
  businessSectors: [new BusinessSector("Product"), new BusinessSector("IT")],
  projectStage: new ProjectStage("MVP"),
});

describe("Project", () => {
  it("creates a project with trimmed texts and its value objects", () => {
    const project = Project.create(props());

    assert.equal(project.id, "project-1");
    assert.equal(project.title, "Marketplace");
    assert.equal(project.description, "A platform to connect buyers and sellers");
    assert.equal(project.vertical.getVertical(), "E-commerce");
    assert.deepEqual(
      project.businessSectors.map((sector) => sector.getSector()),
      ["Product", "IT"],
    );
    assert.equal(project.projectStage.getStage(), "MVP");
  });

  it("rejects an empty id, title or description", () => {
    for (const field of ["id", "title", "description"] as const) {
      assert.throws(() => Project.create({ ...props(), [field]: "  " }), ValidacionError);
    }
  });

  it("rejects a project without business sectors", () => {
    assert.throws(() => Project.create({ ...props(), businessSectors: [] }), {
      name: ValidacionError.name,
      message: "At least one business sector is required",
    });
  });

  it("accepts every business sector and rejects any other", () => {
    for (const sector of ["Product", "IT", "Marketing", "Software Development"]) {
      assert.equal(new BusinessSector(sector).getSector(), sector);
    }
    assert.throws(() => new BusinessSector("Technology"), {
      name: ValidacionError.name,
      message: "Invalid business sector: Technology",
    });
  });

  it("rejects an invalid vertical", () => {
    assert.throws(() => new Vertical("Magic"), {
      name: ValidacionError.name,
      message: "Invalid vertical: Magic",
    });
  });

  it("accepts every project stage and rejects any other", () => {
    for (const stage of ["MVP", "Idea", "POC", "Scaling", "Legacy"]) {
      assert.equal(new ProjectStage(stage).getStage(), stage);
    }
    assert.throws(() => new ProjectStage("Beta"), {
      name: ValidacionError.name,
      message: "Invalid project stage: Beta",
    });
  });
});
