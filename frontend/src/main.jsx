import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

import ParseTreeViewer from "./components/ParseTreeViewer";


/* =========================================================
   SAMPLE PROGRAMS
========================================================= */

const samples = {
  Shopping: `int price;
int discount;
int amount;
int finalPrice;
int category;

price = 2000;
discount = 10;
amount = price - (price * discount / 100);
finalPrice = amount + 50;

if (finalPrice > 1500)
    category = 1;
else
    category = 2;`,

  Arithmetic: `a = b + c * d;`,

  Parentheses: `x = (a + b) * c;`,

  While: `int a;
a = 0;
while (a < 5)
    a = a + 1;`,

  Calculator: `10 + 20 * 3;`,

  Student: `int mark1, mark2, mark3;
int total;

mark1 = 80;
mark2 = 75;
mark3 = 90;

total = mark1 + mark2 + mark3;

if (total >= 150)
    result = 1;
else
    result = 0;`,
};


/* =========================================================
   COMPILER PHASES
========================================================= */

const phases = [
  [
    "Lexical Analysis",
    "Tokenization",
  ],
  [
    "Syntax Analysis",
    "Grammar + Parse Tree",
  ],
  [
    "Semantic Analysis",
    "Symbol Table + Types",
  ],
  [
    "Intermediate Code Generation",
    "Three Address Code",
  ],
  [
    "Code Optimization",
    "TAC Optimization",
  ],
  [
    "Code Generation",
    "Target Pseudo Assembly",
  ],
];


/* =========================================================
   TABLE COMPONENT
========================================================= */

function Table({ children }) {
  return (
    <div className="table-wrap">
      <table>
        {children}
      </table>
    </div>
  );
}


/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [source, setSource] =
    useState(samples.Shopping);

  const [data, setData] =
    useState(null);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [sample, setSample] =
    useState("Shopping");


  /* -------------------------------------------------------
     GET CURRENT PHASE STATUS
  ------------------------------------------------------- */

  const stage = (name) => {
    return data?.stages?.[name] || "not-run";
  };


  /* -------------------------------------------------------
     COMPILE PROGRAM
  ------------------------------------------------------- */

  async function compile() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/compile",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            source,
          }),
        }
      );

      const result =
        await response.json();

      setData(result);

      if (!response.ok) {
        setError(
          result.error ||
            "Compilation failed."
        );
      }
    } catch (err) {
      setError(
        "Backend not reachable. Start the Flask server first."
      );

      setData(null);
    } finally {
      setBusy(false);
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>
          <div className="eyebrow">
            COMPILER DESIGN PROJECT
          </div>

          <h1>
            ⚡ Mini C Compiler
          </h1>

          <p>
            Six-phase compiler laboratory
            based on the Assignment-II
            test cases.
          </p>
        </div>

        <span className="version">
          FINAL • PDF TEST SUITE
        </span>

      </header>


      {/* =================================================
          SOURCE + PIPELINE
      ================================================= */}

      <section className="workspace">

        {/* -------------------------------------------------
            SOURCE PROGRAM
        ------------------------------------------------- */}

        <div className="panel source-panel">

          <div className="panel-title">

            <span>
              Source Program
            </span>

            <div className="sample-controls">

              <select
                value={sample}
                onChange={(event) => {
                  const selected =
                    event.target.value;

                  setSample(selected);

                  setSource(
                    samples[selected]
                  );
                }}
              >
                {Object.keys(samples).map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>

              <span className="lang">
                Mini C
              </span>

            </div>

          </div>


          <textarea
            value={source}
            onChange={(event) =>
              setSource(
                event.target.value
              )
            }
            spellCheck="false"
          />


          <button
            className="compile-btn"
            onClick={compile}
            disabled={busy}
          >
            {busy
              ? "⏳ Compiling..."
              : "⚙ Compile Program"}
          </button>

        </div>


        {/* -------------------------------------------------
            COMPILER PIPELINE
        ------------------------------------------------- */}

        <div className="panel pipeline">

          <div className="panel-title">

            <span>
              Compiler Pipeline
            </span>

            <span
              className={
                error
                  ? "badge fail"
                  : "badge"
              }
            >
              {error
                ? "ERROR"
                : data?.success
                ? "COMPILED"
                : "READY"}
            </span>

          </div>


          {/* Error */}

          {error && (
            <div className="status error">
              {error}
            </div>
          )}


          {/* Success */}

          {!error &&
            data?.success && (
              <div className="status success">
                Compilation completed
                successfully ✓
              </div>
            )}


          {/* Phase List */}

          <div className="phase-list">

            {phases.map(
              ([name, description], index) => {
                const currentStage =
                  stage(name);

                return (
                  <div
                    className={`phase ${currentStage}`}
                    key={name}
                  >

                    <span className="phase-icon">
                      {currentStage ===
                      "success"
                        ? "✓"
                        : currentStage ===
                          "failed"
                        ? "✗"
                        : currentStage ===
                          "warning"
                        ? "!"
                        : "○"}
                    </span>


                    <div>

                      <b>
                        {String(
                          index + 1
                        ).padStart(2, "0")}{" "}
                        {name}
                      </b>

                      <small>
                        {description}
                      </small>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          1. LEXICAL ANALYSIS
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            1. Lexical Analysis — Token Stream
          </span>

          <span className="count">
            {data?.tokens?.length || 0} tokens
          </span>

        </div>


        {data?.tokens?.length ? (

          <Table>

            <thead>
              <tr>
                <th>#</th>
                <th>Lexeme</th>
                <th>Token Type</th>
                <th>Line</th>
                <th>Column</th>
              </tr>
            </thead>

            <tbody>

              {data.tokens.map(
                (token, index) => (
                  <tr key={index}>

                    <td>
                      {index + 1}
                    </td>

                    <td className="code">
                      {token.lexeme}
                    </td>

                    <td>
                      <span className="token">
                        {token.token_type}
                      </span>
                    </td>

                    <td>
                      {token.line}
                    </td>

                    <td>
                      {token.column}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </Table>

        ) : (

          <Empty
            text={
              "Compile a program to generate the token stream."
            }
          />

        )}

      </section>


      {/* =================================================
          2. SYNTAX ANALYSIS
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            2. Syntax Analysis — Parse Tree
          </span>

          <span className="count">
            Recursive Descent
          </span>

        </div>


        {data?.parse_tree ? (

          <ParseTreeViewer
            tree={data.parse_tree}
          />

        ) : (

          <Empty
            text={
              "The syntax tree appears after successful syntax analysis."
            }
          />

        )}

      </section>


      {/* =================================================
          3. SEMANTIC ANALYSIS
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            3. Semantic Analysis — Symbol Table
          </span>

          <span className="count">
            {data?.semantic?.symbols?.length ||
              0}{" "}
            symbols
          </span>

        </div>


        {data?.semantic ? (

          <>

            <div
              className={`inline-result ${
                data.semantic.success
                  ? "ok"
                  : "warn"
              }`}
            >
              {data.semantic.success
                ? "Semantic analysis completed ✓"
                : data.semantic.errors?.join(
                    " • "
                  )}
            </div>


            <Table>

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Scope</th>
                  <th>Value</th>
                </tr>

              </thead>


              <tbody>

                {data.semantic.symbols.map(
                  (symbol) => (
                    <tr
                      key={symbol.name}
                    >

                      <td className="code">
                        {symbol.name}
                      </td>

                      <td>
                        {symbol.data_type}
                      </td>

                      <td>
                        {symbol.scope}
                      </td>

                      <td>
                        {symbol.value ===
                          null ||
                        symbol.value ===
                          undefined
                          ? "—"
                          : String(
                              symbol.value
                            )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </Table>

          </>

        ) : (

          <Empty
            text={
              "Semantic information appears after syntax analysis."
            }
          />

        )}

      </section>


      {/* =================================================
          4. INTERMEDIATE CODE
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            4. Intermediate Code — Three Address Code
          </span>

          <span className="count">
            {data?.intermediate?.instructions
              ?.length || 0}{" "}
            instructions
          </span>

        </div>


        {data?.intermediate ? (

          <CodeList
            items={
              data.intermediate.instructions
            }
          />

        ) : (

          <Empty
            text={
              "TAC appears after syntax analysis."
            }
          />

        )}

      </section>


      {/* =================================================
          5. CODE OPTIMIZATION
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            5. Code Optimization
          </span>

          <span className="count">
            {data?.optimization
              ?.optimization_count || 0}{" "}
            optimizations
          </span>

        </div>


        {data?.optimization ? (

          <>

            <CodeList
              items={
                data.optimization.instructions
              }
            />


            {data.optimization.optimizations
              ?.length ? (

              <div className="details">

                {data.optimization.optimizations.map(
                  (optimization, index) => (

                    <div
                      className="opt"
                      key={index}
                    >

                      <b>
                        {optimization.type}
                      </b>

                      <code>
                        {optimization.original}
                      </code>

                      <span>
                        →
                      </span>

                      <code>
                        {optimization.optimized}
                      </code>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="inline-result neutral">
                No optimization required
                for this input.
              </div>

            )}

          </>

        ) : (

          <Empty
            text={
              "Optimization appears after TAC generation."
            }
          />

        )}

      </section>


      {/* =================================================
          6. CODE GENERATION
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            6. Code Generation — Target Code
          </span>

          <span className="count">
            {data?.code_generation
              ?.instruction_count || 0}{" "}
            instructions
          </span>

        </div>


        {data?.code_generation ? (

          <CodeList
            items={
              data.code_generation.instructions
            }
          />

        ) : (

          <Empty
            text={
              "Target code appears after optimization."
            }
          />

        )}


        <div className="note">
          Educational pseudo-assembly:
          MOV, ADD, SUB, MUL, DIV, MOD, CMP
          and conditional jumps.
        </div>

      </section>


      {/* =================================================
          PROGRAM OUTPUT / EXECUTION
      ================================================= */}

      <section className="panel">

        <div className="panel-title">

          <span>
            Program Output / Execution
          </span>

          <span className="count">
            Simulation
          </span>

        </div>


        {data?.execution ? (

          <>

            <Table>

              <thead>

                <tr>
                  <th>Variable</th>
                  <th>Value</th>
                </tr>

              </thead>


              <tbody>

                {Object.entries(
                  data.execution.variables
                ).map(
                  ([key, value]) => (
                    <tr key={key}>

                      <td className="code">
                        {key}
                      </td>

                      <td>
                        {String(value)}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </Table>


            {data.execution.output
              ?.length ? (

              <div className="output-box">

                <b>
                  Expression Result
                </b>

                <div>

                  {data.execution.output.map(
                    (value, index) => (
                      <code key={index}>
                        {String(value)}
                      </code>
                    )
                  )}

                </div>

              </div>

            ) : null}

          </>

        ) : (

          <Empty
            text={
              data?.execution_error ||
              "Execution output appears after successful compilation."
            }
          />

        )}

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>
        Mini C Compiler • Assignment-II aligned •
        Six compiler phases + execution simulation
      </footer>

    </main>
  );
}


/* =========================================================
   CODE LIST COMPONENT
========================================================= */

function CodeList({ items = [] }) {
  return (
    <div className="code-list">

      {items.map((item) => (

        <div
          className="code-row"
          key={item.index}
        >

          <span>
            {item.index}
          </span>

          <code>
            {item.code}
          </code>

          <small>
            {item.operation}
          </small>

        </div>

      ))}

    </div>
  );
}


/* =========================================================
   EMPTY COMPONENT
========================================================= */

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}


/* =========================================================
   REACT ROOT
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <App />
);