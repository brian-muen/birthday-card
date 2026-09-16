import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, parseEmail, verifyPassword } from "../lib/password.ts";
import { createdMasterToken, safeNextPath } from "../lib/safe-next-path.ts";

test("parseEmail lowercases and rejects junk", () => {
  assert.equal(parseEmail("  Ada@Example.com "), "ada@example.com");
  assert.equal(parseEmail("not-an-email"), null);
  assert.equal(parseEmail("a@b"), null);
  assert.equal(parseEmail(""), null);
});

test("hashPassword verifies the same password and rejects another", async () => {
  const stored = await hashPassword("correct horse");
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong password", stored), false);
  assert.equal(await verifyPassword("correct horse", "not-a-hash"), false);
});

test("safeNextPath stays on this site", () => {
  assert.equal(safeNextPath("/cards"), "/cards");
  assert.equal(safeNextPath("/created/abc"), "/created/abc");
  assert.equal(safeNextPath("https://evil.example/"), "/cards");
  assert.equal(safeNextPath("//evil.example"), "/cards");
  assert.equal(safeNextPath("/\\evil"), "/cards");
  assert.equal(safeNextPath(null), "/cards");
});

test("createdMasterToken only accepts a 24-character token path", () => {
  assert.equal(
    createdMasterToken("/created/23456789abcdefghjkmnprst"),
    "23456789abcdefghjkmnprst",
  );
  assert.equal(createdMasterToken("/created/short"), null);
  assert.equal(createdMasterToken("/cards"), null);
});
