import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { AISearchResult, CrossDomainCourse } from "../api";

interface LearningPathGraphD3Props {
  learningPath: {
    beginner: AISearchResult[];
    intermediate: AISearchResult[];
    advanced: AISearchResult[];
  };
  crossDomainCourses: CrossDomainCourse[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "cross-domain";
  url: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "progression" | "cross-domain";
}

export default function LearningPathGraphD3({
  learningPath,
  crossDomainCourses,
}: LearningPathGraphD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 1200;
    const height = 800;

    // Create nodes
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add beginner nodes
    learningPath.beginner.forEach((course, idx) => {
      nodes.push({
        id: `b-${course.id}`,
        name: course.name,
        level: "beginner",
        url: course.url,
        fx: 200,
        fy: 100 + idx * 100,
      });
    });

    // Add intermediate nodes
    learningPath.intermediate.forEach((course, idx) => {
      const nodeId = `i-${course.id}`;
      nodes.push({
        id: nodeId,
        name: course.name,
        level: "intermediate",
        url: course.url,
        fx: 500,
        fy: 100 + idx * 100,
      });

      // Connect to all beginners
      learningPath.beginner.forEach((bCourse) => {
        links.push({
          source: `b-${bCourse.id}`,
          target: nodeId,
          type: "progression",
        });
      });
    });

    // Add advanced nodes
    learningPath.advanced.forEach((course, idx) => {
      const nodeId = `a-${course.id}`;
      nodes.push({
        id: nodeId,
        name: course.name,
        level: "advanced",
        url: course.url,
        fx: 800,
        fy: 100 + idx * 100,
      });

      // Connect to all intermediates
      learningPath.intermediate.forEach((iCourse) => {
        links.push({
          source: `i-${iCourse.id}`,
          target: nodeId,
          type: "progression",
        });
      });
    });

    // Add cross-domain nodes
    crossDomainCourses.slice(0, 5).forEach((course, idx) => {
      const nodeId = `cd-${course.id}`;
      nodes.push({
        id: nodeId,
        name: course.course,
        level: "cross-domain",
        url: course.url,
        fx: 1000,
        fy: 150 + idx * 120,
      });

      // Connect to random courses from main path
      const allMainCourses = [
        ...learningPath.beginner.map((c) => `b-${c.id}`),
        ...learningPath.intermediate.map((c) => `i-${c.id}`),
        ...learningPath.advanced.map((c) => `a-${c.id}`),
      ];

      if (allMainCourses.length > 0) {
        const randomCourse =
          allMainCourses[Math.floor(Math.random() * allMainCourses.length)];
        links.push({
          source: randomCourse,
          target: nodeId,
          type: "cross-domain",
        });
      }
    });

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create arrow markers
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow-progression")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow-cross-domain")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#a855f7");

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.type === "progression" ? "#64748b" : "#a855f7"))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.type === "progression" ? "0" : "5,5"))
      .attr("marker-end", (d) =>
        d.type === "progression"
          ? "url(#arrow-progression)"
          : "url(#arrow-cross-domain)"
      );

    // Create node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", (_event, d) => {
        if (d.url) {
          window.open(d.url, "_blank");
        }
      });

    // Add circles
    node
      .append("circle")
      .attr("r", 20)
      .attr("fill", (d) => {
        switch (d.level) {
          case "beginner":
            return "#10b981";
          case "intermediate":
            return "#f59e0b";
          case "advanced":
            return "#ef4444";
          case "cross-domain":
            return "#a855f7";
          default:
            return "#6b7280";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add hover effect
    node
      .on("mouseenter", function () {
        d3.select(this).select("circle").attr("r", 25).attr("stroke-width", 3);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").attr("r", 20).attr("stroke-width", 2);
      });

    // Add labels
    node
      .append("text")
      .text((d) => {
        return d.name.length > 30 ? d.name.substring(0, 27) + "..." : d.name;
      })
      .attr("x", 0)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#1f2937")
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Drag functions
    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>
    ) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [learningPath, crossDomainCourses]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Learning Path Graph
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Beginner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Intermediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span>Cross-Domain</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click nodes to open course • Drag to rearrange • Scroll to zoom
        </p>
      </div>
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
