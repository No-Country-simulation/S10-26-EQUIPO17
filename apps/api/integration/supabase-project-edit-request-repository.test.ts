import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { Project } from "../src/domain/entities/project.js";
import { ProjectEditRequest } from "../src/domain/entities/project-edit-request.js";
import { ConflictoError, NoEncontradoError } from "../src/domain/errors.js";

import { SupabaseProjectEditRequestRepository } from "../src/adapters/out/persistence/supabase/supabase-project-edit-request-repository.js";
import { BusinessSector } from "../src/domain/value-objects/business-sector.js";
import { ProjectStage } from "../src/domain/value-objects/project-stage.js";
import { Vertical } from "../src/domain/value-objects/vertical.js";

describe("SupabaseProjectEditRequestRepository integration", () => {
  let supabase: SupabaseClient | null = null;
  let repository: SupabaseProjectEditRequestRepository | null = null;

  let userId: string | null = null;
  let companyId: string | null = null;
  const temporaryUserIds = new Set<string>();

  const db = (): SupabaseClient => {
    assert.ok(supabase);
    return supabase;
  };

  const repo = (): SupabaseProjectEditRequestRepository => {
    assert.ok(repository);
    return repository;
  };

  before(async () => {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    assert.ok(url, "SUPABASE_URL is required");
    assert.ok(secretKey, "SUPABASE_SECRET_KEY is required");

    const endpoint = new URL(url);

    // This test must only run against the local Supabase instance.
    assert.equal(endpoint.protocol, "http:");
    assert.equal(endpoint.hostname, "host.docker.internal");
    assert.equal(endpoint.port, "54321");

    supabase = createClient(url, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    repository = new SupabaseProjectEditRequestRepository(supabase);

    // Creating an Auth user triggers the insertion into public.users.
    const { data, error } = await supabase.auth.admin.createUser({
      email: `integration-${randomUUID()}@example.test`,
      password: randomUUID(),
      email_confirm: true,
    });

    if (error) throw error;

    assert.ok(data.user);
    userId = data.user.id;

    companyId = randomUUID();

    const { error: companyError } = await supabase.from("companies").insert({
      id: companyId,
      first_name: "Integration",
      last_name: "Test",
      job_position: "Developer",
      company_name: "Integration Test Company",
      country: "Argentina",
      business_sector: "IT",
      organization_type: "Educational Institute",
      user_id: userId,
    });

    if (companyError) throw companyError;
  });

  after(async () => {
    if (!supabase) return;

    // Delete dependent records before their parent records.
    if (companyId) {
      const { error: requestsError } = await supabase
        .from("project_edit_requests")
        .delete()
        .eq("company_id", companyId);

      if (requestsError) throw requestsError;

      const { error: projectsError } = await supabase
        .from("projects")
        .delete()
        .eq("company_id", companyId);

      if (projectsError) throw projectsError;

      const { error: companyError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (companyError) throw companyError;
    }

    // Removing the Auth user also removes its public.users record.
    if (userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;
    }
    for (const temporaryUserId of temporaryUserIds) {
      const { error } = await supabase.auth.admin.deleteUser(temporaryUserId);

      if (error) throw error;
    }
  });

  async function crearUsuarioTemporal(): Promise<string> {
    const { data, error } = await db().auth.admin.createUser({
      email: `deletion-test-${randomUUID()}@example.test`,
      password: randomUUID(),
      email_confirm: true,
    });

    if (error) throw error;

    assert.ok(data.user);
    temporaryUserIds.add(data.user.id);

    return data.user.id;
  }
  async function crearSolicitud(
    tituloOriginal: string,
    tituloPropuesto: string,
  ) {
    assert.ok(companyId);
    assert.ok(userId);

    const projectId = randomUUID();

    const { error: projectError } = await db()
      .from("projects")
      .insert({
        id: projectId,
        company_id: companyId,
        title: tituloOriginal,
        description: "Integration test project",
        vertical: "E-commerce",
        business_sectors: ["Product", "IT"],
        project_stage: "MVP",
      });

    if (projectError) throw projectError;

    const proposedProject = Project.create({
      id: projectId,
      companyId,
      title: tituloPropuesto,
      description: "Integration test project",
      vertical: new Vertical("E-commerce"),
      businessSectors: [
        new BusinessSector("Product"),
        new BusinessSector("IT"),
      ],
      projectStage: new ProjectStage("MVP"),
    });
    const request = ProjectEditRequest.create({
      id: randomUUID(),
      proposedProject,
      requestedByUserId: userId,
      createdAt: new Date(),
    });

    await repo().save(request);

    return { projectId, request };
  }

  describe("save and find", () => {
    it("saves and retrieves an edit request from the database", async () => {
      const { projectId, request } = await crearSolicitud(
        "Original title",
        "Proposed title",
      );

      const found = await repo().findById(request.id);

      assert.ok(found);
      assert.equal(found.id, request.id);
      assert.equal(found.proposedProject.id, projectId);
      assert.equal(found.status, "pending");
      assert.equal(found.proposedProject.title, "Proposed title");

      const pendingForProject = await repo().findPendingByProjectId(projectId);

      assert.ok(pendingForProject);
      assert.equal(pendingForProject.id, request.id);

      const allPending = await repo().findPending();

      assert.ok(allPending.some((item) => item.id === request.id));
    });

    it("translates a missing project foreign key into NotFound", async () => {
      assert.ok(companyId);
      assert.ok(userId);

      const proposedProject = Project.create({
        id: randomUUID(),
        companyId,
        title: "Project whose database record is missing",
        description: "Foreign key integration test",
        vertical: new Vertical("E-commerce"),
        businessSectors: [
          new BusinessSector("Product"),
          new BusinessSector("IT"),
        ],
        projectStage: new ProjectStage("MVP"),
      });

      const request = ProjectEditRequest.create({
        id: randomUUID(),
        proposedProject,
        requestedByUserId: userId,
      });

      await assert.rejects(repo().save(request), NoEncontradoError);
    });

    it("translates the one-pending-request constraint into Conflict", async () => {
      const { request } = await crearSolicitud(
        "Original title",
        "First proposed title",
      );

      const duplicate = ProjectEditRequest.create({
        id: randomUUID(),
        proposedProject: request.proposedProject,
        requestedByUserId: userId!,
      });

      await assert.rejects(repo().save(duplicate), ConflictoError);
    });
  });

  describe("review", () => {
    it("approves a request and updates the project in the database", async () => {
      const { projectId, request } = await crearSolicitud(
        "Project before approval",
        "Project after approval",
      );

      const reviewedAt = new Date();
      const approvedRequest = request.approve(userId!, reviewedAt);

      await repo().review(approvedRequest);

      const found = await repo().findById(request.id);

      assert.ok(found);
      assert.equal(found.status, "approved");
      assert.equal(found.reviewedByUserId, userId);
      assert.equal(found.reviewedAt?.toISOString(), reviewedAt.toISOString());

      const { data, error } = await db()
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      assert.equal(data.title, "Project after approval");

      // A request that has already been reviewed cannot be reviewed again.
      await assert.rejects(
        () => repo().review(approvedRequest),
        (error: unknown) => error instanceof ConflictoError,
      );
    });

    it("rejects a request without changing the original project", async () => {
      const originalTitle = "Project before rejection";
      const reason = "Changes require further review";

      const { projectId, request } = await crearSolicitud(
        originalTitle,
        "Project that should not be applied",
      );

      const rejectedRequest = request.reject(userId!, reason, new Date());

      await repo().review(rejectedRequest);

      const found = await repo().findById(request.id);

      assert.ok(found);
      assert.equal(found.status, "rejected");
      assert.equal(found.rejectionReason, reason);

      const { data, error } = await db()
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      assert.equal(data.title, originalTitle);
    });
    it("preserves the request when its requester and reviewer accounts are deleted", async () => {
      assert.ok(companyId);

      const requesterId = await crearUsuarioTemporal();
      const reviewerId = await crearUsuarioTemporal();
      const projectId = randomUUID();

      const { error: projectError } = await db()
        .from("projects")
        .insert({
          id: projectId,
          company_id: companyId,
          title: "Project before account deletion",
          description: "Account deletion test",
          vertical: "E-commerce",
          business_sectors: ["Product", "IT"],
          project_stage: "MVP",
        });

      if (projectError) throw projectError;

      const proposedProject = Project.create({
        id: projectId,
        companyId,
        title: "Project after approval",
        description: "Account deletion test",
        vertical: new Vertical("E-commerce"),
        businessSectors: [
          new BusinessSector("Product"),
          new BusinessSector("IT"),
        ],
        projectStage: new ProjectStage("MVP"),
      });

      const request = ProjectEditRequest.create({
        id: randomUUID(),
        proposedProject,
        requestedByUserId: requesterId,
      });

      await repo().save(request);
      await repo().review(request.approve(reviewerId, new Date()));

      // Delete the requester first.
      const { error: requesterError } =
        await db().auth.admin.deleteUser(requesterId);

      if (requesterError) throw requesterError;
      temporaryUserIds.delete(requesterId);

      let found = await repo().findById(request.id);

      assert.ok(found);
      assert.equal(found.status, "approved");
      assert.equal(found.requestedByUserId, null);
      assert.equal(found.reviewedByUserId, reviewerId);
      assert.ok(found.reviewedAt);

      // Now delete the reviewer too.
      const { error: reviewerError } =
        await db().auth.admin.deleteUser(reviewerId);

      if (reviewerError) throw reviewerError;
      temporaryUserIds.delete(reviewerId);

      found = await repo().findById(request.id);

      assert.ok(found);
      assert.equal(found.status, "approved");
      assert.equal(found.requestedByUserId, null);
      assert.equal(found.reviewedByUserId, null);
      assert.ok(found.reviewedAt);
    });
  });
});
