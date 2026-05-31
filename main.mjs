import fs from "node:fs";
import path from "node:path";

import { simulateScenario } from "./simulation/simulate.mjs";
import { createAllScenarios } from "./simulation/scenarios.mjs";
import { saveCsv, saveSvgPlot, printPreview } from "./simulation/output.mjs";

function main() {
  const outputDir = path.join(process.cwd(), "simulation_results");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const scenarios = createAllScenarios();
  const combinedResults = [];

  scenarios.forEach((scenario, index) => {
    const rows = simulateScenario({
      scenario,
      durationMin: 20,
      stepMin: 1,
    });

    combinedResults.push(...rows);

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

  console.log("\n" + "=".repeat(100));
  console.log(`Combined results saved to: ${combinedPath}`);
}

main();
