import java.util.ArrayList;
import java.util.List;

public class Line {
    private int value;
    private String id;
    private String type; // "input", "output", or ""
    private List<Gate> connectedGates = new ArrayList<>();
    private List<Line> connectedLines = new ArrayList<>();

    public Line(int value, String type, String id) {
        this.value = value;
        this.type = type;
        this.id = id;
    }

    public int getLineValue() {
        return value;
    }

    public void setLineValue(int value) {
        this.value = value;
        // Optionally, propagate values to connected lines if any
        for (Line l : connectedLines) {
            l.setLineValue(value);
        }
    }

    public String getId() {
        return id;
    }

    public void addConnectedGate(Gate g) {
        connectedGates.add(g);
    }

    public List<Gate> getConnectedGates() {
        return connectedGates;
    }

    public void addConnectedLine(Line l) {
        connectedLines.add(l);
    }

    public List<Line> getConnectedLines() {
        return connectedLines;
    }

    public String getType() {
        return type;
    }

    @Override
    public String toString() {
        return "Line{id='" + id + "', value=" + value + ", type='" + type + "'}";
    }
}
