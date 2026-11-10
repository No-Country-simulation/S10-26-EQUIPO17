import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";

test("connects to the local Supabase database", async () => {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  assert.ok(url, "SUPABASE_URL is required");
  assert.ok(secretKey, "SUPABASE_SECRET_KEY is required");

  const endpoint = new URL(url);

  // Refuse to run against a remote Supabase project.
  assert.equal(endpoint.protocol, "http:");
  assert.ok(
    ["127.0.0.1", "localhost", "[::1]", "host.docker.internal"].includes(
      endpoint.hostname,
    ),
    "Integration tests may only connect to local Supabase",
  );

  const supabase = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase
    .from("project_edit_requests")
    .select("id")
    .limit(1);

  assert.equal(error, null, error?.message);
  assert.equal(
    endpoint.port,
    "54321",
    "Integration tests must use the local Supabase API port",
  );
});
