import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Gate {
    String type;
    private Line output;
    private List<Line> inputs = new ArrayList<>();

    public Gate(String type) {
        this.type = type;
    }

    public void addInput(Line inputLine) {
        inputs.add(inputLine);
    }

    public void removeInput(String lineId) {
        inputs.removeIf(l -> l.getId().equals(lineId));
    }

    public void setOutput(Line outputLine) {
        this.output = outputLine;
    }

    public Line getOutput() {
        return output;
    }

    public List<Line> getInputs() {
        return inputs;
    }

    /**
     * Evaluates the gate based on current input values.
     *
     * @param values A map from line IDs to their current values.
     * @return The output value of the gate.
     */
    public int evaluate(Map<String, Integer> values) {
        List<Integer> inputValues = new ArrayList<>();
        for (Line inLine : inputs) {
            if (!values.containsKey(inLine.getId())) {
                throw new IllegalStateException("Input value for line " + inLine.getId() + " is missing.");
            }
            inputValues.add(values.get(inLine.getId()));
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
            case "XNOR":
                return ~(inputValues.stream().reduce(0, (a, b) -> a ^ b)) & 1;
            case "NOT":
                if (inputValues.size() != 1) {
                    throw new IllegalArgumentException("NOT gate must have exactly one input.");
                }
                return ~inputValues.get(0) & 1;
            case "BUF":
                if (inputValues.size() != 1) {
                    throw new IllegalArgumentException("BUFF gate must have exactly one input.");
                }
                return inputValues.get(0);
            default:
                throw new IllegalArgumentException("Unknown gate type: " + type);
        }
    }

    @Override
    public String toString() {
        StringBuilder inIds = new StringBuilder();
        for (Line l : inputs) {
            inIds.append(l.getId()).append(" ");
        }
        return "Gate{type='" + type + "', output=" + output.getId() + ", inputs=" + inIds.toString().trim() + "}";
    }
}
