import test from "node:test";
import assert from "node:assert/strict";

import { createScenario4 } from "../simulation/scenarios.mjs";
import { calculateCpa, geometricRisk } from "../simulation/risk.mjs";
import { DEFAULT_OWN_SHIP_LENGTH_NM } from "../simulation/constants.mjs";

test("calculateCpa returns dimensionless D star and T star", () => {
  const scenario = createScenario4();
  const cpa = calculateCpa(scenario.ownShip, scenario.targetShips[0]);

  assert.equal(scenario.ownShip.lengthNm, DEFAULT_OWN_SHIP_LENGTH_NM);
  assert.equal(cpa.ownShipLengthNm, DEFAULT_OWN_SHIP_LENGTH_NM);
  assert.equal(cpa.dStar, 38.059);
  assert.equal(cpa.tStar, 49.93);
});

test("geometricRisk can use dimensionless CPA inputs", () => {
  const risk = geometricRisk({
    dStar: 22.224,
    tStar: 20.368,
    ownShipLengthNm: DEFAULT_OWN_SHIP_LENGTH_NM,
    ownSpeedNmPerMin: 0.2,
    encounterType: "crossing",
  });

  assert.equal(risk, 0.424);
});
