import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import { MergedRow } from "../utils/mergeData";

type Props = {
  data: MergedRow[];
  year: number;
  onCountrySelect?: (country: string) => void;
  title?: string;
};

/*
 Choropleth overview:
 - Encodes population (snapshot year) with a sequential color scale.
 - Provides hover with population and a few indices (environmental stress, ozone risk).
 - Clicking a country calls onCountrySelect(country).
*/

export default function MapOverview({ data, year, onCountrySelect, title }: Props) {
  const rows = useMemo(
    () =>
      data
        .filter((r) => r.year === year)
        .map((r) => ({
          country: r.country,
          population: Number(r.population) || 0,
          env: Number(r.environmental_stress_score) || null,
          ozone: Number(r.ozone_risk_score) || null,
        })),
    [data, year]
  );

  const locations = rows.map((r) => r.country);
  const z = rows.map((r) => r.population);
  const hoverText = rows.map(
    (r) =>
      `${r.country}<br>Population: ${r.population.toLocaleString()}<br>Env stress: ${
        r.env ?? "N/A"
      }<br>Ozone risk: ${r.ozone ?? "N/A"}`
  );

  return (
    <Plot
      data={[
        {
          type: "choropleth",
          locations,
          locationmode: "country names",
          z,
          text: hoverText,
          colorscale: "Blues",
          autocolorscale: false,
          marker: { line: { color: "rgb(180,180,180)", width: 0.5 } },
          colorbar: { title: "Population", tickformat: ".0s" },
          hoverinfo: "text",
        },
      ]}
      layout={{
        title: title || "Population choropleth",
        geo: {
          showframe: false,
          showcoastlines: true,
          projection: { type: "natural earth" },
        },
        margin: { l: 10, r: 10, t: 40, b: 10 },
        height: "100%",
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      onClick={(ev) => {
        const pts = (ev && (ev as any).points) || [];
        if (pts.length && onCountrySelect) {
          const country = pts[0].location;
          onCountrySelect(country);
        }
      }}
    />
  );
}