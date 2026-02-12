import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';
import { Stack,  Box, FormControl, MenuItem, InputLabel, Select } from '@mui/material';


interface HeatmapDatum {
  country: string;
  year: string;
  fertility_rate: number;
  continent: string;
}

interface FilterProps {
  onCountrySelected?: (country: string | null) => void;
}


export default function Example({ onCountrySelected }: FilterProps) {
  const [data, setData] = useState<HeatmapDatum[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: size.height * 0.13, right: 5, bottom: Math.max(size.height * 0.11, 30), left: 90 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);
  const [sortMode, setSortMode] = useState<'alphabetical' | 'continent'>('alphabetical');

  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const csvData = await d3.csv('/data/population_growth.csv', d => ({
          country: d.country ?? '',
          year: d.year ?? '',
          fertility_rate: d.fertility_rate ? +d.fertility_rate : 0, 
          continent: d.continent ?? ''

        }));
        setData(csvData as HeatmapDatum[]);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    loadCSV();
  }, []);

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;

    // d3.select('#heatmap-svg').selectAll('*').remove();
    // initChart();

    if (!d3.select('#heatmap-svg').select('g.heatmap-group').node()) {
      initChart();
    } else {
      // Update positions for sorting
      updateChart();
    }
    
  }, [data, size, sortMode]);

// ------------------ INIT CHART ------------------
function initChart() {
  const filteredData = data.filter(d => d.country && d.year && !isNaN(d.fertility_rate));
  const years = Array.from(new Set(filteredData.map(d => d.year)));
  let countries = Array.from(new Set(filteredData.map(d => d.country)));

  const continentMap = new Map(filteredData.map(d => [d.country, d.continent]));

  // Initial sorting
  countries.sort((a, b) => {
    if (sortMode === 'alphabetical') return d3.ascending(a, b);
    const ca = continentMap.get(a) ?? '';
    const cb = continentMap.get(b) ?? '';
    const cmp = d3.ascending(ca, cb);
    return cmp !== 0 ? cmp : d3.ascending(a, b);
  });

  const sliceData = filteredData.filter(d => countries.includes(d.country) && years.includes(d.year));

  const xScale = d3.scaleBand()
    .domain(years)
    .range([margin.left, size.width - margin.right])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(countries)
    .range([margin.top, size.height - margin.bottom])
    .padding(0.05);

  const fertility_rateExtent = d3.extent(sliceData, d => d.fertility_rate) as [number, number];
  const colorScale = d3.scaleSequential(d3.interpolateYlOrBr).domain(fertility_rateExtent);

  const svg = d3.select('#heatmap-svg');

  // ---------------- RECT GROUP ----------------
  const heatmapG = svg.append('g')
    .attr('class', 'heatmap-group');

  heatmapG.selectAll('rect')
    .data(sliceData, (d: any) => d.country + d.year)
    .join('rect')
    .attr('x', d => xScale(d.year)!)
    .attr('y', d => yScale(d.country)!)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colorScale(d.fertility_rate))
    .attr('cursor', 'pointer')  // Add here
    .on('click', function(event: any, d: any) {  // Add here
      setSelectedCountry(prev => prev === d.country ? null : d.country);
    });

  // ---------------- Y AXIS ----------------
  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // ---------------- X AXIS ----------------
  const axisFontScale = d3.scaleLinear().domain([300, 900]).range([3, 12]).clamp(true);
  const axisFontSize = axisFontScale(size.width * 0.9);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${size.height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(-35)')
    .style('text-anchor', 'end')
    .attr('dx', '-0.6em')
    .style('font-size', `${axisFontSize}px`);

  // ---------------- CONTINENT SEPARATORS ----------------
  drawContinentSeparators(svg, countries, continentMap, yScale);

  // ---------------- AXIS LABELS ----------------
  svg.append('text')
    .attr('x', size.width * 0.45)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-weight', 'bold')
    .text('Population Fertility Rate by Country and Year');

  svg.append('text')
    .attr('x', size.width / 2)
    .attr('y', size.height)
    .attr('text-anchor', 'middle')
    .style('font-size', '.8rem')
    .text('Year');

  svg.append('text')
    .attr('transform', `translate(25, ${size.height / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .style('font-size', '.8rem')
    .text('Country');

  // ---------------- LEGEND ----------------
  drawLegend(svg, fertility_rateExtent, colorScale);
}


const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

useEffect(() => {
  const svg = d3.select('#heatmap-svg');
  const heatmapG = svg.select('g.heatmap-group');

  heatmapG.selectAll('rect')
    .transition()
    .duration(500)
    .attr('stroke', (d: any) => d.country === selectedCountry ? 'grey' : 'none')
    .attr('stroke-width', (d: any) => d.country === selectedCountry ? 2 : 0)
    .attr('opacity', (d: any) => {
      if (!selectedCountry) return 1;  // No selection = full opacity
      return d.country === selectedCountry ? 1 : 0.3;  // Selected vs others
    });

  // Optional callback for other plots
  if (onCountrySelected) {
    onCountrySelected(selectedCountry);
  }

}, [selectedCountry]);


// ------------------ UPDATE CHART ------------------
function updateChart() {
  const filteredData = data.filter(d => d.country && d.year && !isNaN(d.fertility_rate));
  const years = Array.from(new Set(filteredData.map(d => d.year)));
  let countries = Array.from(new Set(filteredData.map(d => d.country)));

  const continentMap = new Map(filteredData.map(d => [d.country, d.continent]));

  // Sort countries
  countries.sort((a, b) => {
    if (sortMode === 'alphabetical') return d3.ascending(a, b);
    const ca = continentMap.get(a) ?? '';
    const cb = continentMap.get(b) ?? '';
    const cmp = d3.ascending(ca, cb);
    return cmp !== 0 ? cmp : d3.ascending(a, b);
  });

  const yScale = d3.scaleBand()
    .domain(countries)
    .range([margin.top, size.height - margin.bottom])
    .padding(0.05);

  const svg = d3.select('#heatmap-svg');
  const heatmapG = svg.select('g.heatmap-group');

  // ---------------- Animate rects ----------------
  heatmapG.selectAll('rect')
    .transition()
    .duration(750)
    .attr('y', (d: any) => yScale(d.country)!)
    .attr('stroke', (d: any) => d.country === selectedCountry ? 'grey' : 'none')
    .attr('stroke-width', (d: any) => d.country === selectedCountry ? 2 : 0)
    .attr('opacity', (d: any) => {
      if (!selectedCountry) return 1;  // No selection = full opacity
      return d.country === selectedCountry ? 1 : 0.3;  // Selected vs others
    });

  // Update y-axis
  svg.select('.y-axis')
    .transition()
    .duration(750)
    .call(d3.axisLeft(yScale));

  drawContinentSeparators(svg, countries, continentMap, yScale);
}

// ------------------ CONTINENT SEPARATORS ------------------
function drawContinentSeparators(svg: any, countries: string[], continentMap: Map<string, string>, yScale: any) {
  if (sortMode !== 'continent') {
    svg.selectAll('.continent-separator-group').remove();
    return;
  }

  const orderedContinents = countries.map(c => continentMap.get(c));
  const continentBoundaries: number[] = [];
  for (let i = 1; i < orderedContinents.length; i++) {
    if (orderedContinents[i] !== orderedContinents[i - 1]) continentBoundaries.push(i);
  }

  const separatorG = svg.selectAll('.continent-separator-group')
    .data([0]); // just one group
    const g = separatorG.join(
      enter => enter.append('g').attr('class', 'continent-separator-group'),
      update => update
    );

  // Lines
  const lines = g.selectAll('line')
    .data(continentBoundaries);
  lines.join(
    enter => enter.append('line')
      .attr('x1', margin.left)
      .attr('x2', size.width - margin.right)
      .attr('y1', d => yScale(countries[d])!)
      .attr('y2', d => yScale(countries[d])!)
      .attr('stroke', '#444')
      .attr('stroke-width', 1.5),
    update => update
      .transition()
      .duration(750)
      .attr('y1', d => yScale(countries[d])!)
      .attr('y2', d => yScale(countries[d])!),
    exit => exit.remove()
  );

  // Continent Labels
  const continentStarts = [0, ...continentBoundaries];
  const texts = g.selectAll('text')
    .data(continentStarts);
  texts.join(
    enter => enter.append('text')
      .attr('x', size.width - 9)
      .attr('y', d => yScale(countries[d])! + 12)
      .attr('text-anchor', 'end')
      .style('font-weight', 'normal')
      .style('font-size', '0.7rem')
      .text(d => continentMap.get(countries[d]) ?? ''),
    update => update
      .transition()
      .duration(750)
      .attr('y', d => yScale(countries[d])! + 12)
      .text(d => continentMap.get(countries[d]) ?? ''),
    exit => exit.remove()
  );
}

// ------------------ LEGEND ------------------
function drawLegend(svg: any, fertility_rateExtent: [number, number], colorScale: any) {
  const legendWidth = size.width * 0.1;
  const legendHeight = size.height * 0.03;
  const legendG = svg.selectAll('.legend-group').data([0])
    .join(enter => enter.append('g').attr('class', 'legend-group'))
    .attr('transform', `translate(${(size.width * .80)}, ${size.height * .05})`);

  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
  const linearGradient = defs.selectAll('#legend-gradient').data([0])
    .join(enter => enter.append('linearGradient').attr('id', 'legend-gradient'));

  linearGradient.selectAll('stop')
    .data(d3.ticks(0, 1, 10))
    .join('stop')
    .attr('offset', d => `${d * 100}%`)
    .attr('stop-color', d => colorScale(fertility_rateExtent[0] + d * (fertility_rateExtent[1] - fertility_rateExtent[0])));

  legendG.selectAll('rect')
    .data([0])
    .join('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#legend-gradient)');

  const legendScale = d3.scaleLinear().domain(fertility_rateExtent).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(4);

  legendG.selectAll('g').data([0])
    .join('g')
    .attr('transform', `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legendG.selectAll('text.legend-label').data([0])
    .join('text')
    .attr('class', 'legend-label')
    .attr('y', -6)
    .style('font-size', '.7rem')
    .text('Fertility Rate');
}


  return (
  <Stack sx={{ width: '100%', height: '100%' }} spacing={1}>

    <Box sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center'}}>
      <span>Sort Countries by</span>
      <select onChange={(e) => setSortMode(e.target.value as any)} style={{ marginLeft: '6px' }}>
        <option value="alphabetical">Alphabetical</option>
        <option value="continent">Continent</option>
      </select>
    </Box>

    <Box ref={containerRef} sx={{ flex: 1 }}>
      <svg id="heatmap-svg" width="100%" height="100%" />
    </Box>

  </Stack>
  );
}

