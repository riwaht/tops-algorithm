import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.XYPlot;
import org.jfree.chart.renderer.xy.XYLineAndShapeRenderer;
import org.jfree.data.xy.XYSeries;
import org.jfree.data.xy.XYSeriesCollection;

import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;


public class PerformanceAnalysis {
    public static void main(String[] args) {
        try {
            // Benchmarks and test vector counts
            String[] benchmarkFiles = {"C:\\Users\\User\\Desktop\\UNI\\2024Fall\\COE529\\Project\\tops-algorithm\\backend\\TOPS\\src\\bench\\c499.bench"};
            int[] vectorCounts = {16, 32, 64, 128, 256};

            // Store results for plotting
            Map<String, Map<String, List<Double>>> performanceData = new HashMap<>();

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

                // Initialize FaultSimulator
                FaultSimulator faultSimulator = new FaultSimulator(circuit);

                // Store performance for this benchmark
                Map<String, List<Double>> times = new HashMap<>();
                times.put("Serial", new ArrayList<>());
                times.put("Parallel", new ArrayList<>());

                for (int numVectors : vectorCounts) {
                    // Generate test vectors
                    List<Map<String, Integer>> testVectors = generateTestVectors(circuit.primaryInputs, numVectors);

                    System.out.println("\nBenchmark: " + benchmarkFile + ", Test Vectors: " + numVectors);

                    // Serial Simulation
                    double serialTime = faultSimulator.serialFaultSimulationWithMetrics(faults, testVectors);
                    times.get("Serial").add(serialTime);

                    // Parallel Simulation
                    double parallelTime = faultSimulator.parallelFaultSimulationWithMetrics(faults, testVectors);
                    times.get("Parallel").add(parallelTime);

                    System.out.printf(
                            "Benchmark: %s, Vectors: %d, Serial Time: %.2f sec, Parallel Time: %.2f sec%n",
                            benchmarkFile, numVectors, serialTime, parallelTime
                    );
                }

                performanceData.put(benchmarkFile, times);
            }

            // Plot the performance data
            for (String benchmark : benchmarkFiles) {
                createPerformanceChart(
                        benchmark,
                        vectorCounts,
                        performanceData.get(benchmark).get("Serial"),
                        performanceData.get(benchmark).get("Parallel")
                );
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

    private static void createPerformanceChart(
            String benchmarkName,
            int[] vectorCounts,
            List<Double> serialTimes,
            List<Double> parallelTimes
    ) {
        // Create datasets
        XYSeries serialSeries = new XYSeries("Serial Fault Simulation");
        XYSeries parallelSeries = new XYSeries("Parallel Fault Simulation");

        for (int i = 0; i < vectorCounts.length; i++) {
            serialSeries.add(vectorCounts[i], serialTimes.get(i));
            parallelSeries.add(vectorCounts[i], parallelTimes.get(i));
        }

        XYSeriesCollection dataset = new XYSeriesCollection();
        dataset.addSeries(serialSeries);
        dataset.addSeries(parallelSeries);

        // Create the chart
        JFreeChart chart = ChartFactory.createXYLineChart(
                "Fault Simulation Performance: " + benchmarkName,
                "Number of Test Vectors",
                "CPU Time (s)",
                dataset,
                PlotOrientation.VERTICAL,
                true,
                true,
                false
        );

        // Customize chart appearance
        XYPlot plot = chart.getXYPlot();
        plot.setBackgroundPaint(Color.white);
        plot.setDomainGridlinePaint(Color.lightGray);
        plot.setRangeGridlinePaint(Color.lightGray);

        XYLineAndShapeRenderer renderer = new XYLineAndShapeRenderer();
        renderer.setSeriesShapesVisible(0, true);
        renderer.setSeriesShapesVisible(1, true);
        plot.setRenderer(renderer);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setStandardTickUnits(NumberAxis.createStandardTickUnits());

        // Display the chart in a JFrame
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("Performance Analysis: " + benchmarkName);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.add(new ChartPanel(chart));
            frame.pack();
            frame.setVisible(true);
        });
    }
}
