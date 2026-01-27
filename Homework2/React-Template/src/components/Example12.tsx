// import * as React from "react";
// import * as d3 from "d3";
// import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

// type DataRow = Record<string, number | string>;

// type Size = {
//   width: number;
//   height: number;
// };

// type StarAxis = {
//   key: string;
//   label: string;
//   angle: number;
//   min: number;
//   max: number;
// };

// export default function StarCoordinates() {
//   const containerRef = React.useRef<HTMLDivElement>(null);
//   const [data, setData] = React.useState<DataRow[]>([]);
//   const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

//   // ---------------- Load CSV inside component (like heatmap) ----------------
//   React.useEffect(() => {
//     const loadData = async () => {
//       try {
//         const csvData = await d3.csv("/data/global_population_risk.csv", d3.autoType);
//         setData(csvData as DataRow[]);
//         console.log("Loaded star data:", csvData.slice(0, 5));
//       } catch (error) {
//         console.error("Error loading CSV:", error);
//       }
//     };

//     loadData();
//   }, []);

//   // ---------------- Resize observer using usehooks-ts ----------------
//   const onResize = useDebounceCallback((size: Size) => {
//     setSize(size);
//   }, 200);

//   useResizeObserver({
//     ref: containerRef as React.RefObject<HTMLDivElement>,
//     onResize,
//   });

//   // ---------------- Define star axes ----------------
//   const axes: StarAxis[] = React.useMemo(() => {
//     if (!data.length) return [];

//     // pick numeric columns only
//     const numericKeys = Object.keys(data[0]).filter((k) => typeof data[0][k] === "number");

//     const angleStep = (2 * Math.PI) / numericKeys.length;

//     return numericKeys.map((key, i) => {
//       const values = data.map((d) => d[key] as number);
//       return {
//         key,
//         label: key.replaceAll("_", " "),
//         angle: i * angleStep,
//         min: Math.min(...values),
//         max: Math.max(...values),
//       };
//     });
//   }, [data]);

//   const { width, height } = size;
//   const cx = width / 2;
//   const cy = height / 2;
//   const radius = Math.min(width, height) * 0.4;

//   return (
//     <div
//       ref={containerRef}
//       className="chart-container"
//       style={{ width: "100%", height: "100%" }}
//     >
//       <h3 style={{ margin: "0.25rem" }}>Star Coordinates</h3>
//       <svg width={width} height={height}>
//         {/* center point */}
//         <circle cx={cx} cy={cy} r={2} fill="black" />

//         {/* star axes */}
//         {axes.map((axis) => {
//           const x = cx + radius * Math.cos(axis.angle);
//           const y = cy + radius * Math.sin(axis.angle);
//           return (
//             <g key={axis.key}>
//               <line x1={cx} y1={cy} x2={x} y2={y} stroke="#888" strokeWidth={1} />
//               <text
//                 x={x}
//                 y={y}
//                 fontSize={11}
//                 textAnchor="middle"
//                 dominantBaseline="middle"
//                 dx={Math.cos(axis.angle) * 14}
//                 dy={Math.sin(axis.angle) * 14}
//               >
//                 {axis.label}
//               </text>
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

type DataRow = Record<string, number | string>;

interface StarAxis {
  key: string;
  label: string;
  angle: number;
  min: number;
  max: number;
}

export default function StarCoordinates1() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [data, setData] = useState<DataRow[]>([]);
  const onResize = useDebounceCallback((size: { width: number; height: number }) => setSize(size), 200);

  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  // ---------------- Load CSV inside component ----------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv("/data/global_population_risk.csv", d3.autoType);
        setData(csvData as DataRow[]);
        console.log("Star data loaded:", csvData.slice(0, 5));
      } catch (err) {
        console.error("Error loading CSV:", err);
      }
    };
    loadData();
  }, []);

  // ---------------- Draw chart ----------------
  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;

    const svg = d3.select("#starplot-svg");
    svg.selectAll("*").remove(); // clear previous render

    const cx = size.width / 2;
    const cy = size.height / 2;
    const radius = Math.min(size.width, size.height) * 0.4;

    // ---------------- Compute axes ----------------
    const numericKeys = Object.keys(data[0]).filter((k) => typeof data[0][k] === "number");
    const angleStep = (2 * Math.PI) / numericKeys.length;

    const axes: StarAxis[] = numericKeys.map((key, i) => {
      const values = data.map((d) => d[key] as number);
      return {
        key,
        label: key.replaceAll("_", " "),
        angle: i * angleStep,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    // ---------------- Draw axes ----------------
    svg
      .append("g")
      .selectAll("line")
      .data(axes)
      .join("line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", (d) => cx + radius * Math.cos(d.angle))
      .attr("y2", (d) => cy + radius * Math.sin(d.angle))
      .attr("stroke", "#888")
      .attr("stroke-width", 1);

    // axis labels
    svg
      .append("g")
      .selectAll("text")
      .data(axes)
      .join("text")
      .attr("x", (d) => cx + (radius + 14) * Math.cos(d.angle))
      .attr("y", (d) => cy + (radius + 14) * Math.sin(d.angle))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", 11)
      .text((d) => d.label);

    // optional: draw center point
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2).attr("fill", "black");
  }, [data, size]);

  // ---------------- Render ----------------
  return (
    <div ref={containerRef} className="chart-container">
      <svg id="starplot-svg" width="100%" height="100%" />
    </div>
  );
}

