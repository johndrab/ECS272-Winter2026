import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from 'usehooks-ts';

interface StarDatum {
  country: string;
  year: string;
  pressure: number;
  ozone: number;
  co2: number;
}

export default function StarCoordinates() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useResizeObserver({
    ref: containerRef as React.RefObject<HTMLDivElement>,
    onResize: setSize,
  });

  useEffect(() => {
    if (!size.width || !size.height) return;

    d3.select('#star-svg').selectAll('*').remove();

    const svg = d3
      .select('#star-svg')
      .attr('width', size.width)
      .attr('height', size.height);

    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', size.height / 2)
      .attr('text-anchor', 'middle')
      .text('Star Coordinates Plot');
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    >
      <svg id="star-svg" />
    </div>
  );
}
