import React from "react";

function IntermediateCode({ intermediate }) {
  return (
    <section className="panel intermediate-panel">

      <div className="panel-title">
        <span>Intermediate Code Generation — Three Address Code</span>

        {intermediate && (
          <span className="count">
            {intermediate.instructions?.length || 0} instructions
          </span>
        )}
      </div>

      {!intermediate ? (
        <div className="empty">
          Complete semantic analysis to generate intermediate code.
        </div>
      ) : (
        <div className="tac-container">

          <div className="tac-header">
            <span>#</span>
            <span>Three Address Code</span>
            <span>Operation</span>
          </div>

          {intermediate.instructions?.map((instruction) => (
            <div
              className="tac-row"
              key={instruction.index}
            >
              <span className="tac-number">
                {instruction.index}
              </span>

              <code className="tac-code">
                {instruction.code}
              </code>

              <span className="tac-operation">
                {instruction.operation}
              </span>
            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default IntermediateCode;