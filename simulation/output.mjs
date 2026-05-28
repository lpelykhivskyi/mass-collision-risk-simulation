import fs from "node:fs";

export function escapeCsvValue(value) {
  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function toCsv(rows) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];

  return lines.join("\n");
}

export function saveCsv(rows, filePath) {
  fs.writeFileSync(filePath, toCsv(rows), "utf8");
}

export function saveSvgPlot(rows, filePath) {
  const width = 1000;
  const height = 520;
  const padding = 60;

  const xMin = Math.min(...rows.map((row) => row.time_min));
  const xMax = Math.max(...rows.map((row) => row.time_min));

  const xScale = (x) =>
    padding + ((x - xMin) / (xMax - xMin || 1)) * (width - padding * 2);

  const yScale = (y) =>
    height - padding - y * (height - padding * 2);

  const makePolyline = (key) =>
    rows
      .map((row) => `${xScale(row.time_min)},${yScale(row[key])}`)
      .join(" ");

  const makePoints = (key) =>
    rows
      .map(
        (row) =>
          `<circle cx="${xScale(row.time_min)}" cy="${yScale(row[key])}" r="4" />`,
      )
      .join("\n");

  const horizontalGrid = Array.from({ length: 6 }, (_, index) => {
    const value = index / 5;
    const y = yScale(value);

    return `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#ddd" />
      <text x="20" y="${y + 5}" font-size="14">${value.toFixed(1)}</text>
    `;
  }).join("\n");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white" />

  <text x="${width / 2}" y="30" text-anchor="middle" font-size="22" font-family="Arial">
    Динаміка ризику зіткнення в часі
  </text>

  ${horizontalGrid}

  <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" />
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" />

  <text x="${width / 2}" y="${height - 15}" text-anchor="middle" font-size="16" font-family="Arial">
    Час, хв
  </text>

  <text x="18" y="${height / 2}" transform="rotate(-90 18 ${height / 2})" text-anchor="middle" font-size="16" font-family="Arial">
    Нормований ризик
  </text>

  <polyline points="${makePolyline("r_total")}" fill="none" stroke="black" stroke-width="3" />
  ${makePoints("r_total")}

  <polyline points="${makePolyline("r_geom")}" fill="none" stroke="gray" stroke-width="2" stroke-dasharray="8 5" />
  ${makePoints("r_geom")}

  <polyline points="${makePolyline("r_env")}" fill="none" stroke="darkgray" stroke-width="2" stroke-dasharray="4 4" />
  ${makePoints("r_env")}

  <line x1="${width - 250}" y1="70" x2="${width - 190}" y2="70" stroke="black" stroke-width="3" />
  <text x="${width - 180}" y="75" font-size="15" font-family="Arial">- R_total</text>

  <line x1="${width - 250}" y1="95" x2="${width - 190}" y2="95" stroke="gray" stroke-width="2" stroke-dasharray="8 5" />
  <text x="${width - 180}" y="100" font-size="15" font-family="Arial">- R_geo</text>

  <line x1="${width - 250}" y1="120" x2="${width - 190}" y2="120" stroke="darkgray" stroke-width="2" stroke-dasharray="4 4" />
  <text x="${width - 180}" y="125" font-size="15" font-family="Arial">- R_env</text>
</svg>
`;

  fs.writeFileSync(filePath, svg.trim(), "utf8");
}

export function printPreview(rows) {
  console.table(
    rows.slice(0, 10).map((row) => ({
      time_min: row.time_min,
      target_ship: row.target_ship,
      dcpa_nm: row.dcpa_nm,
      tcpa_min: row.tcpa_min,
      r_geom: row.r_geom,
      r_env: row.r_env,
      u: row.u,
      c_colregs: row.c_colregs,
      r_total: row.r_total,
      risk_level: row.risk_level,
    })),
  );
}
