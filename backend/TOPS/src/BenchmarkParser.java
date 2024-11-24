import java.io.*;
import java.util.*;

import java.util.*;

class Gate {
    String type;
    List<Integer> inputs;
    int output;

    public Gate(String type, int output, List<Integer> inputs) {
        this.type = type;
        this.output = output;
        this.inputs = inputs;
    }

    public int evaluate(Map<Integer, Integer> values) {
        List<Integer> inputValues = new ArrayList<>();
        for (int input : inputs) {
            if (!values.containsKey(input)) {
                throw new IllegalStateException("Input values are not properly initialized for gate: " + type);
            }
            inputValues.add(values.get(input));
        }

        switch (type.toUpperCase()) {
            case "AND":
                return inputValues.stream().reduce(1, (a, b) -> a & b);
            case "OR":
                return inputValues.stream().reduce(0, (a, b) -> a | b);
            case "NAND":
                return ~(inputValues.stream().reduce(1, (a, b) -> a & b)) & 1;
            case "NOR":
                return ~(inputValues.stream().reduce(0, (a, b) -> a | b)) & 1;
            case "XOR":
                return inputValues.stream().reduce(0, (a, b) -> a ^ b);
            case "NOT":
                if (inputValues.size() != 1) {
                    throw new IllegalArgumentException("NOT gate must have exactly one input.");
                }
                return ~inputValues.get(0) & 1;
            default:
                throw new IllegalArgumentException("Unknown gate type: " + type);
        }
    }

    @Override
    public String toString() {
        return "Gate{" +
                "type='" + type + '\'' +
                ", inputs=" + inputs +
                ", output=" + output +
                '}';
    }
}

class Circuit {
    Set<Integer> inputs = new HashSet<>();
    Set<Integer> outputs = new HashSet<>();
    Map<Integer, Gate> gates = new HashMap<>();

    public void addInput(int input) {
        inputs.add(input);
    }

    public void addOutput(int output) {
        outputs.add(output);
    }

    public void addGate(String type, int output, List<Integer> inputs) {
        gates.put(output, new Gate(type, output, inputs));
    }

    public void parseBenchFile(String filePath) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.startsWith("#") || line.isEmpty()) continue;

                if (line.startsWith("INPUT")) {
                    int input = Integer.parseInt(line.replaceAll("[^0-9]", ""));
                    addInput(input);
                } else if (line.startsWith("OUTPUT")) {
                    int output = Integer.parseInt(line.replaceAll("[^0-9]", ""));
                    addOutput(output);
                } else {
                    String[] parts = line.split("=");
                    int output = Integer.parseInt(parts[0].trim());
                    String[] gateParts = parts[1].trim().split("[()]");
                    String type = gateParts[0].trim();
                    String[] inputStrings = gateParts[1].split(",");
                    List<Integer> gateInputs = new ArrayList<>();
                    for (String input : inputStrings) {
                        gateInputs.add(Integer.parseInt(input.trim()));
                    }
                    addGate(type, output, gateInputs);
                }
            }
        }
    }

    public void printCircuit() {
        System.out.println("Inputs: " + inputs);
        System.out.println("Outputs: " + outputs);
        System.out.println("Gates:");
        for (Gate gate : gates.values()) {
            System.out.println(gate);
        }
    }
}



public class BenchmarkParser {
    public static void main(String[] args) {
        Circuit circuit = new Circuit();
        try {
            // Parse the benchmark file
            String filePath = "C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\TOPS\\src\\c17.bench";
            circuit.parseBenchFile(filePath);

            // Print the parsed circuit for verification
            circuit.printCircuit();

            // Initialize the Simulation class
            Simulation simulation = new Simulation(circuit);

            // Input vector for simulation
            Map<Integer, Integer> inputValues = Map.of(
                    1, 1,
                    2, 1,
                    3, 0,
                    6, 1,
                    7, 0
            );

            // Simulate the circuit
            Map<Integer, Integer> outputValues = simulation.simulate(inputValues);

            // Print the output values
            System.out.println("Output: " + outputValues);
        } catch (IOException e) {
            System.err.println("Error reading benchmark file: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

