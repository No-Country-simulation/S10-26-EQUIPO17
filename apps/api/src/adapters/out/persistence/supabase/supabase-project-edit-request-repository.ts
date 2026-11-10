import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { ProjectEditRequestRepository } from "../../../../application/ports/out/project-edit-request-repository.js";
import type { ProjectEditRequest } from "../../../../domain/entities/project-edit-request.js";

import {
  ConflictoError,
  NoEncontradoError,
  ValidacionError,
} from "../../../../domain/errors.js";

import {
  projectEditRequestToRow,
  rowToProjectEditRequest,
  TEXTO_NO_ES_UUID,
  traducirError,
  type ProjectEditRequestRow,
} from "./filas.js";

const PROJECT_EDIT_REQUEST_COLUMNS =
  "id, project_id, company_id, requested_by_user_id, proposed_title, proposed_description, proposed_vertical, proposed_business_sectors, proposed_project_stage, status, created_at, reviewed_by_user_id, reviewed_at, rejection_reason";

function traducirErrorEditRequest(error: PostgrestError): Error {
  if (error.code === "23505") {
    return new ConflictoError(
      "A pending edit request already exists for this project",
    );
  }

  if (error.code === "23503") {
    return new NoEncontradoError(
      "The project, company, or requesting user no longer exists",
    );
  }

  if (error.code === "P0002") {
    return new NoEncontradoError("Project edit request not found");
  }

  if (error.code === "P0001") {
    if (error.message === "PROJECT_EDIT_REQUEST_ALREADY_REVIEWED") {
      return new ConflictoError(
        "This project edit request has already been reviewed",
      );
    }

    if (error.message === "ORIGINAL_PROJECT_NOT_FOUND") {
      return new NoEncontradoError("Original project not found");
    }
  }

  if (error.code === "22023") {
    return new ValidacionError(error.message);
  }

  return traducirError(error);
}

export class SupabaseProjectEditRequestRepository implements ProjectEditRequestRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(request: ProjectEditRequest): Promise<void> {
    const { error } = await this.supabase
      .from("project_edit_requests")
      .insert(projectEditRequestToRow(request));

    if (error) throw traducirErrorEditRequest(error);
  }

  async findById(id: string): Promise<ProjectEditRequest | null> {
    const { data, error } = await this.supabase
      .from("project_edit_requests")
      .select(PROJECT_EDIT_REQUEST_COLUMNS)
      .eq("id", id)
      .maybeSingle<ProjectEditRequestRow>();

    if (error?.code === TEXTO_NO_ES_UUID) return null;

    if (error) throw traducirErrorEditRequest(error);

    return data ? rowToProjectEditRequest(data) : null;
  }

  async findPendingByProjectId(
    projectId: string,
  ): Promise<ProjectEditRequest | null> {
    const { data, error } = await this.supabase
      .from("project_edit_requests")
      .select(PROJECT_EDIT_REQUEST_COLUMNS)
      .eq("project_id", projectId)
      .eq("status", "pending")
      .maybeSingle<ProjectEditRequestRow>();

    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirErrorEditRequest(error);

    return data ? rowToProjectEditRequest(data) : null;
  }

  async findPending(): Promise<ProjectEditRequest[]> {
    const { data, error } = await this.supabase
      .from("project_edit_requests")
      .select(PROJECT_EDIT_REQUEST_COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .overrideTypes<ProjectEditRequestRow[], { merge: false }>();

    if (error) throw traducirErrorEditRequest(error);

    return (data ?? []).map(rowToProjectEditRequest);
  }

  async review(request: ProjectEditRequest): Promise<void> {
    if (
      request.status === "pending" ||
      !request.reviewedByUserId ||
      !request.reviewedAt
    ) {
      throw new ConflictoError(
        "A reviewed request with reviewer information is required",
      );
    }

    const { error } = await this.supabase.rpc("review_project_edit_request", {
      p_request_id: request.id,
      p_reviewer_id: request.reviewedByUserId,
      p_decision: request.status === "approved" ? "approve" : "reject",
      p_reviewed_at: request.reviewedAt.toISOString(),
      p_rejection_reason: request.rejectionReason,
    });

    if (error) throw traducirErrorEditRequest(error);
  }
}
