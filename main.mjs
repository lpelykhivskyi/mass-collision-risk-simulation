import fs from "node:fs";
import path from "node:path";

import { simulateScenario } from "./simulation/simulate.mjs";
import { createAllScenarios } from "./simulation/scenarios.mjs";
import { saveCsv, saveSvgPlot, printPreview } from "./simulation/output.mjs";
import { saveScenarioComparisonPlot } from "./simulation/comparisonPlot.mjs";

function main() {
  const outputDir = path.join(process.cwd(), "simulation_results");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const scenarios = createAllScenarios();
  const combinedResults = [];
  const scenarioSeries = [];

  scenarios.forEach((scenario, index) => {
    const rows = simulateScenario({
      scenario,
      durationMin: 20,
      stepMin: 1,
    });

    combinedResults.push(...rows);
    scenarioSeries.push({ scenario, rows });

    const csvPath = path.join(outputDir, `scenario_${index + 1}_results.csv`);
    const svgPath = path.join(outputDir, `scenario_${index + 1}_risk_plot.svg`);

    saveCsv(rows, csvPath);
    saveSvgPlot(rows, svgPath);

    console.log("\n" + "=".repeat(100));
    console.log(scenario.name);
    console.log(scenario.description);
    console.log("=".repeat(100));
    printPreview(rows);
    console.log(`CSV saved to: ${csvPath}`);
    console.log(`SVG plot saved to: ${svgPath}`);
  });

  const combinedPath = path.join(outputDir, "combined_results.csv");
  saveCsv(combinedResults, combinedPath);

  const representativeScenarioNumbers = new Set([1, 4, 6, 8, 13]);
  const comparisonPath = path.join(outputDir, "representative_scenarios_comparison.svg");
  saveScenarioComparisonPlot(
    scenarioSeries.filter(({ scenario }) =>
      representativeScenarioNumbers.has(scenario.number),
    ),
    comparisonPath,
  );

  console.log("\n" + "=".repeat(100));
  console.log(`Combined results saved to: ${combinedPath}`);
  console.log(`Comparison SVG saved to: ${comparisonPath}`);
}

main();
