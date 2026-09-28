import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const NODE_RADIUS = 26;
const HORIZONTAL_GAP = 95;
const VERTICAL_GAP = 100;
const TREE_PADDING = 60;

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 2.5;

const BUTTON_FACTOR = 1.2;
const WHEEL_FACTOR = 1.1;

const VISIBLE_MARGIN = 80;
const FIT_PADDING = 24;

/* ---------------------------------------------------------
   TREE LAYOUT
--------------------------------------------------------- */

function calculateTreeLayout(tree) {
  if (!tree) {
    return {
      nodes: [],
      edges: [],
      width: 800,
      height: 500,
    };
  }

  const nodes = [];
  const edges = [];

  let nextId = 0;

  function measure(node) {
    if (!node) return 1;

    if (!node.children || node.children.length === 0) {
      return 1;
    }

    return node.children.reduce(
      (total, child) => total + measure(child),
      0
    );
  }

  function walk(node, depth, left, parentId = null) {
    if (!node) return null;

    const id = nextId++;

    const subtreeWidth = measure(node);

    const centerX =
      left +
      (subtreeWidth * HORIZONTAL_GAP) / 2;

    const y =
      TREE_PADDING +
      depth * VERTICAL_GAP;

    const currentNode = {
      id,
      node,
      x: centerX,
      y,
      depth,
    };

    nodes.push(currentNode);

    if (parentId !== null) {
      edges.push({
        from: parentId,
        to: id,
      });
    }

    if (node.children && node.children.length > 0) {
      let childLeft = left;

      node.children.forEach((child) => {
        const childWidth = measure(child);

        walk(
          child,
          depth + 1,
          childLeft,
          id
        );

        childLeft +=
          childWidth * HORIZONTAL_GAP;
      });
    }

    return currentNode;
  }

  walk(tree, 0, 0);

  const maxX =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.x))
      : 0;

  const maxY =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.y))
      : 0;

  return {
    nodes,
    edges,
    width: Math.max(
      800,
      maxX + TREE_PADDING + 150
    ),
    height: Math.max(
      500,
      maxY + TREE_PADDING + 100
    ),
  };
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function constrain(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */

export default function ParseTree({ data }) {
  const viewportRef = useRef(null);

  const [view, setView] = useState({
    zoom: 1,
    x: 0,
    y: 0,
  });

  const [selectedNode, setSelectedNode] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  /* -------------------------------------------------------
     TREE DATA
  ------------------------------------------------------- */

  const tree = useMemo(() => {
    if (!data) return null;

    /*
     * Supports either:
     *
     * data
     *
     * OR
     *
     * data.parse_tree
     */

    if (data.parse_tree) {
      return data.parse_tree;
    }

    return data;
  }, [data]);

  const layout = useMemo(
    () => calculateTreeLayout(tree),
    [tree]
  );

  const {
    nodes,
    edges,
    width,
    height,
  } = layout;

  /* -------------------------------------------------------
     FIT TREE
  ------------------------------------------------------- */

  const computeFit = useCallback(() => {
    const viewport =
      viewportRef.current;

    if (!viewport || !nodes.length) {
      return {
        zoom: 1,
        x: 0,
        y: 0,
      };
    }

    const rect =
      viewport.getBoundingClientRect();

    const availableWidth =
      Math.max(
        100,
        rect.width - FIT_PADDING * 2
      );

    const availableHeight =
      Math.max(
        100,
        rect.height - FIT_PADDING * 2
      );

    const zoomX =
      availableWidth / width;

    const zoomY =
      availableHeight / height;

    const zoom = constrain(
      Math.min(zoomX, zoomY),
      MIN_ZOOM,
      MAX_ZOOM
    );

    const scaledWidth =
      width * zoom;

    const scaledHeight =
      height * zoom;

    return {
      zoom,
      x:
        (rect.width - scaledWidth) / 2,
      y:
        (rect.height - scaledHeight) / 2,
    };
  }, [nodes.length, width, height]);

  const fitToView = useCallback(() => {
    setView(computeFit());
  }, [computeFit]);

  /* -------------------------------------------------------
     AUTO FIT
  ------------------------------------------------------- */

  useLayoutEffect(() => {
    if (!nodes.length) return;

    const timer = setTimeout(() => {
      setView(computeFit());
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [
    nodes.length,
    width,
    height,
    computeFit,
  ]);

  /* -------------------------------------------------------
     ZOOM AROUND MOUSE POSITION
  ------------------------------------------------------- */

  const zoomAt = useCallback(
    (factor, mouseX, mouseY) => {
      setView((current) => {
        const nextZoom = constrain(
          current.zoom * factor,
          MIN_ZOOM,
          MAX_ZOOM
        );

        if (
          Math.abs(
            nextZoom - current.zoom
          ) < 0.0001
        ) {
          return current;
        }

        const scale =
          nextZoom / current.zoom;

        return {
          zoom: nextZoom,

          x:
            mouseX -
            (mouseX - current.x) *
              scale,

          y:
            mouseY -
            (mouseY - current.y) *
              scale,
        };
      });
    },
    []
  );

  /* -------------------------------------------------------
     WHEEL ZOOM
     
     IMPORTANT:
     This listener is attached directly to the viewport
     AND runs during capture phase.

     preventDefault() prevents the browser page itself
     from scrolling while the cursor is inside the tree.
  ------------------------------------------------------- */

  useEffect(() => {
    const viewport =
      viewportRef.current;

    if (!viewport) return;

    const handleWheel = (event) => {
      if (
        !viewport.contains(
          event.target
        )
      ) {
        return;
      }

      /*
       * CRITICAL:
       * Prevent normal browser/page scrolling.
       */
      event.preventDefault();
      event.stopPropagation();

      const rect =
        viewport.getBoundingClientRect();

      const mouseX =
        event.clientX - rect.left;

      const mouseY =
        event.clientY - rect.top;

      const factor =
        event.deltaY < 0
          ? WHEEL_FACTOR
          : 1 / WHEEL_FACTOR;

      zoomAt(
        factor,
        mouseX,
        mouseY
      );
    };

    viewport.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
        capture: true,
      }
    );

    return () => {
      viewport.removeEventListener(
        "wheel",
        handleWheel,
        {
          capture: true,
        }
      );
    };
  }, [zoomAt]);

  /* -------------------------------------------------------
     GLOBAL WHEEL SAFETY

     This catches the wheel event at the window capture
     phase and blocks PAGE SCROLLING only when the cursor
     is inside the parse-tree viewport.
  ------------------------------------------------------- */

  useEffect(() => {
    const blockPageScroll = (
      event
    ) => {
      const viewport =
        viewportRef.current;

      if (!viewport) return;

      if (
        !viewport.contains(
          event.target
        )
      ) {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener(
      "wheel",
      blockPageScroll,
      {
        passive: false,
        capture: true,
      }
    );

    return () => {
      window.removeEventListener(
        "wheel",
        blockPageScroll,
        {
          capture: true,
        }
      );
    };
  }, []);

  /* -------------------------------------------------------
     EXTRA OVERSCROLL PROTECTION
  ------------------------------------------------------- */

  useEffect(() => {
    const viewport =
      viewportRef.current;

    if (!viewport) return;

    viewport.style.overscrollBehavior =
      "none";

    viewport.style.overscrollBehaviorX =
      "none";

    viewport.style.overscrollBehaviorY =
      "none";

    viewport.style.touchAction =
      "none";

    viewport.style.overflow =
      "hidden";

    return () => {
      if (!viewport) return;

      viewport.style.overscrollBehavior =
        "";

      viewport.style.overscrollBehaviorX =
        "";

      viewport.style.overscrollBehaviorY =
        "";

      viewport.style.touchAction =
        "";

      viewport.style.overflow =
        "";
    };
  }, []);

  /* -------------------------------------------------------
     POINTER DOWN
  ------------------------------------------------------- */

  const handlePointerDown = (
    event
  ) => {
    /*
     * Only primary mouse button.
     */
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    const viewport =
      viewportRef.current;

    if (!viewport) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };

    setIsDragging(true);

    try {
      viewport.setPointerCapture(
        event.pointerId
      );
    } catch {
      // Ignore pointer capture errors.
    }
  };

  /* -------------------------------------------------------
     POINTER MOVE
  ------------------------------------------------------- */

  const handlePointerMove = (
    event
  ) => {
    const drag =
      dragRef.current;

    if (
      !drag.active ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const dx =
      event.clientX -
      drag.startX;

    const dy =
      event.clientY -
      drag.startY;

    setView((current) => ({
      ...current,
      x: drag.originX + dx,
      y: drag.originY + dy,
    }));
  };

  /* -------------------------------------------------------
     POINTER UP
  ------------------------------------------------------- */

  const stopDragging = (event) => {
    const drag =
      dragRef.current;

    if (
      drag.pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
    };

    setIsDragging(false);

    const viewport =
      viewportRef.current;

    if (viewport) {
      try {
        viewport.releasePointerCapture(
          event.pointerId
        );
      } catch {
        // Ignore pointer capture errors.
      }
    }
  };

  /* -------------------------------------------------------
     ZOOM BUTTONS
  ------------------------------------------------------- */

  const zoomIn = () => {
    const viewport =
      viewportRef.current;

    if (!viewport) return;

    const rect =
      viewport.getBoundingClientRect();

    zoomAt(
      BUTTON_FACTOR,
      rect.width / 2,
      rect.height / 2
    );
  };

  const zoomOut = () => {
    const viewport =
      viewportRef.current;

    if (!viewport) return;

    const rect =
      viewport.getBoundingClientRect();

    zoomAt(
      1 / BUTTON_FACTOR,
      rect.width / 2,
      rect.height / 2
    );
  };

  /* -------------------------------------------------------
     RESET / FIT
  ------------------------------------------------------- */

  const resetView = () => {
    fitToView();
  };

  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  if (!tree) {
    return (
      <div className="panel parse-tree-shell">
        <div className="panel-title">
          <span>Syntax Analysis / Parse Tree</span>
        </div>

        <div className="empty">
          Parse tree will appear after
          successful syntax analysis.
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     NODE LOOKUP
  ------------------------------------------------------- */

  const nodeMap = new Map(
    nodes.map((node) => [
      node.id,
      node,
    ])
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="panel parse-tree-shell">
      {/* ---------------------------------------------------
          TOOLBAR
      --------------------------------------------------- */}

      <div className="parse-tree-toolbar">
        <div className="tree-legend">
          <span>
            <i className="legend-node nonterminal" />
            Non-terminal
          </span>

          <span>
            <i className="legend-node terminal" />
            Terminal
          </span>
        </div>

        <div className="tree-controls">
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom out"
          >
            −
          </button>

          <span>
            {Math.round(
              view.zoom * 100
            )}
            %
          </span>

          <button
            type="button"
            onClick={zoomIn}
            title="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={resetView}
            title="Fit tree to view"
          >
            Fit
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------
          VIEWPORT
      --------------------------------------------------- */}

      <div
        ref={viewportRef}
        className={`parse-tree-viewport ${
          isDragging
            ? "is-dragging"
            : ""
        }`}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          stopDragging
        }
        onPointerCancel={
          stopDragging
        }
        onPointerLeave={() => {
          /*
           * Do not stop dragging here.
           * Pointer capture continues the drag.
           */
        }}
        onWheelCapture={(event) => {
          /*
           * React-level backup.
           *
           * Native listener above is the primary
           * protection.
           */
          event.preventDefault();
        }}
      >
        <svg
          className="parse-tree-svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,

            transform:
              `translate(${view.x}px, ${view.y}px) ` +
              `scale(${view.zoom})`,

            transformOrigin:
              "0 0",

            pointerEvents:
              "auto",
          }}
        >
          {/* ------------------------------------------------
              EDGES
          ------------------------------------------------ */}

          <g className="tree-edges">
            {edges.map((edge, index) => {
              const parent =
                nodeMap.get(
                  edge.from
                );

              const child =
                nodeMap.get(
                  edge.to
                );

              if (
                !parent ||
                !child
              ) {
                return null;
              }

              const startX =
                parent.x;

              const startY =
                parent.y +
                NODE_RADIUS;

              const endX =
                child.x;

              const endY =
                child.y -
                NODE_RADIUS;

              const middleY =
                (startY + endY) /
                2;

              const path = `
                M ${startX} ${startY}
                C ${startX} ${middleY},
                  ${endX} ${middleY},
                  ${endX} ${endY}
              `;

              return (
                <path
                  key={`edge-${index}`}
                  d={path}
                />
              );
            })}
          </g>

          {/* ------------------------------------------------
              NODES
          ------------------------------------------------ */}

          <g>
            {nodes.map(
              (item) => {
                const node =
                  item.node;

                const nodeName =
                  node.name ??
                  node.node_type ??
                  "Node";

                const nodeValue =
                  node.value ??
                  "";

                const isTerminal =
                  Boolean(
                    node.terminal
                  );

                const isSelected =
                  selectedNode ===
                  item.id;

                const cardWidth =
                  Math.max(
                    76,
                    Math.min(
                      180,
                      Math.max(
                        String(
                          nodeName
                        ).length *
                          7 +
                          28,
                        nodeValue
                          ? String(
                              nodeValue
                            ).length *
                              6 +
                              35
                          : 76
                      )
                    )
                  );

                const cardHeight =
                  nodeValue
                    ? 58
                    : 42;

                const left =
                  item.x -
                  cardWidth / 2;

                const top =
                  item.y -
                  cardHeight / 2;

                return (
                  <g
                    key={item.id}
                    className={`
                      tree-svg-node
                      ${
                        isTerminal
                          ? "terminal-node"
                          : "nonterminal-node"
                      }
                      ${
                        isSelected
                          ? "selected"
                          : ""
                      }
                    `}
                    onClick={(event) => {
                      /*
                       * Prevent clicking a node from
                       * accidentally behaving like a
                       * drag/selection on the viewport.
                       */
                      event.stopPropagation();

                      setSelectedNode(
                        isSelected
                          ? null
                          : item.id
                      );
                    }}
                  >
                    <rect
                      x={left}
                      y={top}
                      width={
                        cardWidth
                      }
                      height={
                        cardHeight
                      }
                      rx="8"
                      ry="8"
                    />

                    <text
                      x={item.x}
                      y={
                        nodeValue
                          ? item.y - 7
                          : item.y + 4
                      }
                      textAnchor="middle"
                      className="tree-node-name"
                    >
                      {nodeName}
                    </text>

                    {nodeValue && (
                      <text
                        x={item.x}
                        y={
                          item.y + 13
                        }
                        textAnchor="middle"
                        className="tree-node-value"
                      >
                        {String(
                          nodeValue
                        )}
                      </text>
                    )}
                  </g>
                );
              }
            )}
          </g>
        </svg>
      </div>

      {/* ---------------------------------------------------
          HELP / STATUS
      --------------------------------------------------- */}

      <div className="parse-tree-help">
        <span>
          Scroll inside tree to zoom
        </span>

        <span>
          Drag to pan
        </span>

        <span>
          Click node to select
        </span>

        <span>
          Use Fit to reset view
        </span>

        {selectedNode !== null && (
          <span className="selected-help">
            Node selected
          </span>
        )}
      </div>
    </div>
  );
}