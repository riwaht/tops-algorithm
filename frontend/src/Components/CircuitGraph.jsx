import React from "react";
import { Graph } from "react-d3-graph";

const config = {
  nodeHighlightBehavior: true,
  node: {
    size: 500,
    highlightStrokeColor: "blue",
    labelProperty: "label",
    fontSize: 12,
    fontColor: "#FFFFFF",
    symbolType: "circle",
  },
  link: {
    highlightColor: "blue",
  },
  directed: true,
  d3: {
    gravity: -200,
    linkLength: 200,
  },
  height: 500,
  width: 800,
};

function CircuitGraph({ data, faultSite, nodeValues, dFrontier }) {
  const valueColorMap = {
    0: "#ffcccc", // Light red
    1: "#ccffcc", // Light green
    X: "#cccccc", // Gray
    D: "#ffcc00", // Yellow
    "D'": "#ff9900", // Orange
  };

  const updatedNodes = data.nodes.map((node) => {
    const nodeValue = nodeValues[node.id] || "X";
    const nodeColor = valueColorMap[nodeValue] || "#ffffff";
    const isInDFrontier = dFrontier.includes(node.id);

    let strokeColor = "#000000";
    let strokeWidth = 1;

    if (node.id === faultSite) {
      strokeColor = "red";
      strokeWidth = 3;
    } else if (isInDFrontier) {
      strokeColor = "blue";
      strokeWidth = 3;
    }

    // Tooltip data
    const tooltipData = `Node ID: ${node.id}\nType: ${node.label}\nValue: ${nodeValue}`;

    // Modify the label to show the node ID and type
    return {
      ...node,
      color: nodeColor,
      label: `${node.id} ${node.label}(${nodeValue})`, // Changed label to use node.id
      strokeColor: strokeColor,
      strokeWidth: strokeWidth,
      svgTitle: tooltipData, // This will show up as a tooltip on hover
    };
  });

  const updatedLinks = data.links.map((link) => {
    const sourceValue = nodeValues[link.source] || "X";
    const linkColor = valueColorMap[sourceValue] || "#000000";

    return {
      ...link,
      color: linkColor,
    };
  });

  const updatedData = { ...data, nodes: updatedNodes, links: updatedLinks };

  const handleNodeClick = function (nodeId) {
    alert(`Node ID: ${nodeId}\nValue: ${nodeValues[nodeId] || "X"}`);
  };

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Graph
        id="graph-id"
        data={updatedData}
        config={config}
        onClickNode={handleNodeClick}
      />
    </div>
  );
}

export default CircuitGraph;
