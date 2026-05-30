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
  const width = 900;
  const height = 420;

  const paddingLeft = 75;
  const paddingRight = 35;
  const paddingTop = 35;
  const paddingBottom = 65;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const xMin = Math.min(...rows.map((row) => row.time_min));
  const xMax = Math.max(...rows.map((row) => row.time_min));

  const xScale = (x) =>
    paddingLeft + ((x - xMin) / (xMax - xMin || 1)) * plotWidth;

  const yScale = (y) => height - paddingBottom - y * plotHeight;

  const makePolyline = (key) =>
    rows
      .map((row) => `${xScale(row.time_min)},${yScale(row[key])}`)
      .join(" ");

  const makePoints = (key, radius = 3, stroke = "black") =>
    rows
      .map(
        (row) =>
          `<circle cx="${xScale(row.time_min)}" cy="${yScale(row[key])}" r="${radius}" fill="white" stroke="${stroke}" stroke-width="1.4" />`,
      )
      .join("\n");

  const horizontalGrid = Array.from({ length: 6 }, (_, index) => {
    const value = index / 5;
    const y = yScale(value);

    return `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#e5e5e5" stroke-width="1" />
      <text x="${paddingLeft - 15}" y="${y + 5}" text-anchor="end" font-size="13" font-family="Arial">${value.toFixed(1)}</text>
    `;
  }).join("\n");

  const xTickStep = 5;
  const xAxisTicks = Array.from(
    { length: Math.floor((xMax - xMin) / xTickStep) + 1 },
    (_, index) => xMin + index * xTickStep,
  )
    .map((value) => {
      const x = xScale(value);

      return `
      <line x1="${x}" y1="${height - paddingBottom}" x2="${x}" y2="${height - paddingBottom + 6}" stroke="#333" stroke-width="1" />
      <text x="${x}" y="${height - paddingBottom + 24}" text-anchor="middle" font-size="13" font-family="Arial">${value}</text>
    `;
    })
    .join("\n");

  const maneuverTime = 12;
  const maneuverX = xScale(maneuverTime);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white" />

  ${horizontalGrid}

  <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="#333" stroke-width="1.2" />
  ${xAxisTicks}
  <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${height - paddingBottom}" stroke="#333" stroke-width="1.2" />

  <text x="${width / 2}" y="${height - 20}" text-anchor="middle" font-size="15" font-family="Arial">
    Час t, хв
  </text>

  <text x="22" y="${height / 2}" transform="rotate(-90 22 ${height / 2})" text-anchor="middle" font-size="15" font-family="Arial">
    Нормований рівень ризику
  </text>

  <line x1="${paddingLeft}" y1="${yScale(0.35)}" x2="${width - paddingRight}" y2="${yScale(0.35)}" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="4 4" />
  <text x="${paddingLeft + 8}" y="${yScale(0.35) - 6}" font-size="12" font-family="Arial" fill="#666">R = 0.35</text>

  <line x1="${paddingLeft}" y1="${yScale(0.65)}" x2="${width - paddingRight}" y2="${yScale(0.65)}" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="4 4" />
  <text x="${paddingLeft + 8}" y="${yScale(0.65) - 6}" font-size="12" font-family="Arial" fill="#666">R = 0.65</text>

  <line x1="${maneuverX}" y1="${paddingTop}" x2="${maneuverX}" y2="${height - paddingBottom}" stroke="#777" stroke-width="1.3" stroke-dasharray="5 5" />
  <text x="${maneuverX - 8}" y="${paddingTop + 16}" text-anchor="end" font-size="13" font-family="Arial" fill="#555">
    початок маневру
  </text>

  <polyline points="${makePolyline("r_total")}" fill="none" stroke="black" stroke-width="2.6" />
  ${makePoints("r_total", 3, "black")}

  <polyline points="${makePolyline("r_geom")}" fill="none" stroke="#666" stroke-width="2" stroke-dasharray="8 5" />
  ${makePoints("r_geom", 2.7, "#666")}

  <polyline points="${makePolyline("r_env")}" fill="none" stroke="#999" stroke-width="1.8" stroke-dasharray="3 5" />

  <line x1="${width - 245}" y1="55" x2="${width - 190}" y2="55" stroke="black" stroke-width="2.6" />
  <text x="${width - 178}" y="60" font-size="14" font-family="Arial">
    - R<tspan baseline-shift="sub" font-size="10">total</tspan>
  </text>

  <line x1="${width - 245}" y1="80" x2="${width - 190}" y2="80" stroke="#666" stroke-width="2" stroke-dasharray="8 5" />
  <text x="${width - 178}" y="85" font-size="14" font-family="Arial">
    - R<tspan baseline-shift="sub" font-size="10">geo</tspan>
  </text>

  <line x1="${width - 245}" y1="105" x2="${width - 190}" y2="105" stroke="#999" stroke-width="1.8" stroke-dasharray="3 5" />
  <text x="${width - 178}" y="110" font-size="14" font-family="Arial">
    - R<tspan baseline-shift="sub" font-size="10">env</tspan>
  </text>
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
