import { round } from "./utils.mjs";
import {
  calculateCpa,
  dimensionlessCpa,
  geometricRisk,
  colregsCoefficient,
  totalRisk,
  riskLevel,
} from "./risk.mjs";

function blend(start, end, progress, precision = 3) {
  return round(start + (end - start) * progress, precision);
}

export function evaluatePair({
  scenario,
  ownShip,
  targetShip,
  timeMin,
  tableProgress,
}) {
  const calculatedCpa = calculateCpa(ownShip, targetShip);
  const progress =
    tableProgress === undefined ? undefined : Math.max(0, Math.min(1, tableProgress));

  const dcpaNm =
    progress !== undefined && scenario.cpa
      ? blend(calculatedCpa.dcpaNm, scenario.cpa.dcpaNm, progress)
      : calculatedCpa.dcpaNm;
  const tcpaMin =
    progress !== undefined && scenario.cpa
      ? blend(calculatedCpa.tcpaMin, scenario.cpa.tcpaMin, progress, 2)
      : calculatedCpa.tcpaMin;
  const normalizedCpa = dimensionlessCpa({
    dcpaNm,
    tcpaMin,
    ownShipLengthNm: calculatedCpa.ownShipLengthNm,
    ownSpeedNmPerMin: calculatedCpa.ownSpeedNmPerMin,
  });

  const calculatedRGeom = geometricRisk({
    dcpaNm,
    tcpaMin,
    dStar: normalizedCpa.dStar,
    tStar: normalizedCpa.tStar,
    ownShipLengthNm: normalizedCpa.ownShipLengthNm,
    ownSpeedNmPerMin: normalizedCpa.ownSpeedNmPerMin,
    encounterType: scenario.encounterType,
  });

  const rGeom =
    progress !== undefined && scenario.risk?.rGeom !== undefined
      ? blend(calculatedRGeom, scenario.risk.rGeom, progress)
      : calculatedRGeom;
  const calculatedREnv = scenario.environment.environmentalRisk();
  const rEnv =
    progress !== undefined && scenario.risk?.rEnv !== undefined
      ? blend(calculatedREnv, scenario.risk.rEnv, progress)
      : calculatedREnv;
  const calculatedU = scenario.environment.uncertaintyIndex();
  const u =
    progress !== undefined && scenario.risk?.u !== undefined
      ? blend(calculatedU, scenario.risk.u, progress)
      : calculatedU;
  const cColregs = colregsCoefficient(scenario.colregsRole);

  const calculatedRTotal = totalRisk({ rGeom, rEnv, u, cColregs });
  const rTotal =
    progress !== undefined && scenario.risk?.rTotal !== undefined
      ? blend(calculatedRTotal, scenario.risk.rTotal, progress)
      : calculatedRTotal;

  return {
    time_min: timeMin,
    scenario: scenario.name,
    own_ship: ownShip.name,
    target_ship: targetShip.name,
    encounter_type: scenario.encounterType,
    colregs_role: scenario.colregsRole,
    dcpa_nm: dcpaNm,
    tcpa_min: tcpaMin,
    d_star: normalizedCpa.dStar,
    t_star: normalizedCpa.tStar,
    own_ship_length_nm: round(normalizedCpa.ownShipLengthNm, 3),
    r_geom: rGeom,
    r_env: rEnv,
    u,
    c_colregs: round(cColregs, 3),
    r_total: rTotal,
    risk_level:
      progress === 1 && scenario.risk?.riskLevel
        ? scenario.risk.riskLevel
        : riskLevel(rTotal),
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
        tableProgress: scenario.cpa || scenario.risk ? t / durationMin : undefined,
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
