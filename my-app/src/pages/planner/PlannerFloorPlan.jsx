import React, { useEffect, useRef, useState } from "react";
import { auth } from "../../firebase"; // your firebase auth
import "./PlannerFloorPlan.css";

const TEMPLATES = [
  { id: "blank", name: "Blank", color: "#ffffff" },
  { id: "banquet", name: "Banquet (rect rows)", color: "#f8fafc" },
  { id: "theatre", name: "Theatre (rows)", color: "#fbf7ff" },
  { id: "cocktail", name: "Cocktail (open)", color: "#fff8f0" },
];

const ITEM_PROTOTYPES = {
  table_small: { type: "table", w: 80, h: 80, shape: "round", color: "#eab308" },
  table_square: { type: "table", w: 80, h: 80, shape: "square", color: "#f97316" },
  table_large: { type: "table", w: 140, h: 80, shape: "rect", color: "#f97316" },
  chair: { type: "chair", w: 22, h: 22, shape: "round", color: "#60a5fa" },
  stage: { type: "stage", w: 300, h: 80, shape: "rect", color: "#6b7280" },
  light_small: { type: "light", w: 20, h: 20, shape: "round", color: "#fef08a" },
  light_medium: { type: "light", w: 30, h: 30, shape: "round", color: "#fef08a" },
  light_large: { type: "light", w: 40, h: 40, shape: "round", color: "#fef08a" },
  piano: { type: "piano", w: 120, h: 60, shape: "rect", color: "#000000" },
  dance_floor: { type: "dance_floor", w: 200, h: 200, shape: "square", color: "#d1d5db" },
  drink_bar: { type: "drink_bar", w: 150, h: 50, shape: "rect", color: "#7f1d1d" },
  cake_table: { type: "cake_table", w: 60, h: 60, shape: "square", color: "#fbcfe8" },
  head_table: { type: "head_table", w: 200, h: 60, shape: "rect", color: "#db2777" },
  walkway_carpet: { type: "walkway_carpet", w: 300, h: 40, shape: "rect", color: "#b91c1c" },
  catering_stand: { type: "catering_stand", w: 100, h: 50, shape: "rect", color: "#15803d" },
  exit_door: { type: "exit_door", w: 60, h: 30, shape: "rect", color: "#dc2626" },
};

let nextId = 1;

const PlannerFloorPlan = ({ eventId, setActivePage }) => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [items, setItems] = useState([]); // {id, type, x, y, w, h, shape, color, rotation}
  const [selectedId, setSelectedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const containerRef = useRef(null);

  // Drag state refs to avoid re-renders
  const dragRef = useRef({ 
    dragging: false, 
    id: null, 
    offsetX: 0, 
    offsetY: 0,
    pointerId: null,
    startX: 0,
    startY: 0 
  });

  // Fetch venues (unchanged)
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        const res = await fetch("/api/venues", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setVenues([
            { id: "venue1", name: "Grand Hall" },
            { id: "venue2", name: "Beach Resort" },
            { id: "venue3", name: "Conference Center" },
          ]);
          return;
        }
        const data = await res.json();
        setVenues(data.venues || []);
      } catch (err) {
        console.error("Fetch venues failed, using fallback", err);
        setVenues([
          { id: "venue1", name: "Grand Hall" },
          { id: "venue2", name: "Beach Resort" },
          { id: "venue3", name: "Conference Center" },
        ]);
      }
    };
    fetchVenues();
  }, []);

  // Add a new item (centered)
  const addItem = (key) => {
    const proto = ITEM_PROTOTYPES[key];
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newItem = {
      id: `it-${nextId++}`,
      ...proto,
      x: rect.width / 2,
      y: rect.height / 2,
      rotation: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setIsDirty(true);
  };

  // Remove selected item
  const removeSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((it) => it.id !== selectedId));
    setSelectedId(null);
    setIsDirty(true);
  };

  // Pointer handlers for drag (improved for re-selection and click detection)
  const onPointerDownItem = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    container.setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const it = items.find((i) => i.id === id);
    if (!it) return;
    
    // Always select the item on down
    setSelectedId(id);
    
    // Record start position to detect if it's a click or drag
    dragRef.current = {
      dragging: false,
      id,
      offsetX: mouseX - it.x,
      offsetY: mouseY - it.y,
      pointerId: e.pointerId,
      startX: mouseX,
      startY: mouseY,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.id || dragRef.current.pointerId !== e.pointerId) return;
    
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if movement is enough to start dragging (threshold to distinguish click from drag)
    const threshold = 5; // pixels
    if (!dragRef.current.dragging && 
        (Math.abs(mouseX - dragRef.current.startX) > threshold || 
         Math.abs(mouseY - dragRef.current.startY) > threshold)) {
      dragRef.current.dragging = true;
    }
    
    if (!dragRef.current.dragging) return;
    
    const { id, offsetX, offsetY } = dragRef.current;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              x: Math.max(
                calculateBoundingHalf(it.w, it.h, it.rotation || 0, "w"),
                Math.min(
                  rect.width - calculateBoundingHalf(it.w, it.h, it.rotation || 0, "w"),
                  mouseX - offsetX
                )
              ),
              y: Math.max(
                calculateBoundingHalf(it.w, it.h, it.rotation || 0, "h"),
                Math.min(
                  rect.height - calculateBoundingHalf(it.w, it.h, it.rotation || 0, "h"),
                  mouseY - offsetY
                )
              ),
            }
          : it
      )
    );
    setIsDirty(true);
  };

  const calculateBoundingHalf = (w, h, rotation, dim) => {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bb_w = w * cos + h * sin;
    const bb_h = w * sin + h * cos;
    return dim === "w" ? bb_w / 2 : bb_h / 2;
  };

  const onPointerUp = (e) => {
    if (dragRef.current.id && dragRef.current.pointerId === e.pointerId) {
      // If not dragged (click), we can do something if needed, but selection is already set
      dragRef.current = { 
        dragging: false, 
        id: null, 
        offsetX: 0, 
        offsetY: 0, 
        pointerId: null,
        startX: 0,
        startY: 0 
      };
    }
  };

  // Click on empty canvas does not deselect
  const onCanvasClick = (e) => {
    // Do nothing to prevent deselection
  };

  // Scale selected item
  const scaleSelected = (factor) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selectedId) return it;
        const newW = Math.max(8, it.w * factor);
        const newH = Math.max(8, it.h * factor);
        const rect = containerRef.current?.getBoundingClientRect() || { width: 1000, height: 1000 };
        const newX = Math.max(
          calculateBoundingHalf(newW, newH, it.rotation || 0, "w"),
          Math.min(rect.width - calculateBoundingHalf(newW, newH, it.rotation || 0, "w"), it.x)
        );
        const newY = Math.max(
          calculateBoundingHalf(newW, newH, it.rotation || 0, "h"),
          Math.min(rect.height - calculateBoundingHalf(newW, newH, it.rotation || 0, "h"), it.y)
        );
        return { ...it, w: newW, h: newH, x: newX, y: newY };
      })
    );
    setIsDirty(true);
  };

  // Rotate selected item
  const rotateSelected = (delta) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selectedId) return it;
        const newRotation = ((it.rotation || 0) + delta + 360) % 360;
        const rect = containerRef.current?.getBoundingClientRect() || { width: 1000, height: 1000 };
        const newX = Math.max(
          calculateBoundingHalf(it.w, it.h, newRotation, "w"),
          Math.min(rect.width - calculateBoundingHalf(it.w, it.h, newRotation, "w"), it.x)
        );
        const newY = Math.max(
          calculateBoundingHalf(it.w, it.h, newRotation, "h"),
          Math.min(rect.height - calculateBoundingHalf(it.w, it.h, newRotation, "h"), it.y)
        );
        return { ...it, rotation: newRotation, x: newX, y: newY };
      })
    );
    setIsDirty(true);
  };

  // Export to PNG
  const exportToPNG = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    const ctx = canvas.getContext("2d");

    // Background
    const tpl = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
    ctx.fillStyle = tpl.color || "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#e6e6e6";
    ctx.lineWidth = 1;
    const gridStep = 25 * scale;
    for (let x = 0; x < canvas.width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw items
    items.forEach((it) => {
      const x = Math.round(it.x * scale);
      const y = Math.round(it.y * scale);
      const w = Math.round(it.w * scale);
      const h = Math.round(it.h * scale);
      const rotation = (it.rotation || 0) * (Math.PI / 180);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = it.color || "#999";

      if (it.shape === "round") {
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }

      // Label
      if (it.type !== "chair" && it.type !== "light") {
        ctx.fillStyle = ["piano", "stage", "drink_bar", "walkway_carpet", "catering_stand", "exit_door", "head_table"].includes(it.type) ? "#fff" : "#000";
        const fontSize = (Math.min(it.w, it.h) < 50 ? 10 : 12) * scale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), 0, 0);
      }
      ctx.restore();
    });

    // Download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `floorplan-${eventId || "event"}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return dataURLtoBlob(dataUrl);
  };

  // Convert dataUrl to blob
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  // Upload floorplan PNG to a venue
  const uploadToVenue = async () => {
    if (!selectedVenue) {
      alert("Please choose a venue to upload to.");
      return;
    }
    if (!eventId) {
      alert("Missing eventId — upload requires an event context.");
      return;
    }
    try {
      const blob = exportToPNG();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const fd = new FormData();
      fd.append("file", blob, `floorplan-${eventId}.png`);
      fd.append("eventId", eventId);
      fd.append("venueId", selectedVenue);

      const res = await fetch(`/api/event/${eventId}/venue/${selectedVenue}/floorplan`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json();
      alert(data.message || "Uploaded successfully");
    } catch (err) {
      console.error("Upload error", err);
      alert("Upload failed: " + (err.message || err));
    }
  };

  // Save/Load local
  const saveLocal = () => {
    localStorage.setItem(`floorplan-${eventId || "anon"}`, JSON.stringify({ template, items }));
    setIsDirty(false);
    alert("Draft saved locally");
  };

  const loadLocal = () => {
    const raw = localStorage.getItem(`floorplan-${eventId || "anon"}`);
    if (!raw) return alert("No saved draft found");
    try {
      const obj = JSON.parse(raw);
      if (obj.template) setTemplate(obj.template);
      if (Array.isArray(obj.items)) {
        setItems(obj.items.map((it) => ({ ...it, rotation: it.rotation ?? 0 })));
      }
      alert("Draft loaded");
    } catch (e) {
      console.error(e);
      alert("Failed to load draft");
    }
  };

  return (
    <main className="floorplan-page">
      <header className="floorplan-header">
        <button className="back-button" onClick={() => setActivePage("event-details")}>
          ← Back
        </button>
        <h2>Floorplan Designer</h2>
      </header>

      <div className="floorplan-content">
        <aside className="floorplan-sidebar">
          <h3>Choose venue</h3>
          <div className="venue-list">
            {venues.map((v) => (
              <button
                key={v.id}
                className={`venue-item ${selectedVenue === v.id ? "selected" : ""}`}
                onClick={() => setSelectedVenue(v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>

          <h3>Template</h3>
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            {TEMPLATES.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <h3>Add items</h3>
          <div className="tool-buttons">
            <button onClick={() => addItem("table_small")}>Add Small Round Table</button>
            <button onClick={() => addItem("table_square")}>Add Square Table</button>
            <button onClick={() => addItem("table_large")}>Add Rectangle Table</button>
            <button onClick={() => addItem("chair")}>Add Chair</button>
            <button onClick={() => addItem("stage")}>Add Stage</button>
            <button onClick={() => addItem("light_small")}>Add Small Light Fixture</button>
            <button onClick={() => addItem("light_medium")}>Add Medium Light Fixture</button>
            <button onClick={() => addItem("light_large")}>Add Large Light Fixture</button>
            <button onClick={() => addItem("piano")}>Add Piano</button>
            <button onClick={() => addItem("dance_floor")}>Add Dance Floor</button>
            <button onClick={() => addItem("drink_bar")}>Add Drink Bar</button>
            <button onClick={() => addItem("cake_table")}>Add Cake Table</button>
            <button onClick={() => addItem("head_table")}>Add Head Table</button>
            <button onClick={() => addItem("walkway_carpet")}>Add Walkway Carpet</button>
            <button onClick={() => addItem("catering_stand")}>Add Catering Stand</button>
            <button onClick={() => addItem("exit_door")}>Add Exit Door</button>
          </div>

          <h3>Selected</h3>
          <div className="selected-controls">
            <div className="id-selection">
              <label htmlFor="selected-id">Selected ID:</label>
              <select
                id="selected-id"
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
              >
                <option value="">—</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.id} ({it.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())})
                  </option>
                ))}
              </select>
            </div>
            {selectedId && (
              <>
                <div className="scale-controls">
                  <button onClick={() => scaleSelected(0.9)} disabled={!selectedId}>
                    Scale Down
                  </button>
                  <button onClick={() => scaleSelected(1.1)} disabled={!selectedId}>
                    Scale Up
                  </button>
                </div>
                <div className="rotate-controls">
                  <button onClick={() => rotateSelected(-15)} disabled={!selectedId}>
                    Rotate -15°
                  </button>
                  <button onClick={() => rotateSelected(15)} disabled={!selectedId}>
                    Rotate +15°
                  </button>
                </div>
                <button className="danger" onClick={removeSelected} disabled={!selectedId}>
                  Remove
                </button>
              </>
            )}
          </div>

          <h3>Save / upload</h3>
          <div className="save-controls">
            <button onClick={exportToPNG}>Download PNG</button>
            <button onClick={uploadToVenue}>Send to Selected Vendor</button>
            <button onClick={saveLocal}>Save Draft</button>
            <button onClick={loadLocal}>Load Draft</button>
          </div>

          <p className="hint">Tip: Click an item to select, drag to move, use scale/rotate buttons, or remove.</p>
        </aside>

        <section className="floorplan-canvas-wrap">
          <div
            className="floorplan-canvas"
            ref={containerRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={onCanvasClick}
            style={{ background: TEMPLATES.find((t) => t.id === template)?.color || "#fff" }}
          >
            {items.map((it) => (
              <div
                key={it.id}
                className={`fp-item ${selectedId === it.id ? "selected" : ""} ${it.type} ${
                  it.shape === "round" ? "round" : ""
                }`}
                style={{
                  left: `${it.x}px`,
                  top: `${it.y}px`,
                  width: `${it.w}px`,
                  height: `${it.h}px`,
                  background: it.color,
                  transform: `translate(-50%, -50%) rotate(${it.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
                onPointerDown={(e) => onPointerDownItem(e, it.id)}
              >
                <div className="fp-label">{it.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default PlannerFloorPlan;