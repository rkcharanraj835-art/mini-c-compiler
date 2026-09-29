import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

import ParseTreeViewer from "./components/ParseTreeViewer";
import LexicalAnalysis from "./components/LexicalAnalysis";
import SemanticAnalysis from "./components/SemanticAnalysis";
import IntermediateCode from "./components/IntermediateCode";
import CodeOptimization from "./components/CodeOptimization";
import CodeGeneration from "./components/CodeGeneration";
import ProgramExecution from "./components/ProgramExecution";
import Footer from "./components/Footer";
import Empty from "./components/Empty";


/* =========================================================
   SAMPLE PROGRAMS
========================================================= */
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

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
      const response = await fetch(`${API_URL}/api/compile`, {
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
            Mini C Compiler
          </h1>

          <p>
            Flow of program in the 
            Six-phases of compiler.
          </p>
        </div>

        <span className="version">
          V1.0
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

      <LexicalAnalysis
        tokens={data?.tokens || []}
      />


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

      <SemanticAnalysis
        semantic={data?.semantic}
      />


      {/* =================================================
          4. INTERMEDIATE CODE
      ================================================= */}

      <IntermediateCode
        intermediate={data?.intermediate}
      />


      {/* =================================================
          5. CODE OPTIMIZATION
      ================================================= */}

      <CodeOptimization
        optimization={data?.optimization}
      />


      {/* =================================================
          6. CODE GENERATION
      ================================================= */}

      <CodeGeneration
        codeGeneration={data?.code_generation}
      />


      {/* =================================================
          PROGRAM OUTPUT / EXECUTION
      ================================================= */}

      <ProgramExecution
        execution={data?.execution}
        executionError={data?.execution_error}
      />


      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />

    </main>
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