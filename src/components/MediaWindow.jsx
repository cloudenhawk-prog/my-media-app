// MediaWindow.jsx

import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import MediaRenderer from "./MediaRenderer";

const MediaWindow = ({
  media,
  width = 300,
  height = 200,
  x = 50,
  y = 50,
  onDragStop,
  onResizeStop,
  onDelete,
  snapEnabled = false,
  snapSpacing = 50,
  isSelected = false,
  onSelect,
  mediaWindows = [],
  index
}) => {
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });

  const [editingPos, setEditingPos] = useState(false);
  const [posInput, setPosInput] = useState({ x: position.x, y: position.y });

  const [scaling, setScaling] = useState(false);
  const [scaleInput, setScaleInput] = useState("1.0");

  const [editingSize, setEditingSize] = useState(false);
  const [sizeInput, setSizeInput] = useState({ width: size.width, height: size.height });

  const [lastDragPos, setLastDragPos] = useState({ x, y });

  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setPosition({ x, y });
    setSize({ width, height });
  }, [x, y, width, height]);

  const ext = media.src.split(".").pop().toLowerCase();

  const snap = (value) => Math.round(value / snapSpacing) * snapSpacing;

  const applyScale = () => {
    const factor = parseFloat(scaleInput);
    if (!isNaN(factor) && factor > 0) {
      const newWidth = size.width * factor;
      const newHeight = size.height * factor;
      setSize({ width: newWidth, height: newHeight });
      onResizeStop?.(newWidth, newHeight, position.x, position.y);
    }
    setScaling(false);
  };

  const applyPosition = () => {
    let newX = parseFloat(posInput.x);
    let newY = parseFloat(posInput.y);
    if (!isNaN(newX) && !isNaN(newY)) {
      setPosition({ x: newX, y: newY });
      onDragStop?.(newX, newY);
    }
    setEditingPos(false);
  };

  const applySize = () => {
    let newW = parseFloat(sizeInput.width);
    let newH = parseFloat(sizeInput.height);
    if (!isNaN(newW) && !isNaN(newH) && newW > 0 && newH > 0) {
      setSize({ width: newW, height: newH });
      onResizeStop?.(newW, newH, position.x, position.y);
    }
    setEditingSize(false);
  };


  const snapToNeighbors = (x, y) => {
    if (!snapEnabled) return { x, y };
  
    const margin = snapSpacing;
    let snapX = x;
    let snapY = y;

    mediaWindows.forEach((other, i) => {
      if (i === index) return; // skip self

      // Horizontal snapping
      const leftDist = x - (other.x + other.width + margin);
      const rightDist = (other.x - margin) - (x + size.width);
      if (Math.abs(leftDist) < 5) snapX = other.x + other.width + margin;
      if (Math.abs(rightDist) < 5) snapX = other.x - size.width - margin;

      // Vertical snapping
      const topDist = y - (other.y + other.height + margin);
      const bottomDist = (other.y - margin) - (y + size.height);
      if (Math.abs(topDist) < 5) snapY = other.y + other.height + margin;
      if (Math.abs(bottomDist) < 5) snapY = other.y - size.height - margin;
    });

    return { x: snapX, y: snapY };
  };



  return (
    <>
    <Rnd
      size={size}
      position={position}
      minWidth={50}
      minHeight={50}
      bounds="parent"
      onDragStop={(e, d) => {
        const { x: newX, y: newY } = d;

        // Only snap if the user actually dragged
        if (snapEnabled && (newX !== lastDragPos.x || newY !== lastDragPos.y)) {
          const snappedX = Math.round(newX / snapSpacing) * snapSpacing;
          const snappedY = Math.round(newY / snapSpacing) * snapSpacing;
          setPosition({ x: snappedX, y: snappedY });
          onDragStop?.(snappedX, snappedY);
          setLastDragPos({ x: snappedX, y: snappedY });
        } else {
          setPosition({ x: newX, y: newY });
          onDragStop?.(newX, newY);
          setLastDragPos({ x: newX, y: newY });
        }
      }}

      onResizeStop={(e, direction, ref, delta, newPos) => {
        const newW = ref.offsetWidth; 
        const newH = ref.offsetHeight; 
        let newX = newPos.x;
        let newY = newPos.y;

        // Only snap position, not size
        if (snapEnabled) {
          newX = snap(newX); 
          newY = snap(newY);
        }

  setSize({ width: newW, height: newH });
  setPosition({ x: newX, y: newY });
  onResizeStop?.(newW, newH, newX, newY);
}}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          border: isSelected ? "1px solid #e91f1fff" : "1px solid black",
          backgroundColor: "#f8e71c",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={(e) => {
          if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;
          onSelect?.();
        }}
      >
        <MediaRenderer media={media} />
        
        {/* Expand button (bottom-right) */}
        {["jpg","jpeg","png","gif"].includes(ext) && (
          <button
            onClick={() => setFullscreen(true)}
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 18,
              height: 18,
              border: "none",
              background: "transparent",
              color: "#333",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
              lineHeight: "14px",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "orange")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
          >
            ⤢
          </button>
        )}

        {/* Delete button (top-right) */}
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 18,
              height: 18,
              border: "none",
              background: "transparent",
              color: "#333",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
              lineHeight: "14px",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "red")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
          >
            ×
          </button>
        )}

        {/* Scale button (top-left) */}
        <button
          onClick={() => setScaling(true)}
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 18,
            height: 18,
            border: "none",
            background: "transparent",
            color: "#333",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
            lineHeight: "14px",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "blue")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
        >
          ⇱
        </button>

        {scaling && (
          <input
            type="number"
            step="0.01"
            value={scaleInput}
            onChange={(e) => setScaleInput(e.target.value)}
            onBlur={applyScale}
            onKeyDown={(e) => e.key === "Enter" && applyScale()}
            style={{
              position: "absolute",
              top: 2,
              left: 22,
              width: 50,
              fontSize: 12,
            }}
          />
        )}

        {/* Position button (top-middle) */}
        <button
          onClick={() => {
            setEditingPos(true);
            setPosInput({ x: position.x, y: position.y });
          }}
          style={{
            position: "absolute",
            top: 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: 18,
            height: 18,
            border: "none",
            background: "transparent",
            color: "#333",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
            lineHeight: "14px",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "green")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
        >
          ⊕
        </button>

        {editingPos && (
          <div
            style={{
              position: "absolute",
              top: 22,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "4px",
              background: "white",
              padding: "2px",
              border: "1px solid #ccc",
            }}
          >
            <input
              type="number"
              value={posInput.x}
              onChange={(e) => setPosInput({ ...posInput, x: e.target.value })}
              style={{ width: 40, fontSize: 12 }}
            />
            <input
              type="number"
              value={posInput.y}
              onChange={(e) => setPosInput({ ...posInput, y: e.target.value })}
              style={{ width: 40, fontSize: 12 }}
            />
            <button onClick={applyPosition} style={{ fontSize: 12 }}>✔</button>
          </div>
        )}

        {/* Size button (bottom-left) */}
        <button
          onClick={() => {
            setEditingSize(true);
            setSizeInput({ width: size.width, height: size.height });
          }}
          style={{
            position: "absolute",
            bottom: 2,
            left: 2,
            width: 18,
            height: 18,
            border: "none",
            background: "transparent",
            color: "#333",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
            lineHeight: "14px",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "purple")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
        >
          ▭
        </button>

        {editingSize && (
          <div
            style={{
              position: "absolute",
              bottom: 22,
              left: 2,
              display: "flex",
              gap: "4px",
              background: "white",
              padding: "2px",
              border: "1px solid #ccc",
            }}
          >
            <input
              type="number"
              value={sizeInput.width}
              onChange={(e) => setSizeInput({ ...sizeInput, width: e.target.value })}
              style={{ width: 50, fontSize: 12 }}
            />
            <input
              type="number"
              value={sizeInput.height}
              onChange={(e) => setSizeInput({ ...sizeInput, height: e.target.value })}
              style={{ width: 50, fontSize: 12 }}
            />
            <button onClick={applySize} style={{ fontSize: 12 }}>✔</button>
          </div>
        )}
      </div>
    </Rnd>

    {/* Fullscreen overlay */}
    {fullscreen && (
      <div
        onClick={() => setFullscreen(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.9)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          cursor: "zoom-out",
        }}
      >
        <img src={`file://${media.src}`} style={{ maxWidth: "95%", maxHeight: "95%" }} />
      </div>
    )}
  </>
  );
};

export default MediaWindow;
