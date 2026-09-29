import React from "react";

import CodeList from "./CodeList";
import Empty from "./Empty";

function CodeGeneration({ codeGeneration }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          6. Code Generation — Target Code
        </span>

        <span className="count">
          {codeGeneration?.instruction_count || 0}{" "}
          instructions
        </span>

      </div>


      {codeGeneration ? (

        <CodeList
          items={codeGeneration.instructions}
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
  );
}

export default CodeGeneration;
