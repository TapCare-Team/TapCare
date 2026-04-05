import test from "node:test";
import assert from "node:assert/strict";

const PREFIX_BY_TYPE = {
  EMERGENCY_CONTACT: "EC",
  FREQUENT_CONTACT: "FC",
  CHECKLIST_REMINDER: "CL",
  HELP_PROFILE: "HP",
  CURATED_RESOURCES: "RS"
};

function buildDisplayCodeCandidate(stickerType, serialNumber) {
  return `${PREFIX_BY_TYPE[stickerType]}-${serialNumber.toString().padStart(4, "0")}`;
}

test("uses a predictable prefix for each sticker type", () => {
  assert.equal(buildDisplayCodeCandidate("EMERGENCY_CONTACT", 7), "EC-0007");
  assert.equal(buildDisplayCodeCandidate("FREQUENT_CONTACT", 12), "FC-0012");
  assert.equal(buildDisplayCodeCandidate("CHECKLIST_REMINDER", 1), "CL-0001");
  assert.equal(buildDisplayCodeCandidate("HELP_PROFILE", 24), "HP-0024");
  assert.equal(buildDisplayCodeCandidate("CURATED_RESOURCES", 103), "RS-0103");
});
