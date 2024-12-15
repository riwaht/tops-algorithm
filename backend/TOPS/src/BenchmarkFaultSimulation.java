import java.util.*;

public class BenchmarkFaultSimulation {
    public static void main(String[] args) {
        Circuit circuit = new Circuit();
        try {
            // Parse the benchmark file
            String benchFilePath = "C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\tops-algorithm\\backend\\TOPS\\src\\bench\\c499.bench";
            circuit.parseBenchFile(benchFilePath);

            // Initialize FaultSimulator with the parsed circuit
            FaultSimulator faultSimulator = new FaultSimulator(circuit);

            // Define all faults (stuck-at-0 and stuck-at-1)
            List<Fault> faults = new ArrayList<>();

            // Add faults for each gate's output
            for (Gate gate : circuit.gates) {
                String node = gate.getOutput().getId();
                faults.add(new Fault(node, 0)); // Stuck-at-0
                faults.add(new Fault(node, 1)); // Stuck-at-1
            }

            // Add faults for each primary output
            for (String output : circuit.primaryOutputs) {
                faults.add(new Fault(output, 0)); // Stuck-at-0
                faults.add(new Fault(output, 1)); // Stuck-at-1
            }

            // Generate exhaustive test vectors based on input signal names
            List<Map<String, Integer>> testVectors = generateAllTestVectors(new HashSet<>(circuit.primaryInputs));

            // Validate that all test vectors include all required inputs
            validateInputs(testVectors, new HashSet<>(circuit.primaryInputs));

            // Perform serial fault simulation
            long startTime = System.currentTimeMillis();
            double serialCoverage = faultSimulator.serialFaultSimulation(faults, testVectors);
            long serialTime = System.currentTimeMillis() - startTime;

            // Perform parallel fault simulation
            startTime = System.currentTimeMillis();
            double parallelCoverage = faultSimulator.parallelFaultSimulation(faults, testVectors);
            long parallelTime = System.currentTimeMillis() - startTime;

            // Print simulation results
            System.out.println("Serial Fault Coverage: " + (serialCoverage * 100) + "%");
            System.out.println("Serial Simulation Time: " + serialTime + " ms");
            System.out.println("Parallel Fault Coverage: " + (parallelCoverage * 100) + "%");
            System.out.println("Parallel Simulation Time: " + parallelTime + " ms");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Generates all possible test vectors for the given input signals.
     * Limits the number of test vectors to 2^10 = 1024 for performance reasons.
     *
     * @param inputs A set of input line identifiers.
     * @return A list of test vectors, each represented as a map from line IDs to binary values.
     */
    private static List<Map<String, Integer>> generateAllTestVectors(Set<String> inputs) {
        List<Map<String, Integer>> testVectors = new ArrayList<>();
        List<String> inputList = new ArrayList<>(inputs);
        int numInputs = inputList.size();
        int maxVectors = 1 << Math.min(numInputs, 10); // Limit to 2^10 = 1024 vectors

        for (int i = 0; i < maxVectors; i++) {
            Map<String, Integer> vector = new HashMap<>();
            for (int j = 0; j < numInputs; j++) {
                if (j < 10) { // Only consider the first 10 inputs for generating test vectors
                    vector.put(inputList.get(j), (i >> j) & 1);
                } else {
                    vector.put(inputList.get(j), 0); // Default value for inputs beyond the limit
                }
            }
            testVectors.add(vector);
        }
        return testVectors;
    }

    /**
     * Validates that all test vectors include all required input signals.
     *
     * @param testVectors A list of test vectors to validate.
     * @param inputs      A set of input line identifiers that must be present in each test vector.
     */
    private static void validateInputs(List<Map<String, Integer>> testVectors, Set<String> inputs) {
        for (Map<String, Integer> vector : testVectors) {
            for (String input : inputs) {
                if (!vector.containsKey(input)) {
                    throw new IllegalStateException("Test vector missing value for input: " + input);
                }
            }
        }
    }
}
