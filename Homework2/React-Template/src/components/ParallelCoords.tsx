import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import { MergedRow } from "../utils/mergeData";

type Props = {
  data: MergedRow[];
  year: number;
  topN?: number;
  highlightCountry?: string | null;
  onHighlight?: (country: string | null) => void;
  title?: string;
};

/*
 Parallel coordinates (advanced):
 - Shows multiple normalized indices for the top N countries by population.
 - Dimensions chosen to represent risk, resources, and emissions.
 - Coloring highlights the selected country.
 - Legend via annotations and explicit title on colorbar is not typical for parcoords; we use color to indicate population rank.
*/

const DIM_LABELS = [
  { key: "environmental_stress_score", label: "Environmental stress" },
  { key: "ozone_risk_score", label: "Ozone risk" },
  { key: "goods_supply_risk_score", label: "Goods supply risk" },
  { key: "climate_vulnerability_index", label: "Climate vulnerability" },
  { key: "economic_resilience_score", label: "Economic resilience" },
  { key: "global_population_pressure_index", label: "Population pressure" },
  { key: "resource_dependency_score", label: "Resource dependency" },
  { key: "energy_consumption_per_capita", label: "Energy per cap" },
  { key: "co2_emissions", label: "CO2 emissions" },
];

export default function ParallelCoords({
  data,
  year,
  topN = 20,
  highlightCountry,
  onHighlight,
  title,
}: Props) {
  const rows = useMemo(() => {
    const filtered = data.filter((r) => r.year === year);
    const sorted = filtered
      .filter((r) => !isNaN(Number(r.population)))
      .sort((a, b) => Number(b.population) - Number(a.population))
      .slice(0, topN);
    return sorted;
  }, [data, year, topN]);

  // Build dimensions: normalize each selected metric to [0,1] to make visual comparison useful.
  const dims = DIM_LABELS.map((d) => {
    const values = rows.map((r) => {
      const v = Number((r as any)[d.key]);
      return isNaN(v) ? null : v;
    });
    const valid = values.filter((v) => v !== null) as number[];
    const min = valid.length ? Math.min(...valid) : 0;
    const max = valid.length ? Math.max(...valid) : 1;
    return {
      label: d.label,
      values: values.map((v) => (v === null ? null : (v - min) / (max - min || 1))),
      tickformat: null,
    };
  });

  const labels = rows.map((r) => r.country);
  const populations = rows.map((r) => Number(r.population) || 0);
  // Color by population rank (bigger pop = darker)
  const color = populations;

  // Keep line width up when highlighted
  const line = {
    color,
    colorscale: "Viridis",
    showscale: true,
    cmin: Math.min(...color),
    cmax: Math.max(...color),
    reversescale: true,
    width: 1,
  };

  // When a country is highlighted, increase its opacity/width by creating a second trace that draws that single line on top
  const highlightedIndex = highlightCountry ? labels.indexOf(highlightCountry) : -1;
  const highlightTrace =
    highlightedIndex >= 0
      ? [
          {
            type: "parcoords",
            pad: { t: 50, r: 10, l: 10 },
            line: { color: "red", width: 4 },
            dimensions: dims.map((d) => ({ ...d, values: [d.values[highlightedIndex]] })),
            labelfont: { size: 12 },
            tickfont: { size: 10 },
            hoverinfo: "none",
            name: "selected",
          } as any,
        ]
      : [];

  const traces = [
    {
      type: "parcoords",
      pad: { t: 50, r: 10, l: 10 },
      line,
      dimensions: dims,
      labelfont: { size: 12 },
      tickfont: { size: 10 },
      hoverinfo: "all",
      // customdata to allow onClick to get the country label
      customdata: labels,
    } as any,
    ...highlightTrace,
  ];

  return (
    <Plot
      data={traces}
      layout={{
        title: title || "Parallel coordinates",
        margin: { l: 50, r: 30, t: 40, b: 10 },
        height: "100%",
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      onClick={(e) => {
        const points = (e && (e as any).points) || [];
        if (points.length) {
          const cd = points[0].data && (points[0].data.customdata || []);
          if (cd && cd[points[0].pointNumber]) {
            const country = cd[points[0].pointNumber];
            if (onHighlight) onHighlight(country);
          }
        }
      }}
    />
  );
}