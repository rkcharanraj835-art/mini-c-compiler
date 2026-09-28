import React from "react";

function CodeOptimization({ optimization }) {
  return (
    <section className="panel optimization-panel">

      <div className="panel-title">
        <span>Code Optimization</span>

        {optimization && (
          <span className="count">
            {optimization.optimization_count || 0} optimizations
          </span>
        )}
      </div>

      {!optimization ? (
        <div className="empty">
          Generate intermediate code to perform optimization.
        </div>
      ) : (
        <>

          <div className="optimization-summary">

            <div className="optimization-card">
              <span className="optimization-value">
                {optimization.optimization_count || 0}
              </span>

              <span className="optimization-label">
                Optimizations Applied
              </span>
            </div>

          </div>


          <div className="optimization-section">

            <div className="sub-title">
              Optimized Three Address Code
            </div>

            <div className="tac-container">

              <div className="tac-header">
                <span>#</span>
                <span>Optimized Code</span>
                <span>Operation</span>
              </div>

              {optimization.instructions?.map(
                (instruction) => (

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

                )
              )}

            </div>

          </div>


          {optimization.optimizations?.length > 0 && (

            <div className="optimization-section">

              <div className="sub-title">
                Optimization Details
              </div>

              <div className="optimization-details">

                {optimization.optimizations.map(
                  (item, index) => (

                    <div
                      className="optimization-item"
                      key={index}
                    >

                      <div className="optimization-type">
                        {item.type}
                      </div>

                      <div className="optimization-change">

                        <code>
                          {item.original}
                        </code>

                        <span className="arrow">
                          →
                        </span>

                        <code>
                          {item.optimized}
                        </code>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </>
      )}

    </section>
  );
}

export default CodeOptimization;