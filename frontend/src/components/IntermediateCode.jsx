import React from "react";

import CodeList from "./CodeList";
import Empty from "./Empty";

function IntermediateCode({ intermediate }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          4. Intermediate Code — Three Address Code
        </span>

        <span className="count">
          {intermediate?.instructions?.length || 0}{" "}
          instructions
        </span>

      </div>


      {intermediate ? (

        <CodeList
          items={intermediate.instructions}
        />

      ) : (

        <Empty
          text={
            "TAC appears after syntax analysis."
          }
        />

      )}

    </section>
  );
}

export default IntermediateCode;
