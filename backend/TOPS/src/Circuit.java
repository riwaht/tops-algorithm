import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;

public class Circuit {
    List<String> primaryInputs = new ArrayList<>();
    List<String> primaryOutputs = new ArrayList<>();
    List<Gate> gates = new ArrayList<>();
    Map<String, Line> lines = new HashMap<>();
    Map<String, Integer> inputCounts = new HashMap<>(); // to track fanout

    public void addInput(String inputId) {
        primaryInputs.add(inputId);
        lines.put(inputId, new Line(0, "input", inputId));
    }

    public void addOutput(String outputId) {
        primaryOutputs.add(outputId);
        // If output line not defined yet, define it
        lines.putIfAbsent(outputId, new Line(0, "output", outputId));
        lines.get(outputId).setLineValue(0);
    }

    public void parseBenchFile(String filePath) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String lineStr;
            while ((lineStr = reader.readLine()) != null) {
                lineStr = lineStr.trim();
                if (lineStr.startsWith("#") || lineStr.isEmpty()) continue;

                if (lineStr.startsWith("INPUT")) {
                    String lineId = lineStr.substring(lineStr.indexOf("(") + 1, lineStr.indexOf(")")).trim();
                    addInput(lineId);
                } else if (lineStr.startsWith("OUTPUT")) {
                    String lineId = lineStr.substring(lineStr.indexOf("(") + 1, lineStr.indexOf(")")).trim();
                    addOutput(lineId);
                } else if (lineStr.contains("=")) {
                    // Format: out = GATE(...inputs...)
                    String[] parts = lineStr.split("=");
                    if (parts.length != 2) {
                        throw new IllegalArgumentException("Invalid gate definition: " + lineStr);
                    }
                    String outputId = parts[0].trim();
                    String gateDef = parts[1].trim();

                    // Extract gate type and inputs
                    int gateTypeEnd = gateDef.indexOf("(");
                    if (gateTypeEnd == -1 || !gateDef.endsWith(")")) {
                        throw new IllegalArgumentException("Invalid gate format: " + gateDef);
                    }
                    String gateType = gateDef.substring(0, gateTypeEnd).trim();
                    String insideParens = gateDef.substring(gateTypeEnd + 1, gateDef.length() - 1).trim();
                    String[] inputIds;

                    if (gateType.equalsIgnoreCase("BUFF") || gateType.equalsIgnoreCase("NOT")) {
                        inputIds = new String[]{insideParens};
                    } else {
                        inputIds = insideParens.split(",");
                        for (int i = 0; i < inputIds.length; i++) {
                            inputIds[i] = inputIds[i].trim();
                        }
                    }

                    // Create gate
                    Gate gate = new Gate(gateType);

                    // Ensure output line exists
                    if (!lines.containsKey(outputId)) {
                        lines.put(outputId, new Line(0, "output", outputId));
                    }

                    gate.setOutput(lines.get(outputId));

                    // Handle inputs and fanout
                    for (String inId : inputIds) {
                        if (!lines.containsKey(inId)) {
                            lines.put(inId, new Line(0, "", inId));
                        }

                        // Connect the gate to its input lines
                        gate.addInput(lines.get(inId));
                        lines.get(inId).addConnectedGate(gate);
                    }

                    gates.add(gate);
                }
            }
        }
    }

    public void printCircuit() {
        System.out.println("Primary Inputs: " + primaryInputs);
        System.out.println("Primary Outputs: " + primaryOutputs);
        System.out.println("Lines:");
        for (Line l : lines.values()) {
            System.out.println(l);
        }
        System.out.println("Gates:");
        for (Gate g : gates) {
            System.out.println(g);
        }
    }
}
