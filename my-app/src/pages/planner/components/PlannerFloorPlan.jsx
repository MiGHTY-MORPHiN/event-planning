// src/components/PlannerFloorPlan.jsx
import React, { useEffect, useRef, useState } from "react";
import { fetchEvents, fetchVendors } from "../helpers";
import { getAuth } from "firebase/auth";
import { useFloorplanHandlers } from "../hooks/useFloorplanHandlers";
import { useFloorplanStorage } from "../hooks/useFloorplanStorage";
import { uploadToVendor, exportToPNG } from "../utils/floorplanImage";
import { ITEM_PROTOTYPES } from "../constants/floorplanItems";
import { TEMPLATES } from "../constants/floorplanTemplates";
import FloorplanItem from "./FloorplanItem";
import "./PlannerFloorPlan.css"; // updated CSS

// Buttons for adding items
const ItemButtons = ({ addItem }) => (
  <div className="tool-buttons">
    {Object.keys(ITEM_PROTOTYPES).map((key) => (
      <button key={key} onClick={() => addItem(key)}>
        Add {ITEM_PROTOTYPES[key].type.replace(/_/g, " ")}
      </button>
    ))}
  </div>
);

// Controls for selected item
const SelectedControls = ({
  selectedId,
  items,
  setSelectedId,
  scaleSelected,
  rotateSelected,
  removeSelected,
  editItem,
}) => {
  const selectedItem = items.find((it) => it.id === selectedId);
  const [editValues, setEditValues] = useState({
    type: selectedItem?.type || "",
    w: selectedItem?.w || 50,
    h: selectedItem?.h || 50,
    rotation: selectedItem?.rotation || 0,
  });

  useEffect(() => {
    if (selectedItem) {
      setEditValues({
        type: selectedItem.type,
        w: selectedItem.w,
        h: selectedItem.h,
        rotation: selectedItem.rotation,
      });
    }
  }, [selectedId, selectedItem]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: name === "type" ? value : Number(value) }));
  };

  const applyEdit = () => {
    if (!selectedId) return;
    editItem(selectedId, { ...editValues });
  };

  return (
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
              {it.id} ({it.type.replace(/_/g, " ")})
            </option>
          ))}
        </select>
      </div>

      {selectedId && selectedItem && (
        <div className="control-buttons">
          <div className="scale-controls">
            <button onClick={() => scaleSelected(0.9)}>Scale Down</button>
            <button onClick={() => scaleSelected(1.1)}>Scale Up</button>
          </div>
          <div className="rotate-controls">
            <button onClick={() => rotateSelected(-15)}>Rotate -15°</button>
            <button onClick={() => rotateSelected(15)}>Rotate +15°</button>
          </div>
          <button className="danger" onClick={removeSelected}>
            Remove
          </button>

          <div className="edit-controls">
            <h4>Edit Item</h4>
            <label>
              Type:
              <select name="type" value={editValues.type} onChange={handleEditChange}>
                {Object.keys(ITEM_PROTOTYPES).map((key) => (
                  <option key={key} value={ITEM_PROTOTYPES[key].type}>
                    {ITEM_PROTOTYPES[key].type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Width:
              <input
                type="number"
                name="w"
                value={editValues.w}
                onChange={handleEditChange}
                min={8}
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                name="h"
                value={editValues.h}
                onChange={handleEditChange}
                min={8}
              />
            </label>
            <label>
              Rotation:
              <input
                type="number"
                name="rotation"
                value={editValues.rotation}
                onChange={handleEditChange}
              />
            </label>
            <button onClick={applyEdit}>Apply Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

const PlannerFloorPlan = ({ eventId: initialEventId }) => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || "");
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });

  const user = getAuth().currentUser;

  // Floorplan handlers
  const {
    addItem,
    removeSelected,
    scaleSelected,
    rotateSelected,
    editItem,
    deleteLocal,
    onPointerDownItem,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useFloorplanHandlers({
    containerRef,
    items,
    setItems,
    selectedId,
    setSelectedId,
    setIsDirty,
  });

  const { handleImageUpload, clearBackgroundImage, saveLocal, loadLocal } =
    useFloorplanStorage({
      selectedEventId,
      template,
      items,
      backgroundImage,
      setTemplate,
      setItems,
      setBackgroundImage,
      setIsDirty,
    });

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
        if (!selectedEventId && eventsData.length > 0) setSelectedEventId(eventsData[0].id);
      } catch (err) {
        console.error("Fetch events error:", err.message);
        setEvents([]);
        alert("Failed to fetch events.");
      }
    };
    loadEvents();
  }, []);

  // Load vendors when event changes
  useEffect(() => {
    if (!selectedEventId) {
      setVendors([]);
      setSelectedVendor("");
      return;
    }
    const loadVendors = async () => {
      try {
        const vendorsData = await fetchVendors(selectedEventId);
        setVendors(vendorsData);
      } catch (err) {
        console.error("Fetch vendors error:", err.message);
        setVendors([]);
        alert("Failed to fetch vendors.");
      }
    };
    loadVendors();
  }, [selectedEventId]);

  // Auto-resize canvas
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="floorplan-page">
      {/* Topbar for event/vendor/template */}
      <div className="floorplan-topbar">
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          <option value="">Select Event</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name || ev.id}
            </option>
          ))}
        </select>

        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          disabled={!selectedEventId}
        >
          <option value="">Select Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.businessName || v.id}
            </option>
          ))}
        </select>

        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main content: canvas + sidebar */}
      <div className="floorplan-content">
        {/* Canvas area */}
        <div className="floorplan-canvas-wrap">
          <div
            className="floorplan-canvas"
            ref={containerRef}
            style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            {items.map((it) => (
              <FloorplanItem
                key={it.id}
                item={it}
                selectedId={selectedId}
                onPointerDown={onPointerDownItem}
                containerSize={canvasSize}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="floorplan-sidebar">
          <h3>Background Image</h3>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageUpload}
          />
          {backgroundImage && (
            <div className="image-preview">
              <img
                src={backgroundImage}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "100px", marginTop: 10 }}
              />
              <button onClick={clearBackgroundImage} className="danger">
                Clear Image
              </button>
            </div>
          )}

          <h3>Add Items</h3>
          <ItemButtons addItem={addItem} />

          <h3>Selected Item</h3>
          <SelectedControls
            selectedId={selectedId}
            items={items}
            setSelectedId={setSelectedId}
            scaleSelected={scaleSelected}
            rotateSelected={rotateSelected}
            removeSelected={removeSelected}
            editItem={editItem}
          />

          <h3>Save / Upload</h3>
          <div className="save-controls">
            <button
              onClick={() =>
                exportToPNG({ containerRef, backgroundImage, template, items, selectedEventId })
              }
              disabled={!selectedEventId}
            >
              Download PNG
            </button>
            <button
              onClick={() =>
                uploadToVendor({
                  containerRef,
                  backgroundImage,
                  template,
                  items,
                  selectedEventId,
                  selectedVendor,
                  setIsDirty,
                })
              }
              disabled={!selectedEventId || !selectedVendor}
            >
              Send to Vendor
            </button>
            <button onClick={saveLocal} disabled={!selectedEventId}>
              Save Draft
            </button>
            <button onClick={loadLocal} disabled={!selectedEventId}>
              Load Draft
            </button>
            <button onClick={deleteLocal} disabled={!selectedEventId} className="danger">
              Delete Draft
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PlannerFloorPlan;
