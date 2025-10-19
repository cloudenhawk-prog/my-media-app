import React, { useState } from "react";
import indexTree from "../layouts/index.json";
const { ipcRenderer } = window.require("electron");

const Toolbar = ({
  onLoadLayout,
  onAddMedia,
  pathStack,
  onNavigate,
  selectedIndexes = [],
  clearSelected,
  fitAndScaleRow,
  layoutName,
  setLayoutName,
  handleSaveLayout,
  snapEnabled,
  setSnapEnabled,
  snapSpacing,
  setSnapSpacing,
  uniformWidth,
  setUniformWidth,
  clearAllMedia,
  moveSelectedVertically,
  selectAll
}) => {
  const [moveOffset, setMoveOffset] = useState(0);

  const currentNode = pathStack.reduce(
    (node, key) => node && node[key],
    indexTree
  );

  const handleFolderClick = (folder) => onNavigate([...pathStack, folder]);
  const handleBreadcrumbClick = (index) => onNavigate(pathStack.slice(0, index + 1));
  const handleLayoutClick = (file) => {
    const relativePath = [...pathStack, file].join("/");
    import(`../layouts/${relativePath}`)
      .then((module) => {
        const json = module.default || module;
        onLoadLayout(json.windows || []);
      })
      .catch((err) => console.error("Failed to load layout:", err));
  };

  const handleImportMedia = async () => {
    try {
      const filePath = await ipcRenderer.invoke("select-media");
      if (!filePath) return;
      let width = 300, height = 200;

      const ext = filePath.split(".").pop().toLowerCase();
      if (["jpg","jpeg","png","gif"].includes(ext)) {
        const img = new Image();
        img.src = `file://${filePath}`;
        await new Promise((res) => (img.onload = res));
        width = img.naturalWidth; height = img.naturalHeight;
      } else if (ext === "mp4") {
        const video = document.createElement("video");
        video.src = `file://${filePath}`;
        await new Promise((res) => (video.onloadedmetadata = res));
        width = video.videoWidth; height = video.videoHeight;
      }

      onAddMedia({ media: { src: filePath }, width, height, x: 50, y: 50 });
    } catch (err) {
      console.error("Failed to import media:", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", backgroundColor: "#ccc", alignItems: "center", padding: "4px" }}>
      
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button onClick={() => onNavigate([])}>Root</button>
        {pathStack.map((folder, i) => (
          <React.Fragment key={i}>
            <span>›</span>
            <button onClick={() => handleBreadcrumbClick(i)}>{folder}</button>
          </React.Fragment>
        ))}
      </div>

      {/* Current folder dropdown */}
      {currentNode && (
        <select
          defaultValue=""
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            if (currentNode[val] && typeof currentNode[val] === "object") {
              handleFolderClick(val);
            } else {
              handleLayoutClick(val);
            }
            e.target.value = "";
          }}
          style={{ marginLeft: 8 }}
        >
          <option value="">Select folder/layout...</option>
          {Object.keys(currentNode).map((key) => (
            <option key={key} value={key}>
              {currentNode[key] && typeof currentNode[key] === "object" ? `📁 ${key}` : `🗂 ${key}`}
            </option>
          ))}
        </select>
      )}

      {/* Standard buttons */}
      <button onClick={handleImportMedia}>Import Media</button>
      <input
        type="text"
        placeholder="Layout name"
        value={layoutName}
        onChange={(e) => setLayoutName(e.target.value)}
        style={{ marginLeft: 8 }}
      />
      <button onClick={handleSaveLayout}>Save Layout</button>

      <label style={{ marginLeft: 16 }}>
        <input
          type="checkbox"
          checked={snapEnabled}
          onChange={(e) => setSnapEnabled(e.target.checked)}
        />
        Snap
      </label>
      <input
        type="number"
        value={snapSpacing}
        onChange={(e) => setSnapSpacing(parseInt(e.target.value) || 50)}
        style={{ width: 60, marginLeft: 4 }}
      />

      <label style={{ marginLeft: 8 }}>
        <input
          type="checkbox"
          checked={uniformWidth}
          onChange={(e) => setUniformWidth(e.target.checked)}
        />
        Uniform Width
      </label>

      <button
        onClick={() => fitAndScaleRow(snapSpacing)}
        style={{ marginLeft: 8 }}
        disabled={selectedIndexes.length < 2}
      >
        Fit & Scale Row
      </button>
      
      <button
        onClick={selectAll}
        style={{ marginLeft: 8 }}
      >
        Select All
      </button>

      <button
        onClick={clearSelected}
        style={{ marginLeft: 8 }}
        disabled={selectedIndexes.length === 0}
      >
        Clear Selection
      </button>

      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to clear all media? This cannot be undone.")) {
            clearAllMedia();
          }
        }}
      >
        Clear Page
      </button>


      {/* --- New Move All control --- */}
      <div style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number"
          value={moveOffset}
          onChange={e => setMoveOffset(parseFloat(e.target.value) || 0)}
          style={{ width: 80 }}
          placeholder="px offset"
        />
        <button onClick={() => moveSelectedVertically(moveOffset)}>
          Move All Vertically
        </button>
      </div>

    </div>
  );
};

export default Toolbar;
