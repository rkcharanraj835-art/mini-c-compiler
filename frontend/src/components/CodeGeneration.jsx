import React from "react";

function CodeGeneration({ codeGeneration }) {
  return (
    <section className="panel code-generation-panel">
      <div className="panel-title">
        <span>Code Generation — Target Code</span>

        {codeGeneration && (
          <span className="count">
            {codeGeneration.instruction_count || 0} instructions
          </span>
        )}
      </div>

      {!codeGeneration ? (
        <div className="empty">
          Complete code optimization to generate target code.
        </div>
      ) : (
        <>
          <div className="target-info">
            <div className="target-card">
              <span className="target-label">Target Format</span>
              <span className="target-value">
                {codeGeneration.target_type}
              </span>
            </div>

            <div className="target-card">
              <span className="target-label">Registers Used</span>
              <span className="target-value">
                {codeGeneration.register_count || 0}
              </span>
            </div>
          </div>

          <div className="target-code-container">
            <div className="target-code-header">
              <span>#</span>
              <span>Target Instruction</span>
              <span>Operation</span>
            </div>

            {codeGeneration.instructions?.map((instruction) => (
              <div className="target-code-row" key={instruction.index}>
                <span className="target-number">
                  {instruction.index}
                </span>

                <code className="target-instruction">
                  {instruction.code}
                </code>

                <span className="target-operation">
                  {instruction.operation}
                </span>
              </div>
            ))}
          </div>

          <div className="code-generation-note">
            Target code is represented using educational pseudo-assembly
            instructions such as MOV, ADD, SUB, MUL, DIV, CMP and jump
            instructions.
          </div>
        </>
      )}
    </section>
  );
}

export default CodeGeneration;