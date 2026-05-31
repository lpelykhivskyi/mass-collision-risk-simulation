import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { createScenario } from "../simulation/scenarios.mjs";
import { simulateScenario } from "../simulation/simulate.mjs";
import { saveSvgPlot } from "../simulation/output.mjs";

test("SVG plot does not render a maneuver marker line", () => {
  const scenario = createScenario(6);
  const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
  const filePath = path.join(os.tmpdir(), "scenario-6-marker-test.svg");

  saveSvgPlot(rows, filePath, { maneuverMarker: scenario.maneuverMarker });

  const svg = fs.readFileSync(filePath, "utf8");
  assert.doesNotMatch(svg, /початок безпечного обгону/);
  assert.doesNotMatch(svg, /data-maneuver-time=/);
});

test("SVG plot renders legend outside the plotting area", () => {
  const scenario = createScenario(13);
  const rows = simulateScenario({ scenario, durationMin: 20, stepMin: 1 });
  const filePath = path.join(os.tmpdir(), "scenario-13-legend-test.svg");

  saveSvgPlot(rows, filePath);

  const svg = fs.readFileSync(filePath, "utf8");
  assert.match(svg, /data-plot-right="830"/);
  assert.match(svg, /data-legend="risk-series"/);
  assert.match(svg, /x1="865"/);
});
