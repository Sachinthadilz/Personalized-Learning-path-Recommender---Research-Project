import { useCallback, useEffect } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

interface CourseNode {
  id: string;
  name: string;
  difficulty: string;
  rating: number;
  similarity_score: number;
  url: string;
}

interface LearningPathGraphProps {
  learningPath: {
    beginner: CourseNode[];
    intermediate: CourseNode[];
    advanced: CourseNode[];
  };
  crossDomainCourses: Array<{
    id: string;
    course: string;
    domain: string;
    difficulty: string;
    rating: number;
    similarity_score: number;
    url: string;
  }>;
}

export default function LearningPathGraph({
  learningPath,
  crossDomainCourses,
}: LearningPathGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    let yOffset = 0;
    const xSpacing = 350;
    const ySpacing = 120;

    // Helper to create a node
    const createNode = (
      course: CourseNode,
      level: string,
      index: number,
      xPos: number
    ) => {
      const colors = {
        Beginner: { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
        Intermediate: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
        Advanced: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
      };

      const color = colors[level as keyof typeof colors] || colors.Beginner;

      return {
        id: course.id,
        type: "default",
        position: { x: xPos, y: yOffset + index * ySpacing },
        data: {
          label: (
            <div style={{ padding: "10px", minWidth: "250px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: color.text,
                }}
              >
                {course.name.length > 50
                  ? course.name.substring(0, 50) + "..."
                  : course.name}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                ⭐ {course.rating?.toFixed(1) || "N/A"} |
                {(course.similarity_score * 100).toFixed(0)}% Match
              </div>
            </div>
          ),
        },
        style: {
          background: color.bg,
          border: `2px solid ${color.border}`,
          borderRadius: "8px",
          fontSize: "12px",
          width: 280,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    };

    // Add Beginner nodes
    learningPath.beginner.forEach((course, idx) => {
      newNodes.push(createNode(course, "Beginner", idx, 0));
    });
    yOffset += Math.max(learningPath.beginner.length, 1) * ySpacing + 50;

    // Add Intermediate nodes and connect to beginners
    learningPath.intermediate.forEach((course, idx) => {
      newNodes.push(createNode(course, "Intermediate", idx, xSpacing));

      // Connect to last beginner node
      if (learningPath.beginner.length > 0) {
        newEdges.push({
          id: `b-${
            learningPath.beginner[learningPath.beginner.length - 1].id
          }-${course.id}`,
          source: learningPath.beginner[learningPath.beginner.length - 1].id,
          target: course.id,
          animated: true,
          style: { stroke: "#10b981" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
        });
      }
    });
    yOffset += Math.max(learningPath.intermediate.length, 1) * ySpacing + 50;

    // Add Advanced nodes and connect to intermediate
    learningPath.advanced.forEach((course, idx) => {
      newNodes.push(createNode(course, "Advanced", idx, xSpacing * 2));

      // Connect to last intermediate node
      if (learningPath.intermediate.length > 0) {
        newEdges.push({
          id: `i-${
            learningPath.intermediate[learningPath.intermediate.length - 1].id
          }-${course.id}`,
          source:
            learningPath.intermediate[learningPath.intermediate.length - 1].id,
          target: course.id,
          animated: true,
          style: { stroke: "#f59e0b" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
        });
      }
    });

    // Add cross-domain courses
    const crossDomainYStart = 50;
    crossDomainCourses.forEach((item, idx) => {
      const cdNode: Node = {
        id: `cd-${item.id}`,
        type: "default",
        position: { x: xSpacing * 3, y: crossDomainYStart + idx * ySpacing },
        data: {
          label: (
            <div style={{ padding: "10px", minWidth: "250px" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "#7c3aed",
                  fontWeight: "bold",
                  marginBottom: "3px",
                }}
              >
                🌐 {item.domain}
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#581c87",
                }}
              >
                {item.course.length > 50
                  ? item.course.substring(0, 50) + "..."
                  : item.course}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>
                ⭐ {item.rating?.toFixed(1) || "N/A"} |
                {(item.similarity_score * 100).toFixed(0)}% Match
              </div>
            </div>
          ),
        },
        style: {
          background: "#faf5ff",
          border: "2px solid #7c3aed",
          borderRadius: "8px",
          fontSize: "12px",
          width: 280,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };

      newNodes.push(cdNode);

      // Connect cross-domain to relevant level courses
      if (item.difficulty === "Beginner" && learningPath.beginner.length > 0) {
        newEdges.push({
          id: `cd-${item.id}-b`,
          source: learningPath.beginner[0].id,
          target: `cd-${item.id}`,
          style: { stroke: "#7c3aed", strokeDasharray: "5,5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#7c3aed" },
          label: "Related",
          labelStyle: { fontSize: 10, fill: "#7c3aed" },
        });
      } else if (
        item.difficulty === "Intermediate" &&
        learningPath.intermediate.length > 0
      ) {
        newEdges.push({
          id: `cd-${item.id}-i`,
          source: learningPath.intermediate[0].id,
          target: `cd-${item.id}`,
          style: { stroke: "#7c3aed", strokeDasharray: "5,5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#7c3aed" },
          label: "Related",
          labelStyle: { fontSize: 10, fill: "#7c3aed" },
        });
      } else if (
        item.difficulty === "Advanced" &&
        learningPath.advanced.length > 0
      ) {
        newEdges.push({
          id: `cd-${item.id}-a`,
          source: learningPath.advanced[0].id,
          target: `cd-${item.id}`,
          style: { stroke: "#7c3aed", strokeDasharray: "5,5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#7c3aed" },
          label: "Related",
          labelStyle: { fontSize: 10, fill: "#7c3aed" },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [learningPath, crossDomainCourses, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const courseId = node.id.replace("cd-", "");
      const course = [
        ...learningPath.beginner,
        ...learningPath.intermediate,
        ...learningPath.advanced,
      ].find((c) => c.id === courseId);

      const crossCourse = crossDomainCourses.find(
        (c) => `cd-${c.id}` === node.id
      );

      const url = course?.url || crossCourse?.url;
      if (url) {
        window.open(url, "_blank");
      }
    },
    [learningPath, crossDomainCourses]
  );

  return (
    <div
      style={{ width: "100%", height: "700px" }}
      className="bg-white rounded-lg shadow-lg border-2 border-gray-200"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background color="#e5e7eb" gap={16} />
      </ReactFlow>
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
            <span>Beginner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border-2 border-orange-500 rounded"></div>
            <span>Intermediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
            <span>Advanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-600 rounded"></div>
            <span>Cross-Domain</span>
          </div>
          <div className="ml-auto text-gray-600">
            💡 Click any course node to open its link
          </div>
        </div>
      </div>
    </div>
  );
}
