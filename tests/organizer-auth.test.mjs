import assert from "node:assert/strict";
import test from "node:test";

import { parseEmail, profileFromGoogleIdentity } from "../lib/email.ts";
import { createdMasterToken, safeNextPath } from "../lib/safe-next-path.ts";

test("parseEmail lowercases and rejects junk", () => {
  assert.equal(parseEmail("  Ada@Example.com "), "ada@example.com");
  assert.equal(parseEmail("not-an-email"), null);
  assert.equal(parseEmail("a@b"), null);
  assert.equal(parseEmail(""), null);
});

test("safeNextPath stays on this site", () => {
  assert.equal(safeNextPath("/cards"), "/cards");
  assert.equal(safeNextPath("/created/abc"), "/created/abc");
  assert.equal(safeNextPath("https://evil.example/"), "/?sent=1");
  assert.equal(safeNextPath("//evil.example"), "/?sent=1");
  assert.equal(safeNextPath("/\\evil"), "/?sent=1");
  assert.equal(safeNextPath(null), "/?sent=1");
  assert.equal(safeNextPath("/\t//evil.com"), "/?sent=1");
  assert.equal(safeNextPath("/%09//evil.com"), "/?sent=1");
  assert.equal(safeNextPath("/account"), "/?sent=1");
  assert.equal(safeNextPath("/account?next=/cards"), "/?sent=1");
});

test("profileFromGoogleIdentity keeps a Google email even if verified is missing", () => {
  assert.deepEqual(
    profileFromGoogleIdentity({
      sub: "google-sub-1",
      email: "Ada@Example.com",
    }),
    { ok: true, googleSub: "google-sub-1", email: "ada@example.com" },
  );
  assert.deepEqual(
    profileFromGoogleIdentity({
      sub: "google-sub-1",
      email: "ada@example.com",
      email_verified: "true",
    }),
    { ok: true, googleSub: "google-sub-1", email: "ada@example.com" },
  );
  assert.deepEqual(profileFromGoogleIdentity({ sub: "google-sub-1" }), {
    ok: false,
    reason: "profile",
  });
  assert.deepEqual(profileFromGoogleIdentity({ email: "ada@example.com" }), {
    ok: false,
    reason: "profile",
  });
});

test("createdMasterToken only accepts a 24-character token path", () => {
  assert.equal(
    createdMasterToken("/created/23456789abcdefghjkmnprst"),
    "23456789abcdefghjkmnprst",
  );
  assert.equal(createdMasterToken("/created/short"), null);
  assert.equal(createdMasterToken("/cards"), null);
});
