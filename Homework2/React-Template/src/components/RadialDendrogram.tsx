import { useEffect, useRef } from "react";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type DendrogramNode = {
  name: string;
  children?: DendrogramNode[];
};

type Props = {
  data: DendrogramNode;
};

export default function RadialDendrogram({ data }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const width = 420;
    const radius = width / 2;

    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", width)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const root = d3.hierarchy(data);

    const cluster = d3
      .cluster<DendrogramNode>()
      .size([2 * Math.PI, radius - 60]);

    cluster(root);

    const linkGenerator = d3
      .linkRadial<d3.HierarchyPointLink<DendrogramNode>, d3.HierarchyPointNode<DendrogramNode>>()
      .angle(d => d.x)
      .radius(d => d.y);

    // Links
    svg.append("g")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", "#bdbdbd")
      .attr("stroke-width", 1);

    // Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr(
        "transform",
        d => `
          rotate(${(d.x * 180) / Math.PI - 90})
          translate(${d.y},0)
        `
      );

    node.append("circle")
      .attr("r", 3)
      .attr("fill", d => (d.children ? "#616161" : "#d32f2f"));

    // Labels (leaves only)
    node.filter(d => !d.children)
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", d => (d.x < Math.PI ? 6 : -6))
      .attr("text-anchor", d => (d.x < Math.PI ? "start" : "end"))
      .attr("transform", d => (d.x >= Math.PI ? "rotate(180)" : null))
      .style("font-size", "10px")
      .text(d => d.data.name);

  }, [data]);

  return (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        Country Clusters by Population Pressure Profile
      </Typography>
      <Box ref={ref} display="flex" justifyContent="center" />
    </Box>
  );
}
