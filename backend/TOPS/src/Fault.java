public class Fault {
    public String node;          // Line ID where the fault is injected
    public int stuckAtValue;     // Fault type: 0 (SA0) or 1 (SA1)

    public Fault(String node, int stuckAtValue) {
        this.node = node;
        this.stuckAtValue = stuckAtValue;
    }

    @Override
    public String toString() {
        return node + "-SA" + stuckAtValue;
    }
}
