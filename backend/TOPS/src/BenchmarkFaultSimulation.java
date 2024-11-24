import java.util.*;

public class BenchmarkFaultSimulation {
    public static void main(String[] args) {
        Circuit circuit = new Circuit();
        try {
            circuit.parseBenchFile("C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\TOPS\\src\\c499.bench");

            FaultSimulator faultSimulator = new FaultSimulator(circuit);

            // Define all faults (stuck-at-0 and stuck-at-1)
            List<Fault> faults = new ArrayList<>();
            for (int node : circuit.gates.keySet()) {
                faults.add(new Fault(node, 0));
                faults.add(new Fault(node, 1));
            }
            for (int output : circuit.outputs) {
                faults.add(new Fault(output, 0));
                faults.add(new Fault(output, 1));
            }


            // Generate exhaustive test vectors based on input signal numbers
            List<Map<Integer, Integer>> testVectors = generateAllTestVectors(circuit.inputs);

            // Validate test vectors
            validateInputs(testVectors, circuit.inputs);

            // Perform serial fault simulation
            long startTime = System.currentTimeMillis();
            double serialCoverage = faultSimulator.serialFaultSimulation(faults, testVectors);
            long serialTime = System.currentTimeMillis() - startTime;

            startTime = System.currentTimeMillis();
            double parallelCoverage = faultSimulator.parallelFaultSimulation(faults, testVectors);
            long parallelTime = System.currentTimeMillis() - startTime;
            System.out.println("Serial Fault Coverage: " + (serialCoverage * 100) + "%");
            System.out.println("Serial Simulation Time: " + serialTime + " ms");
            System.out.println("Parallel Fault Coverage: " + (parallelCoverage * 100) + "%");
            System.out.println("Parallel Simulation Time: " + parallelTime + " ms");


        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Generates all possible test vectors for the specific input signals
    private static List<Map<Integer, Integer>> generateAllTestVectors(Set<Integer> inputs) {
        List<Map<Integer, Integer>> testVectors = new ArrayList<>();
        List<Integer> inputList = new ArrayList<>(inputs);
        int numInputs = inputs.size();
        int maxVectors = 1 << Math.min(numInputs, 10); // Limit to 2^10 = 1024 vectors for performance

        for (int i = 0; i < maxVectors; i++) {
            Map<Integer, Integer> vector = new HashMap<>();
            for (int j = 0; j < numInputs; j++) {
                if (j < 10) {
                    vector.put(inputList.get(j), (i >> j) & 1);
                } else {
                    vector.put(inputList.get(j), 0); // Default value for inputs beyond the limit
                }
            }
            testVectors.add(vector);
        }
        return testVectors;
    }


    // Validates that all test vectors include all required inputs
    private static void validateInputs(List<Map<Integer, Integer>> testVectors, Set<Integer> inputs) {
        for (Map<Integer, Integer> vector : testVectors) {
            for (Integer input : inputs) {
                if (!vector.containsKey(input)) {
                    throw new IllegalStateException("Test vector missing value for input: " + input);
                }
            }
        }
    }
}
