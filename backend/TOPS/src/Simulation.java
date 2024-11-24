import java.util.*;

public class Simulation {
    private Circuit circuit;

    public Simulation(Circuit circuit) {
        this.circuit = circuit;
    }

    public List<Integer> levelizeCircuit() {
        Map<Integer, Integer> inDegree = new HashMap<>();
        Map<Integer, List<Integer>> adjacencyList = new HashMap<>();
        List<Integer> topologicalOrder = new ArrayList<>();

        for (Gate gate : circuit.gates.values()) {
            inDegree.put(gate.output, 0);
            adjacencyList.putIfAbsent(gate.output, new ArrayList<>());

            for (int input : gate.inputs) {
                adjacencyList.computeIfAbsent(input, k -> new ArrayList<>()).add(gate.output);
                inDegree.put(gate.output, inDegree.getOrDefault(gate.output, 0) + 1);
            }
        }

        for (Integer input : circuit.inputs) {
            inDegree.putIfAbsent(input, 0);
            if (inDegree.get(input) == 0) topologicalOrder.add(input);
        }

        Queue<Integer> queue = new LinkedList<>();
        for (Integer node : inDegree.keySet()) {
            if (inDegree.get(node) == 0) queue.add(node);
        }

        while (!queue.isEmpty()) {
            int current = queue.poll();
            topologicalOrder.add(current);

            for (int neighbor : adjacencyList.getOrDefault(current, new ArrayList<>())) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) queue.add(neighbor);
            }
        }

        return topologicalOrder;
    }

    public Map<Integer, Integer> simulate(Map<Integer, Integer> inputValues) {
        List<Integer> topologicalOrder = levelizeCircuit();
        Map<Integer, Integer> values = new HashMap<>(inputValues);

        for (Integer input : circuit.inputs) {
            // Ensure all inputs are present in the values map
            if (!values.containsKey(input)) {
                throw new IllegalStateException("Input value for signal " + input + " is missing.");
            }
        }

        for (Integer node : topologicalOrder) {
            if (circuit.gates.containsKey(node)) {
                Gate gate = circuit.gates.get(node);

                // Check all inputs for the gate are present in the map
                for (Integer gateInput : gate.inputs) {
                    if (!values.containsKey(gateInput)) {
                        throw new IllegalStateException("Input value for gate " + gate.type + " is missing: " + gateInput);
                    }
                }

                values.put(gate.output, gate.evaluate(values));
            }
        }

        Map<Integer, Integer> outputValues = new HashMap<>();
        for (Integer output : circuit.outputs) {
            if (values.containsKey(output)) {
                outputValues.put(output, values.get(output));
            } else {
                throw new IllegalStateException("Output signal " + output + " was not computed.");
            }
        }

        return outputValues;
    }
}
