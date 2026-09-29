import React from "react";

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

export default CodeList;
