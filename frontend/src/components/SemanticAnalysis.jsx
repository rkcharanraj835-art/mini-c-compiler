import React from "react";

import Table from "./Table";
import Empty from "./Empty";

function SemanticAnalysis({ semantic }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          3. Semantic Analysis — Symbol Table
        </span>

        <span className="count">
          {semantic?.symbols?.length || 0}{" "}
          symbols
        </span>

      </div>


      {semantic ? (

        <>

          <div
            className={`inline-result ${
              semantic.success
                ? "ok"
                : "warn"
            }`}
          >
            {semantic.success
              ? "Semantic analysis completed ✓"
              : semantic.errors?.join(" • ")}
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

              {semantic.symbols.map((symbol) => (
                <tr key={symbol.name}>

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
                    {symbol.value === null ||
                    symbol.value === undefined
                      ? "—"
                      : String(symbol.value)}
                  </td>

                </tr>
              ))}

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
  );
}

export default SemanticAnalysis;
