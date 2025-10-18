// src/hooks/useFloorplanHandlers.js
import { useRef } from "react";
import { ITEM_PROTOTYPES } from "./floorplanItems";

export function useFloorplanHandlers({
  containerRef,
  items,
  setItems,
  selectedId,
  setSelectedId,
  setIsDirty,
}) {
  const dragRef = useRef({});

  // --- ADD ITEM ---
  const addItem = (key) => {
    const proto = ITEM_PROTOTYPES[key];
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newItem = {
      id: `it-${crypto.randomUUID()}`,
      ...proto,
      x: rect.width / 2,
      y: rect.height / 2,
      rotation: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setIsDirty(true);
  };

  // --- REMOVE ITEM BY ID ---
  const removeItem = (id) => {
    if (!id) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedId === id) setSelectedId(null);
    setIsDirty(true);
  };

  // --- REMOVE SELECTED ITEM ---
  const removeSelected = () => removeItem(selectedId);

  // --- EDIT ITEM ---
  const editItem = (id, updates) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
    setIsDirty(true);
  };

  // --- DELETE ENTIRE FLOORPLAN ---
  const deleteFloorplan = () => {
    setItems([]);
    setSelectedId(null);
    setIsDirty(true);
  };

  // --- POINTER / DRAG HANDLERS ---
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

    setSelectedId(id);
    const isRotating = e.shiftKey;
    const initialAngle = isRotating
      ? Math.atan2(mouseY - it.y, mouseX - it.x) * (180 / Math.PI)
      : 0;

    dragRef.current = {
      dragging: !isRotating,
      rotating: isRotating,
      id,
      offsetX: mouseX - it.x,
      offsetY: mouseY - it.y,
      pointerId: e.pointerId,
      startX: mouseX,
      startY: mouseY,
      initialAngle,
      touchAngle: 0,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.id || dragRef.current.pointerId !== e.pointerId)
      return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const threshold = 5;
    if (
      !dragRef.current.dragging &&
      !dragRef.current.rotating &&
      (Math.abs(mouseX - dragRef.current.startX) > threshold ||
        Math.abs(mouseY - dragRef.current.startY) > threshold)
    ) {
      dragRef.current.dragging = true;
    }

    if (dragRef.current.dragging) {
      const { id, offsetX, offsetY } = dragRef.current;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                x: Math.max(
                  calculateBoundingHalf(it.w, it.h, it.rotation || 0, "w"),
                  Math.min(
                    rect.width -
                      calculateBoundingHalf(it.w, it.h, it.rotation || 0, "w"),
                    mouseX - offsetX
                  )
                ),
                y: Math.max(
                  calculateBoundingHalf(it.w, it.h, it.rotation || 0, "h"),
                  Math.min(
                    rect.height -
                      calculateBoundingHalf(
                        it.w,
                        it.h,
                        it.rotation || 0,
                        "h"
                      ),
                    mouseY - offsetY
                  )
                ),
              }
            : it
        )
      );
      setIsDirty(true);
    } else if (dragRef.current.rotating) {
      const { id, initialAngle } = dragRef.current;
      const it = items.find((i) => i.id === id);
      if (!it) return;

      const currentAngle =
        Math.atan2(mouseY - it.y, mouseX - it.x) * (180 / Math.PI);
      const deltaAngle = (currentAngle - initialAngle + 360) % 360;
      const newRotation = ((it.rotation || 0) + deltaAngle + 360) % 360;

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                rotation: newRotation,
                x: item.x,
                y: item.y,
              }
            : item
        )
      );
      dragRef.current.initialAngle = currentAngle;
      setIsDirty(true);
    }
  };

  const onPointerUp = (e) => {
    if (dragRef.current.id && dragRef.current.pointerId === e.pointerId) {
      dragRef.current = {};
    }
  };

  // --- TOUCH HANDLERS ---
  const onTouchStart = (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    container.setPointerCapture(e.touches[0].identifier);
    const rect = container.getBoundingClientRect();
    const touch1 = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    const touch2 = { x: e.touches[1].clientX - rect.left, y: e.touches[1].clientY - rect.top };
    const it = items.find((i) => i.id === selectedId);
    if (!it) return;

    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    const initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    dragRef.current = {
      dragging: false,
      rotating: true,
      id: selectedId,
      offsetX: 0,
      offsetY: 0,
      pointerId: e.touches[0].identifier,
      startX: (touch1.x + touch2.x) / 2,
      startY: (touch1.y + touch2.y) / 2,
      initialAngle,
      touchAngle: initialAngle,
    };
  };

  const onTouchMove = (e) => {
    if (
      e.touches.length !== 2 ||
      !dragRef.current.rotating ||
      dragRef.current.id !== selectedId
    )
      return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const touch1 = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    const touch2 = { x: e.touches[1].clientX - rect.left, y: e.touches[1].clientY - rect.top };
    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const deltaAngle = (currentAngle - dragRef.current.touchAngle + 360) % 360;
    const it = items.find((i) => i.id === selectedId);
    if (!it) return;

    const newRotation = ((it.rotation || 0) + deltaAngle + 360) % 360;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? { ...item, rotation: newRotation, x: item.x, y: item.y }
          : item
      )
    );
    dragRef.current.touchAngle = currentAngle;
    setIsDirty(true);
  };

  const onTouchEnd = () => {
    dragRef.current = {};
  };

  // --- SCALE & ROTATE ---
  const scaleSelected = (factor) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selectedId) return it;
        const newW = Math.max(8, it.w * factor);
        const newH = Math.max(8, it.h * factor);
        return { ...it, w: newW, h: newH };
      })
    );
    setIsDirty(true);
  };

  const rotateSelected = (delta) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId ? { ...it, rotation: ((it.rotation || 0) + delta + 360) % 360 } : it
      )
    );
    setIsDirty(true);
  };

  // --- HELPERS ---
  const calculateBoundingHalf = (w, h, rotation, dim) => {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const bb_w = w * cos + h * sin;
    const bb_h = w * sin + h * cos;
    return dim === "w" ? bb_w / 2 : bb_h / 2;
  };

  return {
    addItem,
    removeItem,
    removeSelected,
    editItem,
    deleteFloorplan,
    onPointerDownItem,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    scaleSelected,
    rotateSelected,
  };
}
