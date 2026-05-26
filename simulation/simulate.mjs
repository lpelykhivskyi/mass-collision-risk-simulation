import { round } from "./utils.mjs";
import {
  calculateCpa,
  geometricRisk,
  colregsCoefficient,
  totalRisk,
  riskLevel,
} from "./risk.mjs";

export function evaluatePair({ scenario, ownShip, targetShip, timeMin }) {
  const { dcpaNm, tcpaMin } = calculateCpa(ownShip, targetShip);

  const rGeom = geometricRisk({
    dcpaNm,
    tcpaMin,
    encounterType: scenario.encounterType,
  });

  const rEnv = scenario.environment.environmentalRisk();
  const u = scenario.environment.uncertaintyIndex();
  const cColregs = colregsCoefficient(scenario.colregsRole);

  const rTotal = totalRisk({ rGeom, rEnv, u, cColregs });

  return {
    time_min: timeMin,
    scenario: scenario.name,
    own_ship: ownShip.name,
    target_ship: targetShip.name,
    encounter_type: scenario.encounterType,
    colregs_role: scenario.colregsRole,
    dcpa_nm: dcpaNm,
    tcpa_min: tcpaMin,
    r_geom: rGeom,
    r_env: rEnv,
    u,
    c_colregs: round(cColregs, 3),
    r_total: rTotal,
    risk_level: riskLevel(rTotal),
  };
}

export function simulateScenario({ scenario, durationMin = 20, stepMin = 1 }) {
  const rows = [];

  let ownShip = scenario.ownShip;
  let targetShips = scenario.targetShips;

  for (let t = 0; t <= durationMin; t += stepMin) {
    const pairRows = targetShips.map((targetShip) =>
      evaluatePair({
        scenario,
        ownShip,
        targetShip,
        timeMin: t,
      }),
    );

    const mostDangerous = pairRows.reduce((maxRow, currentRow) =>
      currentRow.r_total > maxRow.r_total ? currentRow : maxRow,
    );

    rows.push({
      ...mostDangerous,
      aggregation: "max pair risk",
    });

    ownShip = ownShip.move(stepMin);
    targetShips = targetShips.map((ship) => ship.move(stepMin));
  }

  return rows;
}
