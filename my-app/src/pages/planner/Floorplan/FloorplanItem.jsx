// src/components/FloorplanItem.jsx
import React, { useRef, useEffect, useState } from "react";
import "./FloorplanItem.css";

export default function FloorplanItem({ item, selectedId, onPointerDown }) {
  const itemRef = useRef(null);
  const [style, setStyle] = useState({});

  const isSelected = selectedId === item.id;

  // Update style whenever item or selection changes
  useEffect(() => {
    if (!item) return;

    setStyle({
      left: `${item.x}px`,
      top: `${item.y}px`,
      width: `${item.w}px`,
      height: `${item.h}px`,
      transform: `rotate(${item.rotation || 0}deg)`,
      position: "absolute",
      zIndex: isSelected ? 999 : 2,
      touchAction: "none", // prevent default touch scrolling
    });
  }, [item, isSelected]);

  // Pointer down handler for drag/select
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (onPointerDown) onPointerDown(e, item.id);
  };

  return (
    <div
      ref={itemRef}
      className={`fp-item ${item.shape || ""} ${isSelected ? "selected" : ""} ${item.type || ""}`}
      style={style}
      onPointerDown={handlePointerDown}
    >
      <span className="fp-label">{item.type.replace(/_/g, " ")}</span>
    </div>
  );
}
