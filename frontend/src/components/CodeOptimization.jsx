import React from "react";

import CodeList from "./CodeList";
import Empty from "./Empty";

function CodeOptimization({ optimization }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          5. Code Optimization
        </span>

        <span className="count">
          {optimization?.optimization_count || 0}{" "}
          optimizations
        </span>

      </div>


      {optimization ? (

        <>

          <CodeList
            items={optimization.instructions}
          />


          {optimization.optimizations?.length ? (

            <div className="details">

              {optimization.optimizations.map(
                (item, index) => (

                  <div
                    className="opt"
                    key={index}
                  >

                    <b>
                      {item.type}
                    </b>

                    <code>
                      {item.original}
                    </code>

                    <span>
                      →
                    </span>

                    <code>
                      {item.optimized}
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
  );
}

export default CodeOptimization;
