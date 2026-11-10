import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

import {
  crearDependencias,
  crearCasosDeUso,
} from "../src/infrastructure/container.js";
import type { Config } from "../src/infrastructure/config/env.js";
import { crearApp } from "../src/infrastructure/http/app.js";
import { crearClienteSupabase } from "../src/infrastructure/supabase/client.js";

describe("HTTP + Supabase integration: project edit requests", () => {
  let server: Server;
  let base: string;
  let cookie: string;
  let adminCookie: string;

  let companyId: string | null = null;
  let userId: string | null = null;
  let adminUserId: string | null = null;

  let cleanupSupabase: ReturnType<typeof crearClienteSupabase> | null = null;

  const proyectoBase = {
    description: "HTTP integration test project",
    vertical: "E-commerce",
    businessSectors: ["Product", "IT"],
    projectStage: "MVP",
  };

  async function comprobarEstado(
    response: Response,
    esperado: number,
  ): Promise<void> {
    if (response.status !== esperado) {
      throw new Error(
        `Expected HTTP ${esperado}, received ${response.status}: ${await response.text()}`,
      );
    }
  }

  async function subirProyecto(title: string): Promise<string> {
    const response = await fetch(`${base}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ ...proyectoBase, title }),
    });

    await comprobarEstado(response, 201);

    const project = (await response.json()) as { id: string };
    assert.ok(project.id);

    return project.id;
  }

  async function solicitarEdicion(projectId: string, title: string) {
    const response = await fetch(
      `${base}/projects/${projectId}/edit-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ title }),
      },
    );

    await comprobarEstado(response, 201);

    return (await response.json()) as {
      id: string;
      projectId: string;
      status: string;
      proposedProject: { title: string };
    };
  }

  async function obtenerProyecto(projectId: string) {
    const response = await fetch(`${base}/projects`, {
      headers: { Cookie: cookie },
    });

    await comprobarEstado(response, 200);

    const projects = (await response.json()) as Array<{
      id: string;
      title: string;
      description: string;
      vertical: string;
      businessSectors: string[];
      projectStage: string;
    }>;

    const project = projects.find((item) => item.id === projectId);
    assert.ok(
      project,
      `Project ${projectId} was not returned by GET /projects`,
    );

    return project;
  }

  before(async () => {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    assert.ok(url, "SUPABASE_URL is required");
    assert.ok(secretKey, "SUPABASE_SECRET_KEY is required");

    const endpoint = new URL(url);

    // only starts the API against the local Supabase instance.
    assert.equal(endpoint.protocol, "http:");
    assert.equal(endpoint.hostname, "host.docker.internal");
    assert.equal(endpoint.port, "54321");

    const config: Config = {
      puerto: 0,
      persistencia: "supabase",
      supabase: { url, claveSecreta: secretKey },
      // This is a local HTTP test; production cookie settings are not changed.
      cookies: { secure: false, sameSite: "lax" },
    };

    cleanupSupabase = crearClienteSupabase(url, secretKey);

    const dependencies = crearDependencias(config);
    const app = crearApp(crearCasosDeUso(dependencies), config);

    server = app.listen(0);

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.once("listening", resolve);
    });

    const address = server.address();
    assert.ok(address && typeof address !== "string");

    base = `http://127.0.0.1:${(address as AddressInfo).port}/api`;

    // Register a company through the real API and creates its Auth user.
    const email = `http-integration-${randomUUID()}@example.test`;

    const registration = await fetch(`${base}/companies/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "LocalIntegration#2026",
        firstName: "HTTP",
        lastName: "Integration",
        jobPosition: "Developer",
        companyName: "HTTP Integration Company",
        country: "Argentina",
        businessSector: "IT",
        organizationType: "Educational Institute",
      }),
    });

    await comprobarEstado(registration, 201);

    const company = (await registration.json()) as {
      id: string;
      user: { id: string };
    };

    assert.ok(company.id);
    assert.ok(company.user?.id);

    companyId = company.id;
    userId = company.user.id;

    // Logs through the real API and extract the access cookie.
    const login = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "LocalIntegration#2026",
      }),
    });

    await comprobarEstado(login, 200);

    const accessCookie = login.headers
      .getSetCookie()
      .find((value) => value.startsWith("access_token="))
      ?.split(";")[0];

    assert.ok(accessCookie);
    cookie = accessCookie;
    // Creates a separate admin using the Auth Admin API.
    const adminEmail = `http-admin-${randomUUID()}@example.test`;
    const adminPassword = "LocalAdminIntegration#2026";

    const { data: adminData, error: adminError } =
      await cleanupSupabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });

    if (adminError) throw adminError;

    assert.ok(adminData.user);
    adminUserId = adminData.user.id;

    // Obtains the admin's session through the HTTP login route.
    const adminLogin = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    await comprobarEstado(adminLogin, 200);

    // Diagnostic: verify Supabase returned the expected administrator.
    const adminSession = (await adminLogin.json()) as {
      user: { id: string; role: string | null };
    };

    assert.equal(adminSession.user.id, adminUserId);
    assert.equal(adminSession.user.role, "admin");

    // Extract the administrator's access cookie.
    const adminAccessCookie = adminLogin.headers
      .getSetCookie()
      .find((value) => value.startsWith("access_token="))
      ?.split(";")[0];

    assert.ok(adminAccessCookie);
    adminCookie = adminAccessCookie;
  });

  after(async () => {
    const errors: unknown[] = [];

    if (server) {
      await new Promise<void>((resolve) => {
        server.close((error) => {
          if (error) errors.push(error);
          resolve();
        });
      });
    }

    // cleans up edit requests and projects from a deleted company
    if (cleanupSupabase && companyId) {
      const { error } = await cleanupSupabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (error) errors.push(error);
    }

    // removes the Auth user after its company and dependent records are gone.
    if (cleanupSupabase && adminUserId) {
      const { error } =
        await cleanupSupabase.auth.admin.deleteUser(adminUserId);

      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, "HTTP integration test cleanup failed");
    }
  });

  it("submits an edit request over HTTP without changing the original project", async () => {
    const projectId = await subirProyecto("Project before submission");

    const request = await solicitarEdicion(
      projectId,
      "Project with proposed title",
    );

    assert.equal(request.projectId, projectId);
    assert.equal(request.status, "pending");
    assert.equal(request.proposedProject.title, "Project with proposed title");

    const original = await obtenerProyecto(projectId);
    assert.equal(original.title, "Project before submission");
  });

  it("approves an edit request over HTTP and updates the project", async () => {
    const projectId = await subirProyecto("Project before HTTP approval");

    const request = await solicitarEdicion(
      projectId,
      "Project after HTTP approval",
    );

    // First, try to approve as the company.
    const unauthorized = await fetch(
      `${base}/project-edit-requests/${request.id}/approve`,
      {
        method: "POST",
        headers: { Cookie: cookie },
      },
    );

    assert.equal(unauthorized.status, 403);

    const unchanged = await obtenerProyecto(projectId);
    assert.equal(unchanged.title, "Project before HTTP approval");

    // Then approve as the administrator.
    const approval = await fetch(
      `${base}/project-edit-requests/${request.id}/approve`,
      {
        method: "POST",
        headers: { Cookie: adminCookie },
      },
    );

    await comprobarEstado(approval, 200);

    const reviewed = (await approval.json()) as {
      status: string;
      reviewedByUserId: string | null;
    };

    assert.equal(reviewed.status, "approved");
    assert.equal(reviewed.reviewedByUserId, adminUserId);

    const updated = await obtenerProyecto(projectId);
    assert.equal(updated.title, "Project after HTTP approval");
  });

  it("rejects an edit request over HTTP and preserves the original project", async () => {
    const originalTitle = "Project before HTTP rejection";
    const reason = "Please provide more information";

    const projectId = await subirProyecto(originalTitle);

    const request = await solicitarEdicion(
      projectId,
      "Project that must not be applied",
    );
    const unauthorized = await fetch(
      `${base}/project-edit-requests/${request.id}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ reason: "Unauthorized" }),
      },
    );

    assert.equal(unauthorized.status, 403);
    const rejection = await fetch(
      `${base}/project-edit-requests/${request.id}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ reason }),
      },
    );

    await comprobarEstado(rejection, 200);

    const reviewed = (await rejection.json()) as {
      status: string;
      rejectionReason: string | null;
    };

    assert.equal(reviewed.status, "rejected");
    assert.equal(reviewed.rejectionReason, reason);

    const unchanged = await obtenerProyecto(projectId);
    assert.equal(unchanged.title, originalTitle);
  });
});
