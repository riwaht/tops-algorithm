import React, { useState, useEffect } from "react";
import CircuitGraph from "./Components/CircuitGraph";
import ControlPanel from "./Components/ControlPanel";
import StackView from "./Components/StackView";

const initialData = {
  nodes: [
    { id: "Input1", label: "Input", value: "X" },
    { id: "Input2", label: "Input", value: "X" },
    { id: "Input3", label: "Input", value: "X" },
    { id: "Gate1", label: "AND Gate", value: "X" },
    { id: "Gate2", label: "OR Gate", value: "X" },
    { id: "Output1", label: "Output", value: "X" },
  ],
  links: [
    { source: "Input1", target: "Gate1" },
    { source: "Input2", target: "Gate1" },
    { source: "Gate1", target: "Gate2" },
    { source: "Input3", target: "Gate2" },
    { source: "Gate2", target: "Output1" },
  ],
};

const LOGIC_VALUES = ["0", "1", "X", "D", "D'", "B0", "B1", "G0", "G1"];

function App() {
  const [data] = useState(initialData);
  const [faultSite, setFaultSite] = useState("Gate1");
  const [nodeValues, setNodeValues] = useState({
    Input1: "X",
    Input2: "X",
    Input3: "X",
    Gate1: "X",
    Gate2: "X",
    Output1: "X",
  });
  const [searchStack, setSearchStack] = useState([]);
  const [dFrontier, setDFrontier] = useState([]);
  const [basisNodes, setBasisNodes] = useState([]);
  const [dominators, setDominators] = useState({});

  // Preprocessing to calculate basis-nodes and dominators
  useEffect(() => {
    const { calculatedBasisNodes, calculatedDominators } = preprocessCircuit(data);
    setBasisNodes(calculatedBasisNodes);
    setDominators(calculatedDominators);
  }, [data]);

  const preprocessCircuit = (circuitData) => {
    return {
      calculatedBasisNodes: ["Input1", "Input2", "Input3"],
      calculatedDominators: {
        Gate1: ["Gate1", "Gate2", "Output1"],
        Gate2: ["Gate2", "Output1"],
      },
    };
  };

  // Fault Sensitization
  const handleFaultSensitization = () => {
    const newValues = { ...nodeValues };
    newValues[faultSite] = "D"; // Sensitize the fault site
    setNodeValues(newValues);

    // Recalculate implications from the fault site
    calculateImplications(faultSite, newValues);

    // Update the D-frontier
    updateDFrontier();

    if (detectConflict()) {
      alert("Conflict detected during fault sensitization! Fault is redundant.");
    }
  };

  // Fault Cone Tracing
  const handleFaultConeTracing = () => {
    const newValues = { ...nodeValues };
    const faultObservationPath = traceFaultObservationPath(faultSite);

    faultObservationPath.forEach((gateId) => {
      // Skip re-evaluating the fault site to prevent overwriting the fault value
      if (gateId === faultSite) {
        return; // Continue to the next gate in the path
      }

      const inputs = getGateInputs(gateId);
      const gate = data.nodes.find((n) => n.id === gateId);
      const gateType = gate.label;

      // Assign non-controlling values to unassigned inputs
      inputs.forEach((inputId) => {
        if (newValues[inputId] === "X") {
          const nonControllingValue = getNonControllingValue(gateType);
          newValues[inputId] = nonControllingValue;
        }
      });

      const inputValues = inputs.map((id) => newValues[id] || "X");
      console.log(`Evaluating ${gate.label} (${gateId}): Inputs = ${inputValues}`);

      if (gate.label === "AND Gate") {
        newValues[gateId] = evaluateAndGate(inputValues);
      } else if (gate.label === "OR Gate") {
        newValues[gateId] = evaluateOrGate(inputValues);
      } else if (gate.label === "Output") {
        // For Output nodes, assign the input value directly
        newValues[gateId] = inputValues[0]; // Assuming only one input
      }

      console.log(`Updated ${gate.label} (${gateId}): Output = ${newValues[gateId]}`);
    });

    setNodeValues(newValues);
    updateDFrontier();

    if (detectConflict()) {
      alert("Conflict detected during fault cone tracing! Fault is redundant.");
    }
  };

  // Update D-Frontier
  const updateDFrontier = () => {
    const newDFrontier = [];

    data.nodes.forEach((node) => {
      const outputs = getGateOutputs(node.id);
      const nodeValue = nodeValues[node.id];

      if (
        (nodeValue === "D" || nodeValue === "D'") &&
        outputs.some((outputId) => nodeValues[outputId] === "X")
      ) {
        newDFrontier.push(node.id);
      }
    });

    setDFrontier(newDFrontier);
  };

  // Conflict Detection
  const detectConflict = () => {
    let conflictDetected = false;
    Object.keys(nodeValues).forEach((nodeId) => {
      const value = nodeValues[nodeId];
      if (value === "CONFLICT") {
        conflictDetected = true;
      }
    });
    return conflictDetected;
  };

  const backtrack = () => {
    if (searchStack.length > 0) {
      const lastState = searchStack.pop();
      setNodeValues(lastState.nodeValues);
      setDFrontier(lastState.dFrontier);
      setSearchStack([...searchStack]);
    } else {
      alert("No more assignments to backtrack. Fault is redundant.");
    }
  };

  // Dynamic Implication Handling
  const calculateImplications = (nodeId, newValues) => {
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const node = data.nodes.find((n) => n.id === currentNodeId);
      const gateType = node.label;

      if (
        currentNodeId === faultSite &&
        (newValues[currentNodeId] === "D" || newValues[currentNodeId] === "D'")
      ) {
        const inputs = getGateInputs(currentNodeId);
        inputs.forEach((inputId) => {
          if (newValues[inputId] === "X") {
            // Assign non-controlling value to inputs to activate the fault
            newValues[inputId] = getNonControllingValue(gateType);
            queue.push(inputId);
          } else if (newValues[inputId] !== getNonControllingValue(gateType)) {
            newValues[inputId] = "CONFLICT";
          }
        });
        continue;
      }

      const inputs = getGateInputs(currentNodeId);
      const inputValues = inputs.map((id) => newValues[id] || "X");
      let outputValue = newValues[currentNodeId];

      if (gateType === "AND Gate") {
        outputValue = evaluateAndGate(inputValues);
      } else if (gateType === "OR Gate") {
        outputValue = evaluateOrGate(inputValues);
      }

      if (newValues[currentNodeId] !== outputValue) {
        newValues[currentNodeId] = outputValue;
        const outputs = getGateOutputs(currentNodeId);
        queue.push(...outputs);
      }

      if (newValues[currentNodeId] === "CONFLICT") {
        break;
      }
    }
    setNodeValues(newValues);
  };

  // Gate evaluation functions
  const evaluateAndGate = (inputValues) => {
    if (inputValues.includes("0")) return "0";
    if (inputValues.includes("D'")) {
      return inputValues.every((val) => val === "D'" || val === "1") ? "D'" : "X";
    }
    if (inputValues.includes("D")) {
      return inputValues.every((val) => val === "D" || val === "1") ? "D" : "X";
    }
    if (inputValues.includes("X")) return "X";
    return "1";
  };

  const evaluateOrGate = (inputValues) => {
    if (inputValues.includes("1")) return "1";
    if (inputValues.includes("D")) {
      return inputValues.every((val) => val === "D" || val === "0") ? "D" : "X";
    }
    if (inputValues.includes("D'")) {
      return inputValues.every((val) => val === "D'" || val === "0") ? "D'" : "X";
    }
    if (inputValues.includes("X")) return "X";
    return "0";
  };

  const getGateInputs = (gateId) => {
    return data.links.filter((link) => link.target === gateId).map((link) => link.source);
  };

  const getGateOutputs = (gateId) => {
    return data.links.filter((link) => link.source === gateId).map((link) => link.target);
  };

  const getNonControllingValue = (gateType) => {
    const gateNonControllingValues = {
      "AND Gate": "1",
      "OR Gate": "0",
    };
    return gateNonControllingValues[gateType] || "X";
  };

  const traceFaultObservationPath = (startNode) => {
    const path = [];
    const queue = [startNode];
    const visited = new Set();

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (!visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        path.push(currentNodeId);
        const outputs = getGateOutputs(currentNodeId);
        queue.push(...outputs);
      }
    }
    return path;
  };

  const checkForTest = () => {
    if (nodeValues["Output1"] === "D" || nodeValues["Output1"] === "D'") {
      alert("Test pattern found! Fault propagated to primary output.");
      return true;
    }
    return false;
  };

  const checkObservationPaths = () => {
    const pathsBlocked = dFrontier.length === 0;
    if (pathsBlocked && !checkForTest()) {
      alert("All observation paths are blocked. Backtracking...");
      backtrack();
    }
  };

  useEffect(() => {
    checkObservationPaths();
  }, [nodeValues, dFrontier]);

  const cleanupBasisNodes = () => {
    const newValues = { ...nodeValues };
    basisNodes.forEach((basisNode) => {
      if (newValues[basisNode] === "X") {
        newValues[basisNode] = determineFinalValue(basisNode, newValues);
      }
    });
    setNodeValues(newValues);
    alert("Cleanup phase complete.");
  };

  const determineFinalValue = (nodeId, values) => {
    // Assign non-controlling values to inputs not yet assigned
    if (["Input1", "Input2"].includes(nodeId)) {
      return "1"; // Non-controlling value for AND Gate to keep fault activated
    }
    if (nodeId === "Input3") {
      return "0"; // Non-controlling value for OR Gate to allow fault propagation
    }
    return "X";
  };

  const performSearch = () => {
    if (detectConflict()) {
      backtrack();
      return;
    }

    if (checkForTest()) {
      cleanupBasisNodes();
      return;
    }

    const subgoal = selectSubgoal();
    if (!subgoal) {
      alert("No subgoals remaining. Test pattern found!");
      cleanupBasisNodes();
      return;
    }

    const basisNode = backtraceToBasisNode(subgoal);
    if (!basisNode) {
      alert("No basis node found. Backtracking...");
      backtrack();
      return;
    }

    searchStack.push({
      nodeValues: { ...nodeValues },
      dFrontier: [...dFrontier],
    });
    setSearchStack([...searchStack]);

    const assignment = assignValueToBasisNode(basisNode, subgoal);
    const newValues = { ...nodeValues, ...assignment };
    setNodeValues(newValues);
    calculateImplications(basisNode, newValues);
    updateDFrontier();
  };

  const selectSubgoal = () => {
    if (dFrontier.length > 0) {
      return dFrontier[0];
    }
    return null;
  };

  const backtraceToBasisNode = (subgoal) => {
    let currentNodeId = subgoal;
    while (!basisNodes.includes(currentNodeId)) {
      const inputs = getGateInputs(currentNodeId);
      const node = data.nodes.find((n) => n.id === currentNodeId);
      const gateType = node.label;

      // Choose an input to control
      let inputToControl = inputs.find((id) => nodeValues[id] === "X");
      if (!inputToControl) {
        // All inputs are assigned; cannot backtrace further
        return null;
      }

      currentNodeId = inputToControl;
    }
    return currentNodeId;
  };

  const assignValueToBasisNode = (basisNode, subgoal) => {
    const gate = data.nodes.find((n) => n.id === subgoal);
    const gateType = gate.label;

    const requiredValue = getNonControllingValue(gateType);
    return { [basisNode]: requiredValue };
  };

  const handleStart = () => {
    setSearchStack([]);
    performSearch();
  };

  const handleReset = () => {
    setSearchStack([]);
    setNodeValues({
      Input1: "X",
      Input2: "X",
      Input3: "X",
      Gate1: "X",
      Gate2: "X",
      Output1: "X",
    });
    setDFrontier([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          padding: "10px",
          textAlign: "center",
          background: "#282c34",
          color: "#fff",
        }}
      >
        <h1>ATPG Visualizer</h1>
      </header>
      <main style={{ display: "flex", flex: 1 }}>
        <div style={{ flex: 2, padding: "10px" }}>
          <CircuitGraph
            data={data}
            faultSite={faultSite}
            nodeValues={nodeValues}
            dFrontier={dFrontier}
          />
        </div>
        <div style={{ flex: 1, padding: "10px", borderLeft: "1px solid #ccc" }}>
          <ControlPanel
            onFaultSensitization={handleFaultSensitization}
            onFaultConeTracing={handleFaultConeTracing}
            onDetectConflict={detectConflict}
            onStart={handleStart}
            onNextStep={performSearch}
            onReset={handleReset}
            onCleanup={cleanupBasisNodes}
          />
          <StackView
            searchStack={searchStack}
            onNodeProcessed={() => { }}
            onStart={handleStart}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}

export default App;