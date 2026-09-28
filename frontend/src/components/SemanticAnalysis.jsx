import React from "react";

function SemanticAnalysis({ semantic }) {
  if (!semantic) {
    return (
      <section className="semantic-panel">
        <div className="semantic-header">
          <div>
            <span className="section-kicker">PHASE 03</span>
            <h2>Semantic Analysis</h2>
          </div>

          <span className="semantic-status waiting">
            Waiting
          </span>
        </div>

        <div className="semantic-empty">
          <div className="semantic-empty-icon">◌</div>

          <h3>Semantic analysis not performed</h3>

          <p>
            Compile a valid source program to construct the
            symbol table and perform semantic checks.
          </p>
        </div>
      </section>
    );
  }

  const symbols = semantic.symbols || [];

  return (
    <section className="semantic-panel">
      <div className="semantic-header">
        <div>
          <span className="section-kicker">PHASE 03</span>
          <h2>Semantic Analysis</h2>
        </div>

        <span className="semantic-status success">
          ✓ Analysis Passed
        </span>
      </div>

      <div className="semantic-summary">
        <div className="semantic-summary-item">
          <span className="summary-label">
            Identifiers
          </span>

          <strong>
            {symbols.length}
          </strong>
        </div>

        <div className="semantic-summary-item">
          <span className="summary-label">
            Scope
          </span>

          <strong>
            Global
          </strong>
        </div>

        <div className="semantic-summary-item">
          <span className="summary-label">
            Errors
          </span>

          <strong>
            0
          </strong>
        </div>
      </div>

      <div className="symbol-table-section">
        <div className="symbol-table-heading">
          <div>
            <span className="section-kicker">
              SYMBOL TABLE
            </span>

            <h3>
              Identifier Information
            </h3>
          </div>

          <span className="symbol-count">
            {symbols.length} symbols
          </span>
        </div>

        {symbols.length === 0 ? (
          <div className="semantic-empty small">
            <p>
              No identifiers were found.
            </p>
          </div>
        ) : (
          <div className="symbol-table-wrapper">
            <table className="symbol-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Identifier</th>
                  <th>Data Type</th>
                  <th>Scope</th>
                  <th>Known Value</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {symbols.map((symbol, index) => (
                  <tr
                    key={`${symbol.name}-${index}`}
                  >
                    <td className="symbol-index">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td>
                      <code className="symbol-name">
                        {symbol.name}
                      </code>
                    </td>

                    <td>
                      <span className="type-badge">
                        {symbol.data_type}
                      </span>
                    </td>

                    <td>
                      <span className="scope-text">
                        {symbol.scope}
                      </span>
                    </td>

                    <td>
                      {symbol.value !== null &&
                      symbol.value !== undefined ? (
                        <code className="known-value">
                          {symbol.value}
                        </code>
                      ) : (
                        <span className="unknown-value">
                          —
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="declared-badge">
                        ✓ Declared
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="semantic-rules">
        <div className="semantic-rule">
          <span className="rule-icon">✓</span>
          <span>
            Declaration checking
          </span>
        </div>

        <div className="semantic-rule">
          <span className="rule-icon">✓</span>
          <span>
            Undeclared identifier checking
          </span>
        </div>

        <div className="semantic-rule">
          <span className="rule-icon">✓</span>
          <span>
            Redeclaration checking
          </span>
        </div>

        <div className="semantic-rule">
          <span className="rule-icon">✓</span>
          <span>
            Integer type checking
          </span>
        </div>

        <div className="semantic-rule">
          <span className="rule-icon">✓</span>
          <span>
            Constant expression evaluation
          </span>
        </div>
      </div>
    </section>
  );
}

export default SemanticAnalysis;