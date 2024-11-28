// App.js
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
  const [currentStep, setCurrentStep] = useState("sensitizeFault");
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
  const [absoluteDominators, setAbsoluteDominators] = useState({});
  const [processedDFrontierNodes, setProcessedDFrontierNodes] = useState(new Set());
  const [faultConeQueue, setFaultConeQueue] = useState([]);
  const [isTracing, setIsTracing] = useState(false);
  const [currentGateProcessing, setCurrentGateProcessing] = useState(null);
  const [testPatternFound, setTestPatternFound] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false); // New state for cleanup flag

  // Preprocessing to calculate basis-nodes and dominators
  useEffect(() => {
    const { calculatedBasisNodes, calculatedDominators, calculatedAbsoluteDominators } = preprocessCircuit(data);
    setBasisNodes(calculatedBasisNodes);
    setDominators(calculatedDominators);
    setAbsoluteDominators(calculatedAbsoluteDominators);
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
      Output1: ["Output1"],
      Input1: ["Input1"],
      Input2: ["Input2"],
      Input3: ["Input3"],
      Input4: ["Input4"],
      Input5: ["Input5"],
      Input6: ["Input6"],
    };

    // Calculate absolute dominators
    const outputs = data.nodes.filter((n) => n.label === "Output").map((n) => n.id);
    const calculatedAbsoluteDominators = {};

    data.nodes.forEach((node) => {
      const reachableOutputs = getReachableOutputs(node.id, outputs, circuitData);
      if (reachableOutputs.length === 0) return;
      let intersection = null;
      reachableOutputs.forEach((output) => {
        if (intersection === null) {
          intersection = new Set(calculatedDominators[output]);
        } else {
          intersection = new Set([...intersection].filter((x) => calculatedDominators[output].includes(x)));
        }
      });
      calculatedAbsoluteDominators[node.id] = intersection ? Array.from(intersection) : [];
    });

    return {
      calculatedBasisNodes,
      calculatedDominators,
      calculatedAbsoluteDominators,
    };
  };

  const getReachableOutputs = (nodeId, outputs, circuitData) => {
    const reachable = [];
    const queue = [nodeId];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      if (outputs.includes(current)) {
        reachable.push(current);
        continue;
      }
      const children = getGateOutputs(current);
      queue.push(...children);
    }

    return reachable;
  };

  // Fault Sensitization
  const handleFaultSensitization = () => {
    console.log("Starting Fault Sensitization");
    const newValues = { ...nodeValues };
    newValues[faultSite] = "D"; // Sensitize the fault site

    // Assign controlling values to the fault site's inputs
    const faultGate = data.nodes.find((n) => n.id === faultSite);
    const gateType = faultGate.label;
    const inputs = getGateInputs(faultSite);

    inputs.forEach((inputId) => {
      if (newValues[inputId] === "X") {
        const controllingValue = getControllingValue(gateType);
        newValues[inputId] = controllingValue;
        console.log(`Assigned controlling value "${controllingValue}" to ${inputId}`);
      }
    });

    // Do NOT evaluate the fault gate's output here to preserve the fault value
    // Initialize the faultConeQueue with gates driven by the fault site
    const drivenGates = getGateOutputs(faultSite);
    setFaultConeQueue(drivenGates);

    // Update D-Frontier
    setDFrontier(drivenGates);

    // Save the current state to the search stack
    setSearchStack((prevStack) => [
      ...prevStack,
      { nodeValues: { ...newValues }, dFrontier: [...dFrontier] },
    ]);

    setNodeValues(newValues);
    console.log("Node Values After Fault Sensitization:", newValues);

    if (detectConflict(newValues)) {
      console.log("Conflict detected during fault sensitization. Fault is redundant.");
      alert("Conflict detected during fault sensitization! Fault is redundant.");
      setCurrentStep("complete");
    }
  };

  // Update D-Frontier
  const updateDFrontier = (values) => {
    const newDFrontier = [];

    data.nodes.forEach((node) => {
      const outputs = getGateOutputs(node.id);
      const nodeValue = values[node.id];

      if (
        (nodeValue === "D" || nodeValue === "D'") &&
        outputs.some((outputId) => values[outputId] === "X") &&
        !processedDFrontierNodes.has(node.id) // Exclude processed nodes
      ) {
        newDFrontier.push(node.id);
      }
    });

    console.log("Updated D-Frontier:", newDFrontier);
    setDFrontier(newDFrontier);
  };

  // Conflict Detection
  const detectConflict = (values) => {
    const conflict = Object.values(values).includes("CONFLICT");
    if (conflict) {
      console.log("Conflict detected in node values.");
    }
    return conflict;
  };

  const backtrack = () => {
    if (searchStack.length > 0) {
      const lastState = searchStack.pop();
      setNodeValues(lastState.nodeValues);
      setDFrontier(lastState.dFrontier);
      setSearchStack([...searchStack]);
      console.log("Backtracked to previous state:", lastState);
    } else {
      alert("No more assignments to backtrack. Fault is redundant.");
      console.log("No more assignments to backtrack. Fault is redundant.");
    }
  };

  // Dynamic Implication Handling
  const calculateImplications = (nodeId, newValues) => {
    const queue = [nodeId];
    const visited = new Set();

    while (queue.length > 0) {
      const currentNodeId = queue.shift();

      // Prevent processing the same node multiple times
      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);

      const node = data.nodes.find((n) => n.id === currentNodeId);
      const gateType = node.label;

      if (node.label.trim().toLowerCase() === "input") {
        console.log(`Skipping evaluation for Input node: ${node.id}`);
        continue; // Skip evaluating Input nodes
      }

      if (
        currentNodeId === faultSite &&
        (newValues[currentNodeId] === "D" || newValues[currentNodeId] === "D'")
      ) {
        const inputs = getGateInputs(currentNodeId);
        inputs.forEach((inputId) => {
          if (newValues[inputId] === "X") {
            const controllingValue = getControllingValue(gateType);
            newValues[inputId] = controllingValue;
            console.log(`Assigned controlling value "${newValues[inputId]}" to ${inputId}`);
            queue.push(inputId);
          } else if (newValues[inputId] !== getControllingValue(gateType)) {
            newValues[inputId] = "CONFLICT";
            console.log(`Conflict detected at ${inputId}`);
          }
        });
        continue;
      }

      const inputs = getGateInputs(currentNodeId);
      const inputValues = inputs.map((id) => newValues[id] || "X");
      let outputValue = newValues[currentNodeId];

      const evaluateGate = gateEvaluationFunctions[gateType];
      if (evaluateGate) {
        outputValue = evaluateGate(inputValues);
      } else {
        outputValue = "X";
      }

      if (newValues[currentNodeId] !== outputValue) {
        console.log(
          `Gate ${currentNodeId} (${gateType}) evaluated to "${outputValue}" based on inputs ${inputValues}`
        );
        newValues[currentNodeId] = outputValue;
        const outputs = getGateOutputs(currentNodeId);
        queue.push(...outputs);
      }

      if (newValues[currentNodeId] === "CONFLICT") {
        console.log(`Conflict detected at ${currentNodeId}`);
        break;
      }
    }

    return newValues;
  };

  // Gate evaluation functions with comprehensive D-algebra truth tables
  const evaluateAndGate = (inputValues) => {
    const [a, b] = inputValues;

    const andTable = {
      "0": { "0": "0", "1": "0", "D": "0", "D'": "0", "X": "0" },
      "1": { "0": "0", "1": "1", "D": "D", "D'": "D'", "X": "X" },
      "D": { "0": "0", "1": "D", "D": "D", "D'": "0", "X": "X" },
      "D'": { "0": "0", "1": "D'", "D": "0", "D'": "D'", "X": "X" },
      "X": { "0": "0", "1": "X", "D": "X", "D'": "X", "X": "X" },
    };

    return andTable[a]?.[b] || andTable[b]?.[a] || "X";
  };

  const evaluateOrGate = (inputValues) => {
    const [a, b] = inputValues;

    const orTable = {
      "0": { "0": "0", "1": "1", "D": "D", "D'": "D'", "X": "X" },
      "1": { "0": "1", "1": "1", "D": "1", "D'": "1", "X": "1" },
      "D": { "0": "D", "1": "1", "D": "D", "D'": "1", "X": "1" },
      "D'": { "0": "D'", "1": "1", "D": "1", "D'": "D'", "X": "1" },
      "X": { "0": "X", "1": "1", "D": "1", "D'": "1", "X": "1" },
    };

    return orTable[a]?.[b] || orTable[b]?.[a] || "X";
  };

  const evaluateNandGate = (inputValues) => {
    const [a, b] = inputValues;

    const nandTable = {
      "0": { "0": "1", "1": "1", "D": "1", "D'": "1", "X": "1" },
      "1": { "0": "1", "1": "0", "D": "D'", "D'": "D", "X": "X" },
      "D": { "0": "1", "1": "D'", "D": "X", "D'": "X", "X": "X" },
      "D'": { "0": "1", "1": "D", "D": "X", "D'": "X", "X": "X" },
      "X": { "0": "1", "1": "X", "D": "X", "D'": "X", "X": "X" },
    };

    return nandTable[a]?.[b] || nandTable[b]?.[a] || "X";
  };

  const evaluateNorGate = (inputValues) => {
    const [a, b] = inputValues;

    const norTable = {
      "0": { "0": "1", "1": "0", "D": "D'", "D'": "D", "X": "0" },
      "1": { "0": "0", "1": "0", "D": "0", "D'": "0", "X": "0" },
      "D": { "0": "D'", "1": "0", "D": "0", "D'": "0", "X": "0" },
      "D'": { "0": "D", "1": "0", "D": "0", "D'": "0", "X": "0" },
      "X": { "0": "0", "1": "0", "D": "0", "D'": "0", "X": "0" },
    };

    return norTable[a]?.[b] || norTable[b]?.[a] || "X";
  };

  const evaluateXorGate = (inputValues) => {
    const [a, b] = inputValues;

    const xorTable = {
      "0": { "0": "0", "1": "1", "D": "D", "D'": "D'", "X": "X" },
      "1": { "0": "1", "1": "0", "D": "D'", "D'": "D", "X": "X" },
      "D": { "0": "D", "1": "D'", "D": "1", "D'": "0", "X": "X" },
      "D'": { "0": "D'", "1": "D", "D": "0", "D'": "1", "X": "X" },
      "X": { "0": "X", "1": "X", "D": "X", "D'": "X", "X": "X" },
    };

    return xorTable[a]?.[b] || xorTable[b]?.[a] || "X";
  };

  const evaluateNotGate = (inputValues) => {
    const [a] = inputValues;

    const notTable = {
      "0": "1",
      "1": "0",
      "D": "D'",
      "D'": "D",
      "X": "X",
    };

    return notTable[a] || "X";
  };

  const evaluateOutput = (inputValues) => {
    return inputValues[0] || "X"; // Assuming single input
  };

  const gateEvaluationFunctions = {
    "AND Gate": evaluateAndGate,
    "OR Gate": evaluateOrGate,
    "NAND Gate": evaluateNandGate,
    "NOR Gate": evaluateNorGate,
    "XOR Gate": evaluateXorGate,
    "NOT Gate": evaluateNotGate,
    "Output": evaluateOutput, // Updated to use evaluateOutput function
  };

  // Fault Cone Tracing - Initialize Tracing
  const handleFaultConeTracing = () => {
    console.log("Starting Fault Cone Tracing");
    setIsTracing(true); // Indicate that tracing has started
    // Fault Cone Tracing starts with the initial D-frontier set during sensitization
    // No need to reset the faultConeQueue here
  };

  // Next Step Handler for Step-by-Step Tracing
  const handleNextStep = () => {
    if (!isTracing) {
      alert("Please start fault cone tracing first.");
      return;
    }

    if (faultConeQueue.length === 0) {
      if (!testPatternFound) {
        alert("Fault cone tracing complete.");
        console.log("Fault cone tracing complete.");
      }
      setIsTracing(false);
      setCurrentGateProcessing(null);
      return;
    }

    // Dequeue the next gate to process
    const currentGate = faultConeQueue[0];
    setFaultConeQueue((prevQueue) => prevQueue.slice(1));
    setCurrentGateProcessing(currentGate); // Highlight current gate

    console.log(`Processing Gate: ${currentGate}`);

    // Clone current node values to avoid direct state mutation
    const newValues = { ...nodeValues };

    // Apply fault propagation to the current gate
    const gate = data.nodes.find((n) => n.id === currentGate);
    const gateType = gate.label;

    const inputs = getGateInputs(currentGate);

    // **Critical Modification Starts Here**
    // If the gate being processed is the fault site, handle it specially
    if (currentGate === faultSite) {
      // Ensure the fault site retains its 'D' or 'D'' value
      // Assign controlling values to its inputs to activate the fault
      inputs.forEach((inputId) => {
        if (newValues[inputId] === "X") {
          const controllingValue = getControllingValue(gateType);
          newValues[inputId] = controllingValue;
          console.log(`Assigned controlling value "${newValues[inputId]}" to ${inputId}`);
        }
      });

      // Do NOT evaluate the fault gate's output to preserve the fault value
      // Enqueue the inputs for further processing if they are gates (not primary inputs)
      inputs.forEach((inputId) => {
        const isGate = data.nodes.some((node) => node.id === inputId && node.label !== "Input");
        if (isGate && !faultConeQueue.includes(inputId)) {
          setFaultConeQueue((prevQueue) => [...prevQueue, inputId]);
        }
      });

      // Update node values and D-Frontier
      setNodeValues(newValues);
      updateDFrontier(newValues);

      // Save the current state to the search stack for potential backtracking
      setSearchStack((prevStack) => [
        ...prevStack,
        { nodeValues: { ...newValues }, dFrontier: [...dFrontier] },
      ]);

      // Detect conflicts
      if (detectConflict(newValues)) {
        alert("Conflict detected during fault cone tracing! Fault is redundant.");
        console.log("Conflict detected during fault cone tracing. Fault is redundant.");
        setIsTracing(false);
        setCurrentGateProcessing(null);
        return;
      }

      // Check if a test pattern is found
      if (checkForTest(newValues)) {
        alert("Test pattern found! Fault propagated to primary output.");
        console.log("Test pattern found! Fault propagated to primary output.");
        setTestPatternFound(true);
        setIsTracing(false);
        setCurrentGateProcessing(null);
        return;
      }

      return; // Exit early to prevent further processing
    }
    // **Critical Modification Ends Here**

    // For non-fault site gates, proceed normally
    // Assign non-controlling values to unassigned inputs
    inputs.forEach((inputId) => {
      // **Prevent altering the fault site's inputs**
      if (faultSiteInputs.includes(inputId)) {
        // Skip assigning non-controlling values to fault site's inputs
        return;
      }

      if (newValues[inputId] === "X") {
        const nonControllingValue = getNonControllingValue(gateType);
        newValues[inputId] = nonControllingValue;
        console.log(`Assigned non-controlling value "${nonControllingValue}" to ${inputId}`);
      }
    });

    // Evaluate the gate based on its type and inputs
    const inputValues = inputs.map((id) => newValues[id] || "X");
    console.log(`Evaluating ${gate.label} (${currentGate}): Inputs = ${inputValues}`);

    const evaluateGate = gateEvaluationFunctions[gateType];
    if (evaluateGate) {
      const outputValue = evaluateGate(inputValues);
      newValues[currentGate] = outputValue;
      console.log(`Updated ${gate.label} (${currentGate}): Output = ${newValues[currentGate]}`);
    } else {
      console.warn(`Unknown gate type: ${gateType}`);
      newValues[currentGate] = "X"; // Assign "X" for unknown gate types
    }

    // Update node values and D-Frontier
    setNodeValues(newValues);
    updateDFrontier(newValues);

    // Save the current state to the search stack for potential backtracking
    setSearchStack((prevStack) => [
      ...prevStack,
      { nodeValues: { ...newValues }, dFrontier: [...dFrontier] },
    ]);

    // Detect conflicts
    if (detectConflict(newValues)) {
      alert("Conflict detected during fault cone tracing! Fault is redundant.");
      console.log("Conflict detected during fault cone tracing. Fault is redundant.");
      setIsTracing(false);
      setCurrentGateProcessing(null);
      return;
    }

    // Enqueue subsequent gates driven by the current gate
    const nextGates = getGateOutputs(currentGate).filter((gateId) => !faultConeQueue.includes(gateId));
    setFaultConeQueue((prevQueue) => [...prevQueue, ...nextGates]);

    // Check if a test pattern is found
    if (checkForTest(newValues)) {
      alert("Test pattern found! Fault propagated to primary output.");
      console.log("Test pattern found! Fault propagated to primary output.");
      setTestPatternFound(true);
      setIsTracing(false);
      setCurrentGateProcessing(null);
    }
  };

  // Fault Cone Tracing - Original Complete Tracing (Optional)
  const handleFaultConeTracingComplete = () => {
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
          console.log(`Assigned non-controlling value "${nonControllingValue}" to ${inputId}`);
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
    updateDFrontier(newValues);

    if (detectConflict(newValues)) {
      alert("Conflict detected during fault cone tracing! Fault is redundant.");
      console.log("Conflict detected during fault cone tracing. Fault is redundant.");
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
      "Output": "X",
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
      "Output": "X",
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

  const checkForTest = (values) => {
    if (values["Output1"] === "D" || values["Output1"] === "D'") {
      console.log("Test pattern found! Fault propagated to primary output.");
      return true;
    }
    return false;
  };

  const checkObservationPaths = () => {
    const pathsBlocked = dFrontier.length === 0;
    if (pathsBlocked && !checkForTest(nodeValues) && !isCleaningUp) { // Added !isCleaningUp
      alert("All observation paths are blocked. Backtracking...");
      console.log("All observation paths are blocked. Initiating backtrack.");
      backtrack();
    }
  };

  // TODO: Add more triggers to make sure of when we check observation paths
  useEffect(() => {
    checkObservationPaths();
  }, [nodeValues, dFrontier, isCleaningUp]); // Added isCleaningUp to dependencies


  const cleanupBasisNodes = () => {
    if (testPatternFound) {
      console.log("Test pattern found. Skipping backtracking and proceeding to cleanup.");
      setIsCleaningUp(true); // Start cleanup
      console.log("Starting Cleanup Phase");
      console.log("Basis Nodes Cleanup Assignments:", nodeValues);
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
      console.log("Basis Nodes Cleanup Assignments:", newValues);

      // Recalculate implications starting from updated basis nodes
      updatedNodes.forEach((basisNode) => {
        const updatedValues = calculateImplications(basisNode, newValues);
        updateDFrontier(updatedValues);
        setNodeValues(updatedValues);
      });

      alert("Cleanup phase complete.");
      console.log("Cleanup phase complete.");
      setIsCleaningUp(false); // End cleanup
      return;
    }

    setIsCleaningUp(true); // Start cleanup
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
    console.log("Basis Nodes Cleanup Assignments:", newValues);

    // Recalculate implications starting from updated basis nodes
    updatedNodes.forEach((basisNode) => {
      const updatedValues = calculateImplications(basisNode, newValues);
      updateDFrontier(updatedValues);
      setNodeValues(updatedValues);
    });

    alert("Cleanup phase complete.");
    console.log("Cleanup phase complete.");
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

  const handleReset = () => {
    console.log("Resetting ATPG Process");
    // Reset all relevant states
    const resetNodeValues = {};
    data.nodes.forEach((node) => {
      resetNodeValues[node.id] = "X";
    });

    setNodeValues(resetNodeValues);
    setSearchStack([]);
    setDFrontier([]);
    setProcessedDFrontierNodes(new Set()); // Clear processed nodes
    setCurrentStep("sensitizeFault");
    setFaultConeQueue([]);
    setIsTracing(false);
    setCurrentGateProcessing(null);
    setTestPatternFound(false);
    setIsCleaningUp(false); // Reset cleanup flag
  };

  // Identify inputs to the fault site to prevent them from being altered
  const faultSiteInputs = getGateInputs(faultSite);

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
            absoluteDominators={absoluteDominators}
            currentGateProcessing={currentGateProcessing} // Pass the current gate
          />
        </div>
        <div style={{ flex: 1, padding: "10px", borderLeft: "1px solid #ccc" }}>
          <ControlPanel
            onFaultSensitization={handleFaultSensitization}
            onFaultConeTracing={handleFaultConeTracing}
            onNextStep={handleNextStep} // Next Step handler
            onDetectConflict={() => detectConflict(nodeValues)}
            onReset={handleReset}
            onCleanup={cleanupBasisNodes}
            isTracing={isTracing} // Pass isTracing to control button states
          />
          <StackView
            searchStack={searchStack}
            onNodeProcessed={() => { }}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}

export default App;