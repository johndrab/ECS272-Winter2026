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

interface PopulationLineChartProps {
  selectedCountry: string | null;
}


export default function PopulationLineCharti({ selectedCountry }: PopulationLineChartProps ) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [data, setData] = React.useState<DataRow[]>([]);
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
 
  // data from csv
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

  const margin = { top: 10, right: 140, bottom: 40, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;


  const dataByCountry = d3.group(data, (d) => d.country);
  const countries = Array.from(dataByCountry.keys());


  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year) as [number, number])
    .range([0, innerWidth]);

  const yScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.population)!])
    .range([innerHeight, 0]);
    

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(countries)
    .range(countries.map((_, i) => d3.interpolateTurbo(i / countries.length)));

  const line = d3
    .line<DataRow>()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.population))
    .curve(d3.curveMonotoneX);

  const legendItemHeight = height < 300 ? 9 : 15;
  const legendFontSize = height < 300 ? 8 : 12;

  const tickCount = Math.max(4, Math.floor(height / 40));
  const maxY = yScale.domain()[1];

  const tickValues = d3.ticks(0, Math.sqrt(maxY), tickCount)
  .map(d => d * d);

  d3.axisLeft(yScale)
  .tickValues(tickValues)
  .tickFormat(d3.format("~s"));

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
          {/* x axis */}
          <g
            transform={`translate(0, ${innerHeight})`}
            ref={(node) => {
              if (node) {
                d3.select(node).call(
                  d3.axisBottom(xScale)
                    .ticks(Math.floor(width / 50))
                    .tickFormat(d3.format("d"))
                );
              }
            }}
          />

          {/* y axis */}
          <g
            ref={(node) => {
              if (!node) return;

              const tickCount = Math.max(4, Math.floor(innerHeight / 40));
              const maxY = yScale.domain()[1];

              const tickValues = d3
                .ticks(0, Math.sqrt(maxY), tickCount)
                .map(d => d * d);

              d3.select(node).call(
                d3.axisLeft(yScale)
                  .tickValues(tickValues)
                  .tickFormat(d3.format("~s"))
              );
            }}
          />

          {[...dataByCountry.entries()].map(([country, values]) => (
            <g key={country}>
              <path
                d={line(values)!}
                fill="none"
                stroke={colorScale(country)}
                strokeWidth={2}
                opacity={0.8}
              />
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
        <g transform={`translate(${width - margin.right + 10}, ${0})`}>
          {countries.map((country, i) => (
            <g key={country} transform={`translate(0, ${i * legendItemHeight})`}>
              <rect width={8} height={8} fill={colorScale(country)} />
              <text
                x={12}
                y={legendItemHeight - (legendItemHeight * 0.4) }
                fontSize={legendFontSize}
              >
                {country}
              </text>
            </g>
          ))}
        </g>

      </svg>
    </div>
  );
}

