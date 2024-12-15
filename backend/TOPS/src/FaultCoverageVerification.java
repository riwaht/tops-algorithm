import java.util.*;

public class FaultCoverageVerification {
    public static void main(String[] args) {
        try {
            // Benchmarks and test vector counts
            String[] benchmarkFiles = {"C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\tops-algorithm\\backend\\TOPS\\src\\bench\\c499.bench"};
            int[] vectorCounts = {16, 32, 64, 128, 256};
            int wordLength = 32; // Default word length for parallel simulation

            for (String benchmarkFile : benchmarkFiles) {
                Circuit circuit = new Circuit();
                circuit.parseBenchFile(benchmarkFile);

                // Generate faults
                List<Fault> faults = new ArrayList<>();
                for (Gate gate : circuit.gates) {
                    String node = gate.getOutput().getId();
                    faults.add(new Fault(node, 0)); // Stuck-at-0
                    faults.add(new Fault(node, 1)); // Stuck-at-1
                }
                int totalFaults = faults.size();

                // Initialize FaultSimulator
                FaultSimulator faultSimulator = new FaultSimulator(circuit);

                System.out.println("\nBenchmark: " + benchmarkFile);
                System.out.println("Total Faults: " + totalFaults);

                for (int numVectors : vectorCounts) {
                    // Generate test vectors
                    List<Map<String, Integer>> testVectors = generateTestVectors(circuit.primaryInputs, numVectors);

                    System.out.println("Test Vectors: " + numVectors);

                    // Serial Simulation
                    long serialStartTime = System.currentTimeMillis();
                    faultSimulator.serialFaultSimulation(faults, testVectors);
                    long serialEndTime = System.currentTimeMillis();
                    double serialTime = (serialEndTime - serialStartTime) / 1000.0;

                    // Parallel Simulation
                    long parallelStartTime = System.currentTimeMillis();
                    faultSimulator.parallelFaultSimulation(faults, testVectors);
                    long parallelEndTime = System.currentTimeMillis();
                    double parallelTime = (parallelEndTime - parallelStartTime) / 1000.0;

                    // Calculate expected speedup
                    double expectedSpeedup = ((totalFaults + 1.0) * (wordLength - 1)) / totalFaults;

                    // Calculate actual speedup
                    double actualSpeedup = serialTime / parallelTime;

                    System.out.printf(
                            "Vectors: %d | Serial Time: %.2f s | Parallel Time: %.2f s | Expected Speedup: %.2f | Actual Speedup: %.2f%n",
                            numVectors, serialTime, parallelTime, expectedSpeedup, actualSpeedup
                    );

                    // Verify if actual speedup matches the theoretical formula
                    if (Math.abs(actualSpeedup - expectedSpeedup) > 0.1) {
                        System.out.println("Warning: Actual speedup deviates from theoretical prediction.");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static List<Map<String, Integer>> generateTestVectors(List<String> inputs, int numVectors) {
        List<Map<String, Integer>> testVectors = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < numVectors; i++) {
            Map<String, Integer> vector = new HashMap<>();
            for (String input : inputs) {
                vector.put(input, random.nextInt(2)); // Random 0 or 1
            }
            testVectors.add(vector);
        }

        return testVectors;
    }
}
