import React from "react";

import Table from "./Table";
import Empty from "./Empty";

function LexicalAnalysis({ tokens = [] }) {
  return (
    <section className="panel">

      <div className="panel-title">

        <span>
          1. Lexical Analysis — Token Stream
        </span>

        <span className="count">
          {tokens.length} tokens
        </span>

      </div>


      {tokens.length ? (

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

            {tokens.map((token, index) => (
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
            ))}

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
  );
}

export default LexicalAnalysis;
