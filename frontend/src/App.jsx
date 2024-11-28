import React, { useState, useEffect } from "react";
import CircuitGraph from "./Components/CircuitGraph";
import ControlPanel from "./Components/ControlPanel";
import StackView from "./Components/StackView";

const initialData = {
  nodes: [
    { id: "Input1", label: "Input", value: "X" },
    { id: "Input2", label: "Input", value: "X" },
    { id: "Input3", label: "Input", value: "X" },
    { id: "Input4", label: "Input", value: "X" },
    { id: "Input5", label: "Input", value: "X" },
    { id: "Input6", label: "Input", value: "X" },
    { id: "Gate1", label: "AND Gate", value: "X" },
    { id: "Gate2", label: "OR Gate", value: "X" },
    { id: "Gate3", label: "NAND Gate", value: "X" },
    { id: "Gate4", label: "NOR Gate", value: "X" },
    { id: "Gate5", label: "XOR Gate", value: "X" },
    { id: "Gate6", label: "NAND Gate", value: "X" }, // Changed from NOT Gate to NAND Gate
    { id: "Output1", label: "Output", value: "X" },
  ],
  links: [
    { source: "Input1", target: "Gate1" },
    { source: "Input2", target: "Gate1" },
    { source: "Input3", target: "Gate2" },
    { source: "Input4", target: "Gate2" },
    { source: "Gate1", target: "Gate3" },
    { source: "Gate2", target: "Gate3" },
    { source: "Gate3", target: "Gate4" },
    { source: "Input6", target: "Gate4" }, // Added new input to Gate4
    { source: "Input5", target: "Gate5" },
    { source: "Gate4", target: "Gate5" },
    { source: "Gate5", target: "Gate6" },
    { source: "Input6", target: "Gate6" }, // Added new input to Gate6
    { source: "Gate6", target: "Output1" },
  ],
};


const LOGIC_VALUES = ["0", "1", "X", "D", "D'", "B0", "B1", "G0", "G1"];

function App() {
  const [data] = useState(initialData);
  const [faultSite, setFaultSite] = useState("Gate2");
  const [nodeValues, setNodeValues] = useState(() => {
    const initialNodeValues = {};
    data.nodes.forEach((node) => {
      initialNodeValues[node.id] = "X";
    });
    return initialNodeValues;
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
    const calculatedBasisNodes = ["Input1", "Input2", "Input3", "Input4", "Input5", "Input6"];

    const calculatedDominators = {
      Gate1: ["Gate1", "Gate3", "Gate4", "Gate5", "Gate6", "Output1"],
      Gate2: ["Gate2", "Gate3", "Gate4", "Gate5", "Gate6", "Output1"],
      Gate3: ["Gate3", "Gate4", "Gate5", "Gate6", "Output1"],
      Gate4: ["Gate4", "Gate5", "Gate6", "Output1"],
      Gate5: ["Gate5", "Gate6", "Output1"],
      Gate6: ["Gate6", "Output1"],
    };

    return {
      calculatedBasisNodes,
      calculatedDominators,
    };
  };


  // Fault Sensitization
  const handleFaultSensitization = () => {
    const newValues = { ...nodeValues };
    newValues[faultSite] = "D"; // Sensitize the fault site

    // Recalculate implications from the fault site
    calculateImplications(faultSite, newValues);

    // Update the D-frontier
    updateDFrontier();

    setNodeValues(newValues); // Move this after the updates

    if (detectConflict()) {
      alert("Conflict detected during fault sensitization! Fault is redundant.");
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
            // Assign controlling value to inputs to activate the fault
            newValues[inputId] = getControllingValue(gateType);
            queue.push(inputId);
          } else if (newValues[inputId] !== getControllingValue(gateType)) {
            newValues[inputId] = "CONFLICT";
          }
        });
        continue;
      }

      const inputs = getGateInputs(currentNodeId);
      const inputValues = inputs.map((id) => newValues[id] || "X");
      let outputValue = newValues[currentNodeId];

      switch (gateType) {
        case "AND Gate":
          outputValue = evaluateAndGate(inputValues);
          break;
        case "OR Gate":
          outputValue = evaluateOrGate(inputValues);
          break;
        case "NAND Gate":
          outputValue = evaluateNandGate(inputValues);
          break;
        case "NOR Gate":
          outputValue = evaluateNorGate(inputValues);
          break;
        case "XOR Gate":
          outputValue = evaluateXorGate(inputValues);
          break;
        case "NOT Gate":
          outputValue = evaluateNotGate(inputValues);
          break;
        // Additional gate types if any
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

  const evaluateNandGate = (inputValues) => {
    // Check for any "X" values
    if (inputValues.includes("X")) return "X";

    // Determine the AND result first
    const andResult = inputValues.every((val) => val === "1") ? "1" : "0";
    console.log("AND result:", andResult);
    console.log("Input values:", inputValues);

    // Apply inversion for NAND
    switch (andResult) {
      case "1":
        return "0";
      case "0":
        return "1";
      case "D":
        return "D'"; // Invert D to D'
      case "D'":
        return "D";  // Invert D' to D
      default:
        return "X";
    }
  };

  const evaluateNorGate = (inputValues) => {
    const orResult = evaluateOrGate(inputValues);

    switch (orResult) {
      case "1":
        return "0";
      case "0":
        return "1";
      case "D":
        return "D'";
      case "D'":
        return "D";
      case "X":
        return "X";
      default:
        return "X";
    }
  };

  const evaluateXorGate = (inputValues) => {
    const [a, b] = inputValues;

    if (a === "X" || b === "X") return "X";

    const xorTable = {
      "0": { "0": "0", "1": "1", "D": "D", "D'": "D'" },
      "1": { "0": "1", "1": "0", "D": "D'", "D'": "D" },
      "D": { "0": "D", "1": "D'", "D": "0", "D'": "1" },
      "D'": { "0": "D'", "1": "D", "D": "1", "D'": "0" },
    };

    const result = xorTable[a][b];
    return result !== undefined ? result : "X";
  };

  const evaluateNotGate = (inputValues) => {
    const [a] = inputValues;

    switch (a) {
      case "0":
        return "1";
      case "1":
        return "0";
      case "D":
        return "D'";
      case "D'":
        return "D";
      case "X":
        return "X";
      default:
        return "X";
    }
  };

  const gateEvaluationFunctions = {
    "AND Gate": evaluateAndGate,
    "OR Gate": evaluateOrGate,
    "NAND Gate": evaluateNandGate,
    "NOR Gate": evaluateNorGate,
    "XOR Gate": evaluateXorGate,
    "NOT Gate": evaluateNotGate,
    "Output": (inputValues) => inputValues[0], // Assuming only one input
  };

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

      // Dynamically retrieve the evaluation function
      const evaluateGate = gateEvaluationFunctions[gateType];

      if (evaluateGate) {
        const outputValue = evaluateGate(inputValues);
        newValues[gateId] = outputValue;
        console.log(`Updated ${gate.label} (${gateId}): Output = ${newValues[gateId]}`);
      } else {
        console.warn(`Unknown gate type: ${gateType}`);
        newValues[gateId] = "X"; // Assign "X" for unknown gate types
      }
    });

    setNodeValues(newValues);
    updateDFrontier();

    if (detectConflict()) {
      alert("Conflict detected during fault cone tracing! Fault is redundant.");
    }
  };


  const getGateInputs = (gateId) => {
    return data.links.filter((link) => link.target === gateId).map((link) => link.source);
  };

  const getGateOutputs = (gateId) => {
    return data.links.filter((link) => link.source === gateId).map((link) => link.target);
  };

  const getControllingValue = (gateType) => {
    const gateControllingValues = {
      "AND Gate": "0",
      "OR Gate": "1",
      "NAND Gate": "0",
      "NOR Gate": "1",
      "XOR Gate": "X", // XOR gates require special handling
      "NOT Gate": "X", // For NOT gates, special handling is needed
    };
    return gateControllingValues[gateType] || "X";
  };


  const getNonControllingValue = (gateType) => {
    const gateNonControllingValues = {
      "AND Gate": "1",
      "OR Gate": "0",
      "NAND Gate": "1",
      "NOR Gate": "0",
      "XOR Gate": "0", // XOR gates require special handling
      "NOT Gate": "X", // For NOT gates, special handling is needed
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
    const updatedNodes = [];

    basisNodes.forEach((basisNode) => {
      if (newValues[basisNode] === "X") {
        const finalValue = determineFinalValue(basisNode, newValues);
        newValues[basisNode] = finalValue;
        if (finalValue !== "X") {
          updatedNodes.push(basisNode);
        }
      }
    });

    // Update nodeValues before calculating implications
    setNodeValues(newValues);

    // Recalculate implications starting from updated basis nodes
    updatedNodes.forEach((basisNode) => {
      calculateImplications(basisNode, newValues);
    });

    alert("Cleanup phase complete.");
  };


  const determineFinalValue = (nodeId, values) => {
    // Find all gates that the node feeds into
    const gates = getGatesDrivenByNode(nodeId);

    // Collect non-controlling values required for each gate
    const requiredValues = new Set();

    gates.forEach((gateId) => {
      const gate = data.nodes.find((n) => n.id === gateId);
      const gateType = gate.label;
      const nonControllingValue = getNonControllingValue(gateType);
      requiredValues.add(nonControllingValue);
    });

    // If all required values are the same, assign that value
    if (requiredValues.size === 1) {
      return [...requiredValues][0];
    }

    // If multiple values are required, decide on a strategy
    // For simplicity, return "X" or choose one based on priority
    // Here, we can prioritize gates involved in the fault propagation path
    const faultPropagationGates = getFaultPropagationGates();

    for (let value of requiredValues) {
      for (let gateId of gates) {
        if (faultPropagationGates.includes(gateId)) {
          // Assign the value required for the fault propagation gate
          return value;
        }
      }
    }

    // If no suitable value is found, return "X" or default value
    return "X";
  };

  const getGatesDrivenByNode = (nodeId) => {
    return data.links
      .filter((link) => link.source === nodeId)
      .map((link) => link.target);
  };

  const getFaultPropagationGates = () => {
    // Starting from the fault site, trace the path to the primary outputs
    const faultPath = [];
    const queue = [faultSite];
    const visited = new Set();

    while (queue.length > 0) {
      const currentGate = queue.shift();
      if (!visited.has(currentGate)) {
        visited.add(currentGate);
        faultPath.push(currentGate);
        const outputs = getGateOutputs(currentGate);
        queue.push(...outputs);
      }
    }

    return faultPath;
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

  const [startSearch, setStartSearch] = useState(false);

  const handleStart = () => {
    setSearchStack([]);
    handleFaultSensitization();
    setStartSearch(true);
  };

  useEffect(() => {
    if (startSearch) {
      performSearch();
      setStartSearch(false);
    }
  }, [startSearch]);

  const [faultSensitized, setFaultSensitized] = useState(false);

  const handleNextStep = () => {
    if (!faultSensitized) {
      handleFaultSensitization();
      setFaultSensitized(true);
    } else {
      performSearch();
    }
  };

  const handleReset = () => {
    setSearchStack([]);

    // Create a new nodeValues object with all node values set to "X"
    const resetNodeValues = {};
    data.nodes.forEach((node) => {
      resetNodeValues[node.id] = "X";
    });

    setNodeValues(resetNodeValues);
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
            onNextStep={handleNextStep}
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