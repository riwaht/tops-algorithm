// src/Components/StackView.jsx
import React from "react";

const StackView = ({ searchStack }) => {
    return (
        <div>
            <h3>Search Stack</h3>
            {searchStack.length === 0 ? (
                <p>No steps taken yet.</p>
            ) : (
                <ul>
                    {searchStack.map((state, index) => (
                        <li key={index}>
                            <strong>Step {index + 1}:</strong> {JSON.stringify(state.nodeValues)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StackView;