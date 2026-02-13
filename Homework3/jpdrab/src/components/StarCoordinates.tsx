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

interface StarCoordinatesProps {
  selectedCountry: string | null;
  onAxisSelected?: (axisKey: string | null) => void
}



export default function StarCoordinates({ selectedCountry, onAxisSelected  }: StarCoordinatesProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [data, setData] = React.useState<DataRow[]>([]);
    const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
    const [selectedAxis, setSelectedAxis] = React.useState<string | null>(null);

    // data loading
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

    const onResize = useDebounceCallback((size: Size) => {
        setSize(size);
    }, 200);

    useResizeObserver({
        ref: containerRef as React.RefObject<HTMLDivElement>,
        onResize,
    });


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
        label: AXIS_LABELS[key] ?? key,
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
    const cx = width / 2 ;
    const cy = (height / 2) ;
    const radius = Math.min(width /2 , height  ) * .62 ; //plot size ratio modifier

    console.log(width)
    console.log(height)
    console.log("W/H above")
    const legendX = width * 0.7;
    const legendY = height * 0.08;
    const legendItemSpacing = 15;//height * .045;
    const legendSymbolSize = 50;

  return (
    <div 
      ref={containerRef}
      className="chart-container"
      style={{ width: "100%", height: "100%" }}
    >
      <h3 style={{ margin: ".5rem" , textAlign: "center", fontSize: "1.02rem"}}>Population Structure and Growth Metrics</h3>
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
    const xAxis = cx + radius * Math.cos(axis.angle);
    const yAxis = cy + radius * Math.sin(axis.angle);

    const labelOffset = radius + ( Math.min(width/2, height) * 0.04);
    const xLabel = cx + labelOffset * Math.cos(axis.angle) -7;
    const yLabel = cy + labelOffset * Math.sin(axis.angle);

    const words = axis.label.split(" ");
    const lineHeight = 12;
    const totalHeight = words.length * lineHeight;

    const isAxisSelected = selectedAxis === axis.key;

    return (
      <g 
        key={axis.key}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          const newSelection = selectedAxis === axis.key ? null : axis.key;
          setSelectedAxis(newSelection);
          if (onAxisSelected) onAxisSelected(newSelection);
        }}
      >
        {/* Axis line */}
        <line
          x1={cx}
          y1={cy}
          x2={xAxis}
          y2={yAxis}
          stroke={isAxisSelected ? "#000" : "#888"}  // Darker if selected
          strokeWidth={isAxisSelected ? 2.5 : 1}     // Thicker if selected
        />

        {/* Label */}
        <text
          x={xLabel}
          y={yLabel - totalHeight / 2 + 6}
          fontSize={lineHeight}
          fontWeight={isAxisSelected ? 'bold' : 'normal'}  // Bold if selected
          fill={isAxisSelected ? "#000" : "#333"}
          textAnchor={
            axis.angle === Math.PI ? "end" :
            axis.angle === 0 ? "start" : "middle"
          }
          dominantBaseline="middle"
        >
          {words.map((word, i) => (
            <tspan
              key={i}
              x={xLabel} 
              dy={i === 0 ? 0 : lineHeight} 
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
        const country = d.country as string; 

        // Check if this country is selected
        const isSelected = selectedCountry === country;
        const isOtherCountry = selectedCountry && !isSelected;

        const symbol = d3.symbol()
            .type(CONTINENT_SHAPES[continent] ?? DEFAULT_SHAPE)
	        .size(width * .04)();
	        //.size(32)(); // data point sizing here

        return (            
            <path
            key={i}
            d={symbol!}
            transform={`translate(${cx + p.x}, ${cy + p.y})`}
            fill={colorScale ? colorScale(year) : "red"}
            opacity={
                isSelected ? 1 :           // Full opacity if selected
                isOtherCountry ? 0.2 :    // Very dim if another country selected
                0.70                        // Normal opacity if nothing selected
            }
            stroke={isSelected ? "black" : "none"}  // Add stroke to selected
            strokeWidth={isSelected ? .5 : 0}
            />
        );
        
        })}
        {/* drawing ledgend    */}
        {colorScale && yearExtent && (
        <g transform={`translate(${width * 0.05}, ${height * 0.06})`}>
            {/* label */}
            <text
            x={(width * 0.3) / 2}
            y={-6}
            fontSize={11}
            textAnchor="middle"
            >
            Year
            </text>

            {/* gradient bar */}
            <rect
            width={width * 0.3}
            height={10}
            fill="url(#year-gradient)"
            rx={2}
            />

            {/* min year */}
            <text
            x={0}
            y={22}
            fontSize={10}
            textAnchor="start"
            >
            {yearExtent[0]}
            </text>

            {/* max year */}
            <text
            x={width * 0.3}
            y={22}
            fontSize={10}
            textAnchor="end"
            >
            {yearExtent[1]}
            </text>
        </g>
        )}
        {/* shape legend */}
        <g transform={`translate(${legendX}, ${legendY})`}>
        <text fontSize={13} fontWeight={600} y={-3} x={2}>
            Continent
        </text>

        {Object.entries(CONTINENT_SHAPES).map(([continent, symbolType], i) => {
            const symbolPath = d3.symbol()
            .type(symbolType)
            .size(legendSymbolSize)();

            return (
            <g key={continent} transform={`translate(0, ${i * legendItemSpacing})`}>
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
