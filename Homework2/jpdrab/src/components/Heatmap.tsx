import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { ComponentSize, Margin } from '../types';

interface HeatmapDatum {
  country: string;
  year: string;
  fertility_rate: number;
}

export default function Example() {
  const [data, setData] = useState<HeatmapDatum[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: size.height * 0.15, right: 5, bottom: size.height * 0.11, left: 90 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const csvData = await d3.csv('/data/population_growth.csv', d => ({
          country: d.country ?? '',
          year: d.year ?? '',
          fertility_rate: d.fertility_rate ? +d.fertility_rate : 0, 

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

    d3.select('#heatmap-svg').selectAll('*').remove();

    initChart();
  }, [data, size]);

  function initChart() {
    const filteredData = data.filter(d => d.country && d.year && !isNaN(d.fertility_rate));

    const years = Array.from(new Set(filteredData.map(d => d.year)));
    const countries = Array.from(new Set(filteredData.map(d => d.country).sort()));

    const sliceData = data.filter(d => 
  countries.includes(d.country) && years.includes(d.year)
);

    const xScale = d3.scaleBand()
      .domain(years)
      .range([margin.left, size.width - margin.right])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(countries)
      .range([margin.top, size.height - margin.bottom])
      .padding(0.05);

    const axisFontScale = d3.scaleLinear()
      .domain([300, 900])   // small laptop → desktop
      .range([3, 12])       // font size range (px)
      .clamp(true);

    const axisFontSize = axisFontScale(size.width * 0.9);



    const fertility_rateExtent = d3.extent(sliceData, d => d.fertility_rate) as [number, number];
    const colorScale = d3.scaleSequential(d3.interpolateYlOrBr).domain(fertility_rateExtent);

    const svg = d3.select('#heatmap-svg'); // heat map 
    const heatmapG = svg.append('g');

    heatmapG.selectAll('rect')
      .data(sliceData)
      .join('rect')
      .attr('x', d => xScale(d.year)!)
      .attr('y', d => yScale(d.country)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.fertility_rate));

    // axes 
    //svg.append('g')
    //  .attr('transform', `translate(0, ${size.height - margin.bottom})`)
    //  .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % 1 === 0)))
    //  .selectAll("text")
    //  .attr("transform", "rotate(-35)")
    //  .style("text-anchor", "end");

    svg.append('g')
      .attr('transform', `translate(0, ${size.height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale)
          .tickValues(xScale.domain().filter((_, i) => i % 1 === 0))
      )
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .attr("dx", "-0.6em")
      .style("font-size", `${axisFontSize}px`);



    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    svg.append('text')
      .attr('x', size.width * .45)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Population Fertility Rate by Country and Year');

    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height )
      .attr('text-anchor', 'middle')
      .style('font-size', '.8rem')
      .text('Year');

    svg.append('text')
      .attr('transform', `translate(25, ${size.height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .style('font-size', '.8rem')
      .text('Country');

    // for creating the ledgend 
    const legendWidth = size.width * 0.1;
    const legendHeight = size.height * 0.03;
    const legendG = svg.append('g')
      .attr('transform', `translate(${(size.width * .86)}, ${size.height * .05 })`);

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient');

    linearGradient.selectAll('stop')
      .data(d3.ticks(0, 1, 10))
      .join('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(fertility_rateExtent[0] + d * (fertility_rateExtent[1] - fertility_rateExtent[0])));

    legendG.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    const legendScale = d3.scaleLinear().domain(fertility_rateExtent).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(4);

    legendG.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis);

    legendG.append('text')
      .attr('y', -6)
      .style('font-size', '.7rem')
      .text('Fertility Rate');
  }

// style={{ width: '100%', height: '800px' }}

  return (
    <div ref={containerRef} className='chart-container' > 
      <svg id="heatmap-svg" width='100%' height='100%'/>
    </div>
  );
}
