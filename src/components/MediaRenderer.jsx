//MediaRenderer.jsx

import React from "react";

const MediaRenderer = ({ media }) => {
  const ext = media.src.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
    return <img src={`file://${media.src}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }

  if (ext === "mp4") {
    return (
      <video
        src={`file://${media.src}`}
        style={{ width: "100%", height: "100%" }}
        controls
        autoPlay
        muted
        loop
      />
    );
  }

  return <div>Unsupported media</div>;
};

export default MediaRenderer;
