import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class FaultSimulator {
    private Circuit circuit;
    private Simulation simulation;
    private Map<String, Gate> outputToGateMap;

    public FaultSimulator(Circuit circuit) {
        this.circuit = circuit;
        this.simulation = new Simulation(circuit);
        this.outputToGateMap = new HashMap<>();

        // Initialize the output to gate mapping
        for (Gate gate : circuit.gates) {
            String outputId = gate.getOutput().getId();
            if (outputToGateMap.containsKey(outputId)) {
                throw new IllegalStateException("Multiple gates have the same output: " + outputId);
            }
            outputToGateMap.put(outputId, gate);
        }
    }

    /**
     * Simulates the circuit with an injected fault.
     *
     * @param inputValues The input vector as a map from line IDs to values.
     * @param fault       The fault to inject.
     * @return The output vector after fault injection.
     */
    private Map<String, Integer> simulateWithFault(Map<String, Integer> inputValues, Fault fault) {
        // Create a copy of input values to modify
        Map<String, Integer> values = new HashMap<>(inputValues);

        // Inject fault, regardless of whether it's a primary input or not
        values.put(fault.node, fault.stuckAtValue);

        // Get the topological order of the circuit
        List<String> topologicalOrder = simulation.levelizeCircuit();

        for (String node : topologicalOrder) {
            if (outputToGateMap.containsKey(node)) {
                Gate gate = outputToGateMap.get(node);

                // Skip evaluation if the node has a fault injected
                if (node.equals(fault.node)) {
                    continue;
                }

                // Evaluate the gate if its output is not already set (due to fault)
                if (!values.containsKey(node)) {
                    int outputValue = gate.evaluate(values);
                    values.put(gate.getOutput().getId(), outputValue);
                }
            }
            // Primary inputs are already set in the values map
        }

        // Collect the output values
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

    /**
     * Performs serial fault simulation to determine fault coverage.
     *
     * @param faults      A list of faults to simulate.
     * @param testVectors A list of test vectors, each represented as a map from line IDs to values.
     * @return The fault coverage as a fraction (detectedFaults / totalFaults).
     */
    public double serialFaultSimulation(List<Fault> faults, List<Map<String, Integer>> testVectors) {
        int detectedFaults = 0;

        for (Fault fault : faults) {
            boolean detected = false;
            for (Map<String, Integer> testVector : testVectors) {
                // Simulate without fault
                Map<String, Integer> faultFreeOutput = simulation.simulate(testVector);

                // Simulate with fault
                Map<String, Integer> faultyOutput = simulateWithFault(testVector, fault);

                // Compare outputs to detect fault
                if (!faultFreeOutput.equals(faultyOutput)) {
                    detected = true;
                    break; // Fault detected by this test vector
                }
            }
            if (detected) {
                detectedFaults++;
            } else {
                System.out.println("Undetected Fault: " + fault);
            }
        }

        // Calculate fault coverage
        return (double) detectedFaults / faults.size();
    }

    /**
     * Performs parallel fault simulation to determine fault coverage.
     *
     * @param faults      A list of faults to simulate.
     * @param testVectors A list of test vectors, each represented as a map from line IDs to values.
     * @return The fault coverage as a fraction (detectedFaults / totalFaults).
     */
    public double parallelFaultSimulation(List<Fault> faults, List<Map<String, Integer>> testVectors) {
        int detectedFaults = 0;

        for (Fault fault : faults) {
            AtomicBoolean detected = new AtomicBoolean(false);

            // Process test vectors in parallel
            testVectors.parallelStream().forEach(testVector -> {
                if (detected.get()) {
                    return; // Skip if already detected
                }

                // Simulate without fault
                Map<String, Integer> faultFreeOutput = simulation.simulate(testVector);

                // Simulate with fault
                Map<String, Integer> faultyOutput = simulateWithFault(testVector, fault);

                // Compare outputs to detect fault
                if (!faultFreeOutput.equals(faultyOutput)) {
                    detected.set(true);
                }
            });

            if (detected.get()) {
                detectedFaults++;
            } else {
                System.out.println("Undetected Fault: " + fault);
            }
        }

        // Calculate fault coverage
        return (double) detectedFaults / faults.size();
    }

    public double serialFaultSimulationWithMetrics(List<Fault> faults, List<Map<String, Integer>> testVectors) {
        long startTime = System.currentTimeMillis();
        double coverage = serialFaultSimulation(faults, testVectors);
        long endTime = System.currentTimeMillis();
        System.out.println("Serial Fault Simulation Time: " + (endTime - startTime) + " ms");
        System.out.println("Serial Fault Coverage: " + (coverage * 100) + "%");
        return (endTime - startTime) / 1000.0; // Return time in seconds
    }

    public double parallelFaultSimulationWithMetrics(List<Fault> faults, List<Map<String, Integer>> testVectors) {
        long startTime = System.currentTimeMillis();
        double coverage = parallelFaultSimulation(faults, testVectors);
        long endTime = System.currentTimeMillis();
        System.out.println("Parallel Fault Simulation Time: " + (endTime - startTime) + " ms");
        System.out.println("Parallel Fault Coverage: " + (coverage * 100) + "%");
        return (endTime - startTime) / 1000.0; // Return time in seconds
    }

}
