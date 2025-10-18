// src/hooks/useFloorplanStorage.js
export function useFloorplanStorage({
  selectedEventId,
  template,
  items,
  backgroundImage,
  setTemplate,
  setItems,
  setBackgroundImage,
  setIsDirty,
}) {
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File is too large. Please upload an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target.result);
      setIsDirty(true);
      console.log("Image uploaded:", { type: file.type, size: file.size });
    };
    reader.onerror = () => {
      alert("Failed to read the image file.");
      console.error("Image read error");
    };
    reader.readAsDataURL(file);
  };

  // Clear background image
  const clearBackgroundImage = () => {
    setBackgroundImage(null);
    setIsDirty(true);
  };

  // Save draft locally
  const saveLocal = () => {
    if (!selectedEventId) {
      alert("Please select an event to save the draft.");
      return;
    }
    localStorage.setItem(
      `floorplan-${selectedEventId}`,
      JSON.stringify({ template, items, backgroundImage })
    );
    setIsDirty(false);
    alert("Draft saved locally");
  };

  // Load draft from local storage
  const loadLocal = () => {
    if (!selectedEventId) {
      alert("Please select an event to load the draft.");
      return;
    }
    const raw = localStorage.getItem(`floorplan-${selectedEventId}`);
    if (!raw) return alert("No saved draft found");

    try {
      const obj = JSON.parse(raw);
      if (obj.template) setTemplate(obj.template);
      if (Array.isArray(obj.items)) {
        setItems(
          obj.items.map((it) => ({
            ...it,
            rotation: it.rotation ?? 0,
          }))
        );
      }
      if (obj.backgroundImage) setBackgroundImage(obj.backgroundImage);
      alert("Draft loaded");
    } catch (e) {
      console.error("Load draft failed:", e);
      alert("Failed to load draft");
    }
  };


  const deleteLocal = () => {
    if (!selectedEventId) {
      alert("Please select an event to delete the draft.");
      return;
    }
    const key = `floorplan-${selectedEventId}`;
    if (!localStorage.getItem(key)) {
      alert("No saved draft found to delete.");
      return;
    }
    localStorage.removeItem(key);
    alert("Draft deleted from local storage.");
    // Optionally, clear current state too:
    setItems([]);
    setTemplate(TEMPLATES[0].id);
    setBackgroundImage(null);
    setIsDirty(false);
  };

  return { handleImageUpload, clearBackgroundImage, saveLocal, loadLocal, deleteLocal };
}

