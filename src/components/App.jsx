//App.jsx
import React, { useState } from "react";
import Toolbar from "./Toolbar";
import MediaWindow from "./MediaWindow";

const fs = window.require("fs");
const path = window.require("path");

const App = () => {
  const [mediaWindows, setMediaWindows] = useState([]);
  const [layoutName, setLayoutName] = useState("");
  const [pathStack, setPathStack] = useState([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapSpacing, setSnapSpacing] = useState(50);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [uniformWidth, setUniformWidth] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  const clearAllMedia = () => setMediaWindows([]);

  const removeWindow = (index) =>
    setMediaWindows((prev) => prev.filter((_, i) => i !== index));


  const addMedia = (media) => setMediaWindows((prev) => [...prev, media]);


  const updateWindow = (index, newProps) => {
    setMediaWindows((prev) =>
      prev.map((win, i) => (i === index ? { ...win, ...newProps } : win))
    );
  };


  const moveSelectedVertically = (offset) => {
    setMediaWindows(prev =>
      prev.map((win, i) =>
        selectedIndexes.includes(i)
          ? { ...win, y: win.y + offset }
          : win
      )
  ) ;
  };

  const handleLayoutUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setMediaWindows(json.windows || []);
      } catch (err) {
        console.error("Failed to parse layout JSON:", err);
      }
    };
    reader.readAsText(file);
  };


  const fitAndScaleRow = (spacing) => {
    if (selectedIndexes.length < 2) return;

    const selectedItems = selectedIndexes.map(i => mediaWindows[i]);
    const canvasWidth = document.querySelector("div[style*='overflow: auto']").clientWidth;

    const startX = mediaWindows[selectedIndexes[0]].x;
    const targetY = mediaWindows[selectedIndexes[0]].y;
    let currentX = startX;

    const numItems = selectedItems.length;
    const totalSpacing = spacing * (numItems - 1); // spacing only between items
    const availableWidth = canvasWidth - startX - spacing; // leave spacing on right

    if (!uniformWidth) { // sameScale mode
      const totalWidth = selectedItems.reduce((sum, item) => sum + item.width, 0);
      const scale = (availableWidth - totalSpacing) / totalWidth;

      selectedIndexes.forEach((index, i) => {
        const item = mediaWindows[index];
        const newWidth = item.width * scale;
        const newHeight = item.height * scale;
        updateWindow(index, { width: newWidth, height: newHeight, x: currentX, y: targetY });
        if (i < numItems - 1) currentX += newWidth + spacing; // only between items
      });

    } else { // uniformWidth mode
      const targetWidth = (availableWidth - totalSpacing) / numItems;

      selectedIndexes.forEach((index, i) => {
        const item = mediaWindows[index];
        const scale = targetWidth / item.width;
        const newWidth = item.width * scale;
        const newHeight = item.height * scale;
        updateWindow(index, { width: newWidth, height: newHeight, x: currentX, y: targetY });
        if (i < numItems - 1) currentX += newWidth + spacing;
      });
    }

    setSelectedIndexes([]);
  };


  const clearSelected = () => setSelectedIndexes([]);

  const selectAll = () => {
    setSelectedIndexes(mediaWindows.map((_, i) => i));
  };


  const handleSaveLayout = () => {
    if (!layoutName) {
      alert("Please enter a layout name!");
      return;
    }

    const layoutData = { layoutName, windows: mediaWindows };
    const projectLayoutsPath = path.join(
      process.cwd(),
      "src",
      "layouts",
      ...pathStack
    );
    const layoutFilePath = path.join(projectLayoutsPath, `${layoutName}.json`);
    const indexFilePath = path.join(process.cwd(), "src", "layouts", "index.json");

    fs.mkdir(projectLayoutsPath, { recursive: true }, (err) => {
      if (err) return console.error("Failed to create folder:", err);

      fs.writeFile(layoutFilePath, JSON.stringify(layoutData, null, 2), (err) => {
        if (err) return console.error("Failed to save layout:", err);

        fs.readFile(indexFilePath, "utf8", (err, data) => {
          if (err) return console.error("Failed to read index.json:", err);

          let indexObj = {};
          try {
            indexObj = JSON.parse(data);
          } catch {
            console.warn("index.json invalid, starting fresh");
          }

          let node = indexObj;
          pathStack.forEach((folder) => {
            if (!node[folder]) node[folder] = {};
            node = node[folder];
          });

          const fileName = `${layoutName}.json`;
          if (!node[fileName]) node[fileName] = null;

          fs.writeFile(indexFilePath, JSON.stringify(indexObj, null, 2), (err) => {
            if (err) return console.error("Failed to update index.json:", err);
            alert(`Layout saved in ${pathStack.join("/")} as ${fileName}`);
            setLayoutName("");
          });
        });
      });
    });
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: "8px", padding: "8px", backgroundColor: "#ccc", alignItems: "center" }}>
        <Toolbar
          onLoadLayout={setMediaWindows}
          onAddMedia={addMedia}
          pathStack={pathStack}
          onNavigate={setPathStack}
          selectedIndexes={selectedIndexes}
          clearSelected={clearSelected}
          fitAndScaleRow={fitAndScaleRow}
          layoutName={layoutName}
          setLayoutName={setLayoutName}
          handleSaveLayout={handleSaveLayout}
          snapEnabled={snapEnabled}
          setSnapEnabled={setSnapEnabled}
          snapSpacing={snapSpacing}
          setSnapSpacing={setSnapSpacing}
          uniformWidth={uniformWidth}
          setUniformWidth={setUniformWidth}
          clearAllMedia={clearAllMedia}
          moveSelectedVertically={moveSelectedVertically}
          selectAll={selectAll}
        />
      </div>

      <div style={{ flex: 1, position: "relative", backgroundColor: "#eee", overflow: "auto" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height:
              mediaWindows.length > 0
                ? Math.max(...mediaWindows.map((w) => w.y + w.height)) + 200
                : "100%",
          }}
        >
          {mediaWindows.map((item, index) => (
            <MediaWindow
              key={index}
              media={item.media}
              width={item.width}
              height={item.height}
              x={item.x}
              y={item.y}
              snapEnabled={snapEnabled}
              snapSpacing={snapSpacing}
              index={index}
              mediaWindows={mediaWindows}
              isSelected={selectedIndexes.includes(index)} 
              onSelect={() => {
                setSelectedIndexes(prev =>
                  prev.includes(index)
                    ? prev.filter(i => i !== index)
                    : [...prev, index]
                );
              }}
              onDragStop={(x, y) => updateWindow(index, { x, y })}
              onResizeStop={(width, height, x, y) =>
                updateWindow(index, { width, height, x, y })
              }
              onDelete={() => {
                removeWindow(index);
                setSelectedIndexes(prev =>
                  prev
                    .filter(i => i !== index)
                    .map(i => (i > index ? i - 1 : i))
                );
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
