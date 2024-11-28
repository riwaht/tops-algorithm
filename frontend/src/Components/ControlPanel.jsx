// src/Components/ControlPanel.jsx
import React from "react";

const ControlPanel = ({
    onFaultSensitization,
    onFaultConeTracing,
    onNextStep,
    onDetectConflict,
    onReset,
    onCleanup,
    isTracing,
}) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={onFaultSensitization}>
                Fault Sensitization
            </button>
            <button onClick={onFaultConeTracing} disabled={isTracing}>
                Start Fault Cone Tracing
            </button>
            <button onClick={onNextStep} disabled={!isTracing}>
                Next Step
            </button>
            <button onClick={onDetectConflict} disabled={!isTracing}>
                Detect Conflict
            </button>
            <button onClick={onCleanup} disabled={isTracing}>
                Cleanup
            </button>
            <button onClick={onReset}>Reset</button>
        </div>
    );
};

export default ControlPanel;