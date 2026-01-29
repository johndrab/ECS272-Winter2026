// import * as React from "react";
// import * as d3 from "d3";
// import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

// type DataRow = {
//   year: number;
//   population: number;
//   country: string;
// };

// type Size = {
//   width: number;
//   height: number;
// };

// export default function PopulationLineChart() {
//   const containerRef = React.useRef<HTMLDivElement>(null);
//   const [data, setData] = React.useState<DataRow[]>([]);
//   const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

//   // ---------------- Load data ----------------
//   React.useEffect(() => {
//     const loadData = async () => {
//       const csvData = await d3.csv("/data/population_growth.csv", d3.autoType);
//       setData(csvData as DataRow[]);
//     };
//     loadData();
//   }, []);

//   const filteredData = React.useMemo(
//     () => data.filter((d) => d.population > 0),
//     [data]
//   );

//   // ---------------- Resize observer ----------------
//   const onResize = useDebounceCallback((size: Size) => setSize(size), 200);
//   useResizeObserver({
//     ref: containerRef as React.RefObject<HTMLDivElement>,
//     onResize,
//   });

//   const { width, height } = size;
//   if (!width || !height || !data.length) {
//     return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
//   }

//   // ---------------- Layout ----------------
//   const margin = { top: 30, right: 20, bottom: 40, left: 50 };
//   const innerWidth = width - margin.left - margin.right;
//   const innerHeight = height - margin.top - margin.bottom;

//   // ---------------- Group data by country ----------------
//   const dataByCountry = d3.group(data, (d) => d.country);
//   const countries = Array.from(dataByCountry.keys());

//   // ---------------- X scale (shared) ----------------
//   const xScale = d3
//     .scaleLinear()
//     .domain(d3.extent(data, (d) => d.year) as [number, number])
//     .range([0, innerWidth / 3 - 40]); // 3 charts horizontally with spacing

//   const colorScale = d3
//     .scaleOrdinal<string>()
//     .domain(countries)
//     .range(countries.map((_, i) => d3.interpolateTurbo(i / countries.length)));

// // ---------------- Compute Y bands (3 horizontal ranges) ----------------
// // We'll stretch the first band to cover more space for lower populations
// const populationExtent = d3.extent(filteredData, (d) => d.population) as [number, number];
// const [minPop, maxPop] = populationExtent;

// // Define band breakpoints manually for better lower-range visibility
// const bands = [
//   { min: minPop, max: 500 },                  // first band: 0–500
//   { min: 500, max: 5000 },                    // second band
//   { min: 5000, max: maxPop },                 // third band
// ];

//   // ---------------- Line generator ----------------
//   const line = d3
//     .line<DataRow>()
//     .x((d) => xScale(d.year))
//     .y((d) => 0) // will override Y per band
//     .curve(d3.curveMonotoneX);


//   return (
//     <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
//       <h3 style={{ textAlign: "center", margin: "0.25rem 0" }}>
//         Population Over Time by Country (Split by Y-range)
//       </h3>

//       <svg width={width} height={height}>
//         {bands.map((band, i) => {
//           const chartWidth = innerWidth / 3;
//             const yScale = d3
//             .scaleSqrt()
//             .domain([band.min, band.max])
//             .range([innerHeight, 0]);

//           return (
//             <g
//               key={i}
//               transform={`translate(${margin.left + i * chartWidth}, ${margin.top})`}
//             >
//               {/* X axis (only bottom row) */}
//               <g
//                 transform={`translate(0, ${innerHeight})`}
//                 ref={(node) => {
//                   if (node) d3.select(node).call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")));
//                 }}
//               />

//               {/* Y axis */}
//               <g
//                 ref={(node) => {
//                   if (node) d3.select(node).call(d3.axisLeft(yScale).ticks(4, "~s"));
//                 }}
//               />

//               {/* Lines + points */}
//               {[...dataByCountry.entries()].map(([country, values]) => (
//                 <g key={country}>
//                   <path
//                     d={line(values.filter((d) => d.population >= band.min && d.population <= band.max).map((d) => ({ ...d, population: yScale(d.population) })) as any)!}
//                     fill="none"
//                     stroke={colorScale(country)}
//                     strokeWidth={2}
//                     opacity={0.8}
//                   />

//                   {values
//                     .filter((d) => d.population >= band.min && d.population <= band.max)
//                     .map((d, idx) => (
//                       <circle
//                         key={idx}
//                         cx={xScale(d.year)}
//                         cy={yScale(d.population)}
//                         r={2}
//                         fill={colorScale(country)}
//                         stroke="white"
//                         strokeWidth={0.5}
//                       />
//                     ))}
//                 </g>
//               ))}

//               {/* Band label */}
//               <text
//                 x={-40}
//                 y={innerHeight / 2}
//                 transform="rotate(-90)"
//                 textAnchor="middle"
//                 fontSize={11}
//                 fill="#555"
//               >
//                 {`${Math.round(band.min)} - ${Math.round(band.max)}`}
//               </text>
//             </g>
//           );
//         })}

//         {/* X axis label (bottom of first chart) */}
//         <text
//           x={margin.left + innerWidth / 2}
//           y={height - 5}
//           textAnchor="middle"
//           fontSize={12}
//         >
//           Year
//         </text>

//         {/* Country legend (top-left) */}
//         <g transform={`translate(90, 6)`}>
//           {(() => {
//             const fontSize = 10;
//             const spacing = 8;
//             let cumulativeX = 0;

//             return countries.map((country) => {
//               const x = cumulativeX;
//               const labelWidth = country.length * (fontSize * 0.6);
//               cumulativeX += 12 + spacing + labelWidth;

//               return (
//                 <g key={country} transform={`translate(${x}, 0)`}>
//                   <rect width={12} height={12} fill={colorScale(country)} />
//                   <text x={16} y={10} fontSize={fontSize} textAnchor="start">
//                     {country}
//                   </text>
//                 </g>
//               );
//             });
//           })()}
//         </g>
//       </svg>
//     </div>
//   );
// }


import * as React from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

type DataRow = {
  year: number;
  population: number;
  country: string;
};

type Size = {
  width: number;
  height: number;
};

export default function PopulationLineChart() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<DataRow[]>([]);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

  // ---------------- Load data ----------------
  React.useEffect(() => {
    const loadData = async () => {
      const csvData = await d3.csv(
        "/data/population_growth.csv",
        d3.autoType
      );
      setData(csvData as DataRow[]);
    };
    loadData();
  }, []);

  const filteredData = React.useMemo(
    () => data.filter(d => d.population > 0),
    [data]
  );


  // ---------------- Resize observer ----------------
  const onResize = useDebounceCallback((size: Size) => {
    setSize(size);
  }, 200);

  useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
    onResize,
  });

  const { width, height } = size;
  if (!width || !height || !data.length) {
    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
  }

  // ---------------- Layout ----------------
  const margin = { top: 30, right: 20, bottom: 40, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // ---------------- Group data by country ----------------
  const dataByCountry = d3.group(data, (d) => d.country);
  const countries = Array.from(dataByCountry.keys());

  // ---------------- Scales ----------------
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year) as [number, number])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLog()
    .domain([
        d3.min(filteredData, d => d.population)!,
        d3.max(filteredData, d => d.population)!
    ])
    .range([innerHeight, 0]);

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(countries)
    .range(countries.map((_, i) => d3.interpolateTurbo(i / countries.length)));

  // ---------------- Line generator ----------------
  const line = d3
    .line<DataRow>()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.population))
    .curve(d3.curveMonotoneX);

const fontSize = 10;
const spacing = 4; // space between legend items
let cumulativeX = 0;

  return (
    <div
      ref={containerRef}
      className="chart-container"
      style={{ width: "100%", height: "100%" }}
    >
      <h3 style={{ textAlign: "center", margin: "0.25rem 0" }}>
        Population Over Time by Country
      </h3>

      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* X axis */}
          <g
            transform={`translate(0, ${innerHeight})`}
            ref={(node) => {
              if (node) {
                d3.select(node).call(
                  d3.axisBottom(xScale)
                    .ticks(32)
                    .tickFormat(d3.format("d"))
                );
              }
            }}
          />

          {/* Y axis */}
          <g
            ref={(node) => {
              if (node) {
                d3.select(node).call(
                    d3.axisLeft(yScale)
                        .ticks(6, "~s")
                );
              }
            }}
          />

          {/* Lines + points */}
          {[...dataByCountry.entries()].map(([country, values]) => (
            <g key={country}>
              {/* Line */}
              <path
                d={line(values)!}
                fill="none"
                stroke={colorScale(country)}
                strokeWidth={2}
                opacity={0.8}
              />

              {/* Points
              {values.map((d, i) => (
                <circle
                  key={i}
                  cx={xScale(d.year)}
                  cy={yScale(d.population)}
                  r={1.5}
                  fill={colorScale(country)}
                  stroke="white"
                  strokeWidth={0.5}
                />
              ))} */}
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={innerWidth / 2}
            y={innerHeight + 35}
            textAnchor="middle"
            fontSize={12}
          >
            Year
          </text>

          <text
            transform="rotate(-90)"
            x={-innerHeight / 2}
            y={-46}
            textAnchor="middle"
            fontSize={12}
          >
            Population
          </text>
        </g>
        {/* ---------------- Country color legend ---------------- */}
        <g transform={`translate(90, 6)`}>
        {(() => {
            const fontSize = 10;
            const spacing = 8;
            let cumulativeX = 0;

            return countries.map((country) => {
            const x = cumulativeX;
            const labelWidth = country.length * (fontSize * 0.6); // approximate width per character
            cumulativeX += 12 + spacing + labelWidth; // rect + spacing + text width

            return (
                <g key={country} transform={`translate(${x}, 0)`}>
                <rect width={12} height={12} fill={colorScale(country)} />
                <text x={16} y={10} fontSize={fontSize} textAnchor="start">
                    {country}
                </text>
                </g>
            );
            });
        })()}
        </g>
      </svg>
    </div>
  );
}

