import React from "react";

function LexicalAnalysis({ tokens }) {
  return (
    <section className="panel tokens-panel">

      <div className="panel-title">
        <span>
          Lexical Analysis — Token Table
        </span>

        <span className="count">
          {tokens.length} tokens
        </span>
      </div>


      {tokens.length === 0 ? (

        <div className="empty">
          Compile the program to generate tokens.
        </div>

      ) : (

        <div className="table-wrap">

          <table>

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

                <tr
                  key={`${token.line}-${token.column}-${index}`}
                >

                  <td>
                    {index + 1}
                  </td>

                  <td className="lexeme">
                    {token.lexeme}
                  </td>

                  <td>
                    <span className="token-type">
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

          </table>

        </div>

      )}

    </section>
  );
}

export default LexicalAnalysis;