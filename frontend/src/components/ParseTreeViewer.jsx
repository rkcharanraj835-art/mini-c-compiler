import React, { useEffect, useMemo, useRef, useState } from "react";

const NODE_H = 44;
const LEVEL_GAP = 82;
const SIBLING_GAP = 34;
const PADDING = 60;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;

function labelOf(node) {
  if (!node) return "";
  const name = String(node.name ?? "");
  const value = node.value !== null && node.value !== undefined ? String(node.value) : "";
  if (value && value !== name) return `${name}: ${value}`;
  return name;
}

function nodeWidth(node) {
  const text = labelOf(node);
  return Math.max(82, Math.min(190, 34 + text.length * 7.1));
}

function layoutTree(root) {
  let nextLeaf = 0;
  let maxDepth = 0;

  function measure(node, depth = 0) {
    maxDepth = Math.max(maxDepth, depth);
    const own = nodeWidth(node);
    if (!node.children?.length) {
      return { node, width: own, depth, children: [] };
    }

    const children = node.children.map((child) => measure(child, depth + 1));
    const childrenWidth = children.reduce((sum, child) => sum + child.width, 0)
      + SIBLING_GAP * Math.max(0, children.length - 1);

    return {
      node,
      width: Math.max(own, childrenWidth),
      depth,
      children,
    };
  }

  const measured = measure(root);
  const nodes = [];
  const edges = [];

  function place(item, left) {
    const center = left + item.width / 2;
    const y = PADDING + item.depth * LEVEL_GAP;
    nodes.push({
      id: `${nodes.length}`,
      node: item.node,
      x: center,
      y,
      width: nodeWidth(item.node),
      height: NODE_H,
      depth: item.depth,
    });

    if (!item.children.length) {
      nextLeaf += 1;
      return;
    }

    const childrenTotal = item.children.reduce((sum, child) => sum + child.width, 0)
      + SIBLING_GAP * Math.max(0, item.children.length - 1);
    let childLeft = center - childrenTotal / 2;

    for (const child of item.children) {
      place(child, childLeft);
      const childNode = nodes[nodes.length - countNodes(child)];
      childLeft += child.width + SIBLING_GAP;
    }

    const parent = nodes.find((entry) => entry.x === center && entry.y === y && entry.node === item.node);
    // Edges are reconstructed from the coordinates below, which avoids relying
    // on array positions when a subtree is large.
    const childEntries = nodes.filter((entry) => entry.depth === item.depth + 1);
    const directChildren = childEntries.filter((entry) => isDirectChild(entry.node, item.node));
    for (const childEntry of directChildren) {
      edges.push({ from: { x: center, y: y + NODE_H / 2 }, to: { x: childEntry.x, y: childEntry.y - NODE_H / 2 } });
    }
  }

  // A second, explicit placement pass makes parent/child relationships reliable.
  nodes.length = 0;
  edges.length = 0;
  function placeClean(item, left, parentEntry = null) {
    const center = left + item.width / 2;
    const y = PADDING + item.depth * LEVEL_GAP;
    const entry = {
      id: `${nodes.length}`,
      node: item.node,
      x: center,
      y,
      width: nodeWidth(item.node),
      height: NODE_H,
      depth: item.depth,
    };
    nodes.push(entry);

    if (parentEntry) {
      edges.push({
        from: { x: parentEntry.x, y: parentEntry.y + NODE_H / 2 },
        to: { x: entry.x, y: entry.y - NODE_H / 2 },
      });
    }

    if (!item.children.length) return;

    const childrenTotal = item.children.reduce((sum, child) => sum + child.width, 0)
      + SIBLING_GAP * Math.max(0, item.children.length - 1);
    let childLeft = center - childrenTotal / 2;
    for (const child of item.children) {
      placeClean(child, childLeft, entry);
      childLeft += child.width + SIBLING_GAP;
    }
  }

  placeClean(measured, PADDING, null);

  const maxX = Math.max(...nodes.map((n) => n.x + n.width / 2), PADDING * 2);
  const width = maxX + PADDING;
  const height = PADDING * 2 + maxDepth * LEVEL_GAP + NODE_H;

  return { nodes, edges, width, height };
}

function countNodes(item) {
  return 1 + (item.children || []).reduce((sum, child) => sum + countNodes(child), 0);
}

function isDirectChild(candidate, parent) {
  return Boolean(candidate && parent && parent.children?.some((child) => child === candidate));
}

function ParseTreeViewer({ tree }) {
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const layout = useMemo(() => (tree ? layoutTree(tree) : null), [tree]);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelected(null);
  }, [tree]);

  function clampOffset(nextZoom, nextOffset) {
    const viewport = viewportRef.current;
    if (!viewport || !layout) return nextOffset;
    const rect = viewport.getBoundingClientRect();
    const scaledW = layout.width * nextZoom;
    const scaledH = layout.height * nextZoom;
    const margin = 120;
    const maxX = Math.max(margin, scaledW - rect.width + margin);
    const maxY = Math.max(margin, scaledH - rect.height + margin);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  }

  function changeZoom(delta) {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    setZoom(next);
    setOffset((current) => clampOffset(next, current));
  }

  function resetView() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function fitTree() {
    const viewport = viewportRef.current;
    if (!viewport || !layout) return;
    const rect = viewport.getBoundingClientRect();
    const horizontal = (rect.width - 40) / layout.width;
    const vertical = (rect.height - 40) / layout.height;
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(horizontal, vertical)));
    setZoom(next);
    setOffset({ x: 0, y: 0 });
  }

  function onWheel(event) {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.1 : -0.1);
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clampOffset(zoom, {
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
    setOffset(next);
  }

  function onPointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  if (!layout) return null;

  return (
    <div className="parse-tree-shell">
      <div className="parse-tree-toolbar">
        <div className="tree-legend">
          <span><i className="legend-node nonterminal" /> Non-terminal</span>
          <span><i className="legend-node terminal" /> Terminal</span>
        </div>
        <div className="tree-controls">
          <button onClick={() => changeZoom(-0.15)} aria-label="Zoom out">−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => changeZoom(0.15)} aria-label="Zoom in">+</button>
          <button onClick={fitTree}>Fit</button>
          <button onClick={resetView}>Reset</button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="parse-tree-viewport"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Drag to pan • Mouse wheel to zoom"
      >
        <svg
          className="parse-tree-svg"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <defs>
            <marker id="tree-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="#62507e" />
            </marker>
          </defs>

          <g className="tree-edges">
            {layout.edges.map((edge, index) => (
              <path
                key={index}
                d={`M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${edge.from.y + 26}, ${edge.to.x} ${edge.to.y - 26}, ${edge.to.x} ${edge.to.y}`}
                markerEnd="url(#tree-arrow)"
              />
            ))}
          </g>

          <g className="tree-nodes">
            {layout.nodes.map((item) => {
              const terminal = Boolean(item.node.terminal);
              const selectedNode = selected === item.id;
              const x = item.x - item.width / 2;
              const y = item.y - item.height / 2;
              const value = item.node.value !== null && item.node.value !== undefined
                ? String(item.node.value)
                : "";
              const name = String(item.node.name ?? "");
              return (
                <g
                  key={item.id}
                  className={`tree-svg-node ${terminal ? "terminal-node" : "nonterminal-node"} ${selectedNode ? "selected" : ""}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelected(selectedNode ? null : item.id);
                  }}
                >
                  <rect x={x} y={y} width={item.width} height={item.height} rx={terminal ? 22 : 9} />
                  <text x={item.x} y={value && value !== name ? item.y - 4 : item.y + 5} textAnchor="middle" className="tree-node-name">
                    {name}
                  </text>
                  {value && value !== name ? (
                    <text x={item.x} y={item.y + 13} textAnchor="middle" className="tree-node-value">
                      {value.length > 22 ? `${value.slice(0, 21)}…` : value}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="parse-tree-help">
        <span>Drag to pan</span>
        <span>Scroll to zoom</span>
        <span>Click a node to highlight it</span>
        {selected !== null ? <span className="selected-help">Node selected</span> : null}
      </div>
    </div>
  );
}

export default ParseTreeViewer;
