import fs from "node:fs";

const colors = ["#111111", "#1f77b4", "#2ca02c", "#d62728", "#9467bd"];

export function saveScenarioComparisonPlot(series, filePath) {
  const width = 980;
  const height = 520;

  const paddingLeft = 75;
  const paddingRight = 235;
  const paddingTop = 55;
  const paddingBottom = 65;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const allRows = series.flatMap((item) => item.rows);
  const xMin = Math.min(...allRows.map((row) => row.time_min));
  const xMax = Math.max(...allRows.map((row) => row.time_min));

  const xScale = (x) =>
    paddingLeft + ((x - xMin) / (xMax - xMin || 1)) * plotWidth;
  const yScale = (y) => height - paddingBottom - y * plotHeight;

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

  const thresholdLines = [
    { value: 0.3, label: "R = 0.30" },
    { value: 0.6, label: "R = 0.60" },
    { value: 0.8, label: "R = 0.80" },
  ]
    .map(({ value, label }) => {
      const y = yScale(value);

      return `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="4 4" />
      <text x="${paddingLeft + 8}" y="${y - 6}" font-size="12" font-family="Arial" fill="#666">${label}</text>
    `;
    })
    .join("\n");

  const lines = series
    .map(({ scenario, rows }, index) => {
      const color = colors[index % colors.length];
      const points = rows
        .map((row) => `${xScale(row.time_min)},${yScale(row.r_total)}`)
        .join(" ");

      return `<polyline data-scenario-number="${scenario.number}" points="${points}" fill="none" stroke="${color}" stroke-width="2.6" />`;
    })
    .join("\n");

  const legend = series
    .map(({ scenario, rows }, index) => {
      const color = colors[index % colors.length];
      const y = paddingTop + 35 + index * 34;
      const finalRisk = rows.at(-1)?.r_total?.toFixed(2);

      return `
      <line x1="${width - 205}" y1="${y}" x2="${width - 160}" y2="${y}" stroke="${color}" stroke-width="2.6" />
      <text x="${width - 150}" y="${y + 5}" font-size="13" font-family="Arial">
        Сц. ${scenario.number}: R=${finalRisk}
      </text>
    `;
    })
    .join("\n");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="white" />

  <text x="${width / 2}" y="28" text-anchor="middle" font-size="18" font-family="Arial" font-weight="bold">
    Порівняння динаміки R<tspan baseline-shift="sub" font-size="10">total</tspan> для репрезентативних сценаріїв
  </text>

  ${horizontalGrid}
  ${thresholdLines}

  <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="#333" stroke-width="1.2" />
  ${xAxisTicks}
  <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${height - paddingBottom}" stroke="#333" stroke-width="1.2" />

  <text x="${(width - paddingRight + paddingLeft) / 2}" y="${height - 20}" text-anchor="middle" font-size="15" font-family="Arial">
    Час t, хв
  </text>

  <text x="22" y="${height / 2}" transform="rotate(-90 22 ${height / 2})" text-anchor="middle" font-size="15" font-family="Arial">
    Підсумковий ризик Rtotal
  </text>

  ${lines}
  ${legend}
</svg>
`;

  fs.writeFileSync(filePath, svg.trim(), "utf8");
}
