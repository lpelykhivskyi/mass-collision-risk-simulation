import test from "node:test";
import assert from "node:assert/strict";

import { createAllScenarios, createScenario4 } from "../simulation/scenarios.mjs";
import { simulateScenario } from "../simulation/simulate.mjs";

test("creates all 13 table scenarios", () => {
  const scenarios = createAllScenarios();

  assert.equal(scenarios.length, 13);
  assert.equal(scenarios[0].number, 1);
  assert.equal(scenarios[12].number, 13);
});

test("all scenarios start from low or medium risk", () => {
  const starts = createAllScenarios().map((scenario) => {
    const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
    return rows[0];
  });

  assert.deepEqual(
    starts.map((row) => row.r_total <= 0.6),
    starts.map(() => true),
  );
});

test("scenario 4 reaches table CPA and fuzzy risk values at the final time", () => {
  const scenario = createScenario4();
  const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
  const row = rows.at(-1);

  assert.equal(row.time_min, 20);
  assert.equal(row.dcpa_nm, 0.24);
  assert.equal(row.tcpa_min, 12);
  assert.equal(row.u, 0.38);
  assert.equal(row.r_geom, 0.61);
  assert.equal(row.r_env, 0.62);
  assert.equal(row.r_total, 0.72);
  assert.equal(row.risk_level, "Високий");
});

test("scenario 4 starts away from the final table value", () => {
  const scenario = createScenario4();
  const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
  const row = rows[0];

  assert.notEqual(row.dcpa_nm, 0.24);
  assert.notEqual(row.r_total, 0.72);
});

test("multi-ship scenario 13 preserves critical table result", () => {
  const scenario = createAllScenarios().at(-1);
  const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
  const row = rows.at(-1);

  assert.equal(scenario.targetShips.length, 4);
  assert.equal(row.time_min, 20);
  assert.equal(row.dcpa_nm, 0.15);
  assert.equal(row.tcpa_min, 6);
  assert.equal(row.r_total, 0.92);
  assert.equal(row.risk_level, "Критичний");
});
