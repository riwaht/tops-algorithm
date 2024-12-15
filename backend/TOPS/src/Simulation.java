import java.util.*;

public class Simulation {
    private Circuit circuit;

    public Simulation(Circuit circuit) {
        this.circuit = circuit;
    }

    /**
     * Performs topological sorting of the circuit's gates based on their dependencies.
     * Returns a list of line IDs in topological order.
     */
    public List<String> levelizeCircuit() {
        Map<String, Integer> inDegree = new HashMap<>();
        Map<String, List<String>> adjacencyList = new HashMap<>();
        List<String> topologicalOrder = new ArrayList<>();

        // Initialize inDegree and adjacencyList based on gates
        for (Gate gate : circuit.gates) {
            String output = gate.getOutput().getId();
            inDegree.putIfAbsent(output, 0);
            adjacencyList.putIfAbsent(output, new ArrayList<>());

            for (Line inputLine : gate.getInputs()) {
                String input = inputLine.getId();
                adjacencyList.computeIfAbsent(input, k -> new ArrayList<>()).add(output);
                inDegree.put(output, inDegree.get(output) + 1);
            }
        }

        // Ensure all primary inputs are in inDegree with 0
        for (String input : circuit.primaryInputs) {
            inDegree.putIfAbsent(input, 0);
        }

        // Initialize queue with nodes having inDegree 0
        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }

        // Kahn's algorithm for topological sorting
        while (!queue.isEmpty()) {
            String current = queue.poll();
            topologicalOrder.add(current);

            for (String neighbor : adjacencyList.getOrDefault(current, Collections.emptyList())) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) {
                    queue.add(neighbor);
                }
            }
        }

        // Check for cycles or disconnected components
        if (topologicalOrder.size() != inDegree.size()) {
            throw new IllegalStateException("Circuit has cycles or disconnected components.");
        }

        return topologicalOrder;
    }

    /**
     * Simulates the circuit given the input values.
     * Returns a map of output line IDs to their computed values.
     */
    public Map<String, Integer> simulate(Map<String, Integer> inputValues) {
        List<String> topologicalOrder = levelizeCircuit();
        Map<String, Integer> values = new HashMap<>(inputValues);

        // Ensure all primary inputs have values
        for (String input : circuit.primaryInputs) {
            if (!values.containsKey(input)) {
                throw new IllegalStateException("Input value for signal " + input + " is missing.");
            }
        }

        // Create a mapping from output line IDs to their respective gates
        Map<String, Gate> outputToGate = new HashMap<>();
        for (Gate gate : circuit.gates) {
            String outputId = gate.getOutput().getId();
            if (outputToGate.containsKey(outputId)) {
                throw new IllegalStateException("Multiple gates have the same output: " + outputId);
            }
            outputToGate.put(outputId, gate);
        }

        // Evaluate gates in topological order
        for (String node : topologicalOrder) {
            // If the node is an output of a gate, evaluate it
            if (outputToGate.containsKey(node)) {
                Gate gate = outputToGate.get(node);

                // Evaluate the gate using the current values map
                int outputValue = gate.evaluate(values);
                values.put(gate.getOutput().getId(), outputValue);
            }
            // If the node is a primary input, its value is already in the values map
        }

        // Collect output values
        Map<String, Integer> outputValues = new HashMap<>();
        for (String output : circuit.primaryOutputs) {
            if (values.containsKey(output)) {
                outputValues.put(output, values.get(output));
            } else {
                throw new IllegalStateException("Output signal " + output + " was not computed.");
            }
        }

        return outputValues;
    }
}
