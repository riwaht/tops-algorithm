import java.io.IOException;
import java.util.*;

public class BenchmarkParser {
    public static void main(String[] args) {
        Circuit circuit = new Circuit();
        Scanner scanner = new Scanner(System.in);
        try {
            // Parse the benchmark file
            String filePath = "C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\tops-algorithm\\backend\\TOPS\\src\\bench\\c17.bench";
            circuit.parseBenchFile(filePath);

            // Print the parsed circuit for verification
            circuit.printCircuit();

            // Initialize inputValues with all primary inputs
            Map<String, Integer> inputValues = new HashMap<>();

            // Allow user to set input values through console
            System.out.println("\nSet the values for the following inputs:");
            for (String input : circuit.primaryInputs) {
                System.out.print("Enter value for input " + input + " (0 or 1): ");
                int value = scanner.nextInt();
                while (value != 0 && value != 1) {
                    System.out.print("Invalid value. Enter 0 or 1 for input " + input + ": ");
                    value = scanner.nextInt();
                }
                inputValues.put(input, value);
            }

            // Print assigned input values
            System.out.println("\nAssigned Input Values:");
            for (String input : circuit.primaryInputs) {
                System.out.println("Input " + input + ": " + inputValues.get(input));
            }

            // Initialize the Simulation class
            Simulation simulation = new Simulation(circuit);

            // Simulate the circuit without faults
            Map<String, Integer> outputValues = simulation.simulate(inputValues);
            System.out.println("\nOutput Values at the Gates:");
            for (String output : circuit.primaryOutputs) {
                System.out.println("Output " + output + ": " + outputValues.get(output));
            }

        } catch (IOException e) {
            System.err.println("Error reading benchmark file: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            scanner.close();
        }
    }
}
