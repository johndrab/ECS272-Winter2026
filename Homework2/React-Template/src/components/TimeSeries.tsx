import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import { MergedRow } from "../utils/mergeData";

type Props = {
  data: MergedRow[];
  country: string | null;
  title?: string;
};

/*
 Multi-series time chart:
 - Shows population (left y-axis), CO2 emissions (right y-axis) and environmental stress (secondary scale normalized).
 - Includes legends, axis labels, and title.
*/

export default function TimeSeries({ data, country, title }: Props) {
  const rows = useMemo(() => {
    if (!country) return [];
    return data
      .filter((r) => r.country === country)
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [data, country]);

  if (!country) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Select a country on the map or parallel plot to see multi-year trends.</div>
      </div>
    );
  }

  const years = rows.map((r) => Number(r.year));
  const population = rows.map((r) => Number(r.population) || null);
  const co2 = rows.map((r) => Number(r.co2_emissions) || null);
  const env = rows.map((r) => Number(r.environmental_stress_score) || null);

  // Normalize env for overlay or use separate yaxis3 if desired; here we'll scale env to match population range for a clear overplot
  const popMax = Math.max(...(population.filter((v) => v !== null) as number[]), 1);
  const envScaled = env.map((v) => (v === null ? null : (v / 10) * popMax)); // assume 0-10 scale -> scale to population

  const traces = [
    {
      x: years,
      y: population,
      name: "Population",
      mode: "lines+markers",
      marker: { color: "#2b8cbe" },
      yaxis: "y1",
    },
    {
      x: years,
      y: co2,
      name: "CO2 emissions",
      mode: "lines+markers",
      marker: { color: "#f03b20" },
      yaxis: "y2",
    },
    {
      x: years,
      y: envScaled,
      name: "Environmental stress (scaled)",
      mode: "lines",
      marker: { color: "#7b3294" },
      yaxis: "y1",
      line: { dash: "dot" },
    },
  ];

  return (
    <Plot
      data={traces}
      layout={{
        title: title || `Trends for ${country}`,
        xaxis: { title: "Year" },
        yaxis: { title: "Population (people)", showgrid: true },
        yaxis2: {
          title: "CO2 emissions (tonnes)",
          overlaying: "y",
          side: "right",
          showgrid: false,
        },
        legend: { orientation: "h", xanchor: "center", x: 0.5 },
        margin: { l: 60, r: 60, t: 40, b: 40 },
        height: "100%",
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
    />
  );
}