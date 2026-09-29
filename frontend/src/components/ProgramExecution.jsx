import React from "react";

import Table from "./Table";
import Empty from "./Empty";

function ProgramExecution({ execution, executionError }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          Program Output / Execution
        </span>

        <span className="count">
          Simulation
        </span>

      </div>


      {execution ? (

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
                execution.variables
              ).map(([key, value]) => (
                <tr key={key}>

                  <td className="code">
                    {key}
                  </td>

                  <td>
                    {String(value)}
                  </td>

                </tr>
              ))}

            </tbody>

          </Table>


          {execution.output?.length ? (

            <div className="output-box">

              <b>
                Expression Result
              </b>

              <div>

                {execution.output.map(
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
            executionError ||
            "Execution output appears after successful compilation."
          }
        />

      )}

    </section>
  );
}

export default ProgramExecution;
