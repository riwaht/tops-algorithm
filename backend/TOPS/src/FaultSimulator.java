import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class FaultSimulator {
    private Circuit circuit;
    private Simulation simulation;

    public FaultSimulator(Circuit circuit) {
        this.circuit = circuit;
        this.simulation = new Simulation(circuit);
    }

    // Simulate the circuit with a fault
    private Map<Integer, Integer> simulateWithFault(Map<Integer, Integer> inputValues, Fault fault) {
        Map<Integer, Integer> values = new HashMap<>(inputValues);

        // Inject fault only if it's not an input signal
        if (!circuit.inputs.contains(fault.node)) {
            values.put(fault.node, fault.stuckAtValue);
        }

        List<Integer> topologicalOrder = simulation.levelizeCircuit();
        for (Integer node : topologicalOrder) {
            if (circuit.gates.containsKey(node)) {
                Gate gate = circuit.gates.get(node);
                if (!values.containsKey(node)) {
                    values.put(gate.output, gate.evaluate(values));
                }
            }
        }

        Map<Integer, Integer> outputValues = new HashMap<>();
        for (Integer output : circuit.outputs) {
            outputValues.put(output, values.get(output));
        }

        return outputValues;
    }

    // Validate fault detection
    public double serialFaultSimulation(List<Fault> faults, List<Map<Integer, Integer>> testVectors) {
        int detectedFaults = 0;

        for (Fault fault : faults) {
            boolean detected = false;
            for (Map<Integer, Integer> testVector : testVectors) {
                Map<Integer, Integer> faultFreeOutput = simulation.simulate(testVector);
                Map<Integer, Integer> faultyOutput = simulateWithFault(testVector, fault);

                if (!faultFreeOutput.equals(faultyOutput)) {
                    detected = true;
                    break;
                }
            }
            if (detected) {
                detectedFaults++;
            } else {
                System.out.println("Undetected Fault: " + fault);
            }
        }

        return (double) detectedFaults / faults.size();
    }

    public double parallelFaultSimulation(List<Fault> faults, List<Map<Integer, Integer>> testVectors) {
        int detectedFaults = 0;

        for (Fault fault : faults) {
            AtomicBoolean detected = new AtomicBoolean(false);
            testVectors.parallelStream().forEach(testVector -> {
                Map<Integer, Integer> faultFreeOutput = simulation.simulate(testVector);
                Map<Integer, Integer> faultyOutput = simulateWithFault(testVector, fault);

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

        return (double) detectedFaults / faults.size();
    }
}
