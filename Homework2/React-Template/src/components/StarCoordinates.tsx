import * as React from "react";
import * as d3 from "d3";
import { useResizeObserver, useDebounceCallback } from "usehooks-ts";

type DataRow = Record<string, number | string>;

type Size = {
  width: number;
  height: number;
};

type StarAxis = {
  key: string;
  label: string;
  angle: number;
  min: number;
  max: number;
};

export default function StarCoordinates() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [data, setData] = React.useState<DataRow[]>([]);
    const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });

    // ---------------- Load CSV inside component (like heatmap) ----------------
    React.useEffect(() => {
        const loadData = async () => {
        try {
            const csvData = await d3.csv("/data/population_growth.csv", d3.autoType);
            setData(csvData as DataRow[]);
            console.log("Loaded star data:", csvData.slice(0, 20));
        } catch (error) {
            console.error("Error loading CSV:", error);
        }
        };

        loadData();
    }, []);

    // ---------------- Resize observer using usehooks-ts ----------------
    const onResize = useDebounceCallback((size: Size) => {
        setSize(size);
    }, 200);

    useResizeObserver({
        ref: containerRef as React.RefObject<HTMLDivElement>,
        onResize,
    });

    // ---------------- Define star axes ----------------
    const AXIS_LABELS: Record<string, string> = {
    urban_population: "Urban Population",
    fertility_rate: "Fertility Rate",
    median_age: "Median Age",
    population_density: "Population Density",
    population_growth_rate: "Population Growth Rate",
    // year: "Year",
    };

    const axes: StarAxis[] = React.useMemo(() => {
    if (!data.length) return [];

    const selectedColumns = [
        "urban_population",
        "fertility_rate",
        "median_age",
        "population_density",
        "population_growth_rate",
        // "year",
    ];

    const numericKeys = Object.keys(data[0])
        .filter((k) => typeof data[0][k] === "number")
        .filter((k) => selectedColumns.includes(k));

    console.log(numericKeys.length)
    // console.log("thisis num keys")

    const angleStep = (2 * Math.PI) / numericKeys.length;

    return numericKeys.map((key, i) => {
        const values = data.map((d) => d[key] as number);

        return {
        key,
        label: AXIS_LABELS[key] ?? key, // fallback just in case
        angle: i * angleStep,
        min: Math.min(...values),
        max: Math.max(...values),
        };
    });
    }, [data]);


    // adding color gradent to get representation of the year for each cluster
    const yearExtent = React.useMemo<[number, number] | null>(() => {
    if (!data.length) return null;
    return d3.extent(data, d => d.year as number) as [number, number];
    }, [data]);

    const colorScale = React.useMemo(() => {
    if (!yearExtent) return null;

    return d3.scaleSequential()
        .domain(yearExtent)
        .interpolator(d3.interpolateViridis);
    }, [yearExtent]);

    // adding shapes for each contentent to get general county information
    const DEFAULT_SHAPE = d3.symbolCircle;
    const CONTINENT_SHAPES: Record<string, d3.SymbolType> = {
    Africa: d3.symbolSquare,
    Asia: d3.symbolTriangle,
    Europe: d3.symbolCross,
    "North America": d3.symbolCircle,
    "South America": d3.symbolDiamond,
    };


    const { width, height } = size;
    const cx = width / 2 + 90;
    const cy = (height / 2) -6;
    const radius = Math.min(width, height) * 0.45;

    
    const legendX = 80;
    const legendY = 30;
    const legendItemSpacing = 18;
    const legendSymbolSize = 60;

  return (
    <div 
      ref={containerRef}
      className="chart-container"
      style={{ width: "100%", height: "100%" }}
    >
      <h3 style={{ margin: "0rem 6" , textAlign: "center", fontSize: "1.02rem", position: "relative", left: "-140px", top: "3px"}}>Population Structure and Growth Metrics</h3>
      <svg width={width} height={height}>
        {/* color for ledgend */}
        {colorScale && yearExtent && (
        <defs>
            <linearGradient id="year-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {d3.range(0, 1.01, 0.1).map((t) => (
                <stop
                key={t}
                offset={`${t * 100}%`}
                stopColor={colorScale(
                    yearExtent[0] + t * (yearExtent[1] - yearExtent[0])
                )}
                />
            ))}
            </linearGradient>
        </defs>
        )}

        {/* center point */}
        <circle cx={cx} cy={cy} r={2} fill="black" />

        {/* star axes */}
        {axes.map((axis) => {
        // Axis line endpoint
        const xAxis = cx + radius * Math.cos(axis.angle);
        const yAxis = cy + radius * Math.sin(axis.angle);

        // Label offset (push labels outside the axis)
        const labelOffset = radius + 19; // distance from center to start of label
        const xLabel = cx + labelOffset * Math.cos(axis.angle) -7;
        const yLabel = cy + labelOffset * Math.sin(axis.angle);

        // Split label into words
        const words = axis.label.split(" ");
        const lineHeight = 12; // font size
        const totalHeight = words.length * lineHeight;

        return (
            <g key={axis.key}>
            {/* Axis line */}
            <line
                x1={cx}
                y1={cy}
                x2={xAxis}
                y2={yAxis}
                stroke="#888"
                strokeWidth={1}
            />

            {/* Label */}
            <text
                x={xLabel}
                y={yLabel - totalHeight / 2 + 6} // center vertically
                fontSize={lineHeight}
                textAnchor={
                axis.angle === Math.PI ? "end" :
                axis.angle === 0 ? "start" : "middle"
                }
                dominantBaseline="middle"
            >
                {words.map((word, i) => (
                <tspan
                    key={i}
                    x={xLabel} // keep each line aligned horizontally
                    dy={i === 0 ? 0 : lineHeight} // stack
                >
                    {word}
                </tspan>
                ))}
            </text>
            </g>
        );
        })}
        {/* data point maping  */}
        {data.map((d, i) => {
        const p = axes.reduce(
            (acc, axis) => {
            const value = d[axis.key] as number;
            const norm = (value - axis.min) / (axis.max - axis.min);
            return {
                x: acc.x + norm * radius * Math.cos(axis.angle),
                y: acc.y + norm * radius * Math.sin(axis.angle),
            };
            },
            { x: 0, y: 0 }
        );

        const year = d.year as number;

        const continent = d.continent as string;
        const symbol = d3.symbol()
        .type(CONTINENT_SHAPES[continent] ?? DEFAULT_SHAPE)
        .size(32)(); // tweak size if needed

        return (            
            // <circle
            // key={i}
            // cx={cx + p.x}
            // cy={cy + p.y}
            // r={2.5}
            // fill={colorScale ? colorScale(year) : "red"}
            // opacity={0.75}
            // />
            <path
            key={i}
            d={symbol!}
            transform={`translate(${cx + p.x}, ${cy + p.y})`}
            fill={colorScale ? colorScale(year) : "red"}
            opacity={0.75}
            />
        );
        })}
        {/* drawing ledgend    */}
        {colorScale && yearExtent && (
        <g
            transform={`translate(${width * 0.05}, ${height - 102}) rotate(-90)`}
        >
            {/* gradient bar */}
            <rect
            width={width * 0.45}
            height={10}
            fill="url(#year-gradient)"
            rx={2}
            />

            {/* min year */}
            <text
            x={15}
            y={-1}
            fontSize={10}
            textAnchor="start"
            transform={`rotate(90)`}
            >
            {yearExtent[0]}
            </text>

            {/* max year */}
            <text
            x={38}
            y={-width * 0.45 +9}
            fontSize={10}
            textAnchor="end"
            transform={`rotate(90)`}
            >
            {yearExtent[1]}
            </text>

            {/* label */}
            <text
            x={width * 0.25}
            y={22}
            fontSize={11}
            textAnchor="middle"
            >
            Year
            </text>
        </g>
        )}

        {/* continent shape legend */}
        <g transform={`translate(${legendX}, ${legendY})`}>
        <text fontSize={13} fontWeight={600} y={-10} x={30}>
            Continent
        </text>

        {Object.entries(CONTINENT_SHAPES).map(([continent, symbolType], i) => {
            const symbolPath = d3.symbol()
            .type(symbolType)
            .size(legendSymbolSize)();

            return (
            <g key={continent} transform={`translate(30, ${i * legendItemSpacing})`}>
                <path
                d={symbolPath!}
                transform="translate(8, 8)"
                fill="#555"
                />
                <text x={20} y={12} fontSize={12}>
                {continent}
                </text>
            </g>
            );
        })}
        </g>


      </svg>
    </div>
    
  );
}
