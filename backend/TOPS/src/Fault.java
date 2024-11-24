class Fault {
    int node;          // Node where the fault occurs
    int stuckAtValue;  // Fault type (0 or 1)

    public Fault(int node, int stuckAtValue) {
        this.node = node;
        this.stuckAtValue = stuckAtValue;
    }

    @Override
    public String toString() {
        return "Fault{" +
                "node=" + node +
                ", stuckAtValue=" + stuckAtValue +
                '}';
    }
}
