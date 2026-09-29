import React from "react";

function Table({ children }) {
  return (
    <div className="table-wrap">
      <table>
        {children}
      </table>
    </div>
  );
}

export default Table;
