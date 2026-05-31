import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { createAllScenarios } from "../simulation/scenarios.mjs";
import { simulateScenario } from "../simulation/simulate.mjs";
import { saveScenarioComparisonPlot } from "../simulation/comparisonPlot.mjs";

test("comparison plot renders selected scenario Rtotal lines", () => {
  const selectedNumbers = [1, 4, 6, 8, 13];
  const scenarios = createAllScenarios().filter((scenario) =>
    selectedNumbers.includes(scenario.number),
  );
  const series = scenarios.map((scenario) => ({
    scenario,
    rows: simulateScenario({ scenario, durationMin: 20, stepMin: 1 }),
  }));
  const filePath = path.join(os.tmpdir(), "scenario-comparison-test.svg");

  saveScenarioComparisonPlot(series, filePath);

  const svg = fs.readFileSync(filePath, "utf8");
  assert.match(svg, /Порівняння динаміки R/);
  assert.match(svg, /Сц\. 1/);
  assert.match(svg, /Сц\. 13/);
  assert.match(svg, /R = 0\.80/);
  assert.match(svg, /data-scenario-number="6"/);
});
