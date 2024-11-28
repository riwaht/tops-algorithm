import React from "react";

function ControlPanel({
    onFaultSensitization,
    onFaultConeTracing,
    onDetectConflict,
    onNextStep,
    onReset,
    onCleanup,
}) {
    return (
        <div>
            <button onClick={onFaultSensitization}>Fault Sensitization</button>
            <button onClick={onFaultConeTracing}>Fault Cone Tracing</button>
            <button onClick={onNextStep}>Next Step</button>
            <button onClick={onReset}>Reset</button>
            <button onClick={onCleanup}>Cleanup</button>
        </div>
    );
}

export default ControlPanel;
