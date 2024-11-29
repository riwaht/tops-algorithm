# **ATPG Visualizer: Automatic Test Pattern Generation**

## **Project Overview**
The **ATPG Visualizer** is a React-based interactive tool to simulate the TOPS algorithm for automatic test pattern generation in digital circuits. This application enables users to visualize fault sensitization, propagation, and testing processes step-by-step, making it a valuable educational and debugging tool.

---

## **Features**
- **Fault Injection and Sensitization**: Activate a fault at a user-specified fault site.
- **D-Frontier Visualization**: Highlight gates where fault propagation is possible.
- **Step-by-Step Fault Cone Tracing**: Propagate faults through the circuit using a guided tracing approach.
- **Search Loop Execution**: Automatically explore alternative assignments to resolve conflicts.
- **Cleanup Phase**: Finalize input values for a test pattern after fault propagation.
- **Interactive Circuit Visualization**:
  - Node states (`0`, `1`, `X`, `D`, `D'`) are displayed with dynamic coloring.
  - Tooltips show node details on hover.
  - Highlight fault sites and D-frontier gates for clarity.
- **State Management**: Visualize the internal state and search stack for each step.

---

## **How to Use the ATPG Visualizer**

### **Control Panel**
The **Control Panel** allows users to:
1. **Fault Sensitization**: Activate a fault at the fault site.
2. **Fault Cone Tracing**: Start propagating the fault through the circuit.
3. **Next Step**: Perform a single step in the fault propagation process.
4. **Run Search Loop**: Explore alternative assignments for resolving conflicts.
5. **Cleanup Phase**: Finalize the circuit state after successful fault propagation.
6. **Reset**: Reset the circuit state to its initial condition.

### **Circuit Graph**
- Nodes represent gates or inputs/outputs, with colors indicating their current state:
  - **`0`**: Light red
  - **`1`**: Light green
  - **`X`**: Gray
  - **`D`**: Yellow
  - **`D'`**: Orange
- Tooltips display node details (e.g., ID, type, current value).
- Fault sites and D-Frontier gates are highlighted for better visualization.

### **Search Stack View**
- Shows the sequence of steps taken during fault propagation and backtracking.
- Each step includes the state of all nodes and the `D-Frontier`.

---

## **Key Components**

### **1. App.js**
- **Core logic for ATPG**:
  - Fault sensitization (`handleFaultSensitization`)
  - Fault cone tracing (`handleFaultConeTracing`, `handleNextStep`)
  - Search loop execution
  - Cleanup phase (`cleanupBasisNodes`)
- Manages state:
  - Node values
  - `D-Frontier`
  - Search stack
  - Fault cone queue
  - Absolute and basis nodes

---

### **2. CircuitGraph**
- Visualizes the circuit graph using **React-D3-Graph**.
- Dynamically updates node and link colors based on their state.
- Highlights:
  - Fault site
  - `D-Frontier` nodes

---

### **3. ControlPanel**
- Provides interactive buttons to control the algorithm's flow:
  - Fault sensitization
  - Tracing
  - Search loop
  - Cleanup
  - Reset

---

### **4. StackView**
- Displays the search stack:
  - Each entry shows the state of the circuit at a specific step.

---

## **How the TOPS Algorithm is Implemented**

### **1. Fault Sensitization**
- Activates the fault at the fault site.
- Assigns controlling values to inputs of the fault site.

### **2. Fault Cone Tracing**
- Propagates the fault (`D` or `D'`) through gates in the `D-Frontier`.
- Stops when the fault reaches a primary output or no further propagation is possible.

### **3. Search Loop**
- Explores alternative input assignments when fault propagation is blocked.
- Uses a stack to backtrack and retry different paths.

### **4. Cleanup Phase**
- Assigns final values to inputs to ensure the test pattern is valid.
- Finalizes the circuit state for the fault test.

---

## **Customizations**

### **1. Modifying the Circuit**
- Update the `initialData` object in `App.js` to define new nodes and links.

### **2. Adding Custom Logic**
- Extend `gateEvaluationFunctions` in `App.js` to include new gate types or logic rules.

---

## **Future Improvements**
- Add support for multi-output circuits.
- Implement more advanced gate evaluation logic.
- Integrate a step-by-step tutorial mode.

---

## **License**
This project is licensed under the MIT License.
