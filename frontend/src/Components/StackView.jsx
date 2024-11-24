import React from "react";

function StackView({ searchStack }) {
    return (
        <div>
            <h3>Search Stack</h3>
            <ul>
                {searchStack.map((state, index) => (
                    <li key={index}>
                        <pre>{JSON.stringify(state.nodeValues, null, 2)}</pre>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StackView;