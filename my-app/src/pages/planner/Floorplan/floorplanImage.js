// src/utils/floorplanImage.js
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { TEMPLATES } from "../constants/floorplanTemplates"; // <-- replace with your actual templates
import { ITEM_PROTOTYPES } from "./floorplanItems";

export async function createFloorplanBlob({ containerRef, backgroundImage, template, items, selectedEventId }) {
  const container = containerRef.current;
  if (!container) {
    throw new Error("Canvas container not found");
  }

  const rect = container.getBoundingClientRect();
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const ctx = canvas.getContext("2d");

  const drawAll = () => drawCanvasContent(ctx, items, scale);

  if (backgroundImage) {
    const img = new Image();
    img.src = backgroundImage;
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawAll();
        resolve({
          base64Data: canvas.toDataURL("image/png", 0.9).split(",")[1],
          mimeType: "image/png",
          fileName: `floorplan-${selectedEventId || "event"}.png`,
        });
      };
      img.onerror = () => reject(new Error("Failed to load background image"));
    });
  } else {
    const tpl = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
    ctx.fillStyle = tpl?.color || "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawAll();
    return Promise.resolve({
      base64Data: canvas.toDataURL("image/png", 0.9).split(",")[1],
      mimeType: "image/png",
      fileName: `floorplan-${selectedEventId || "event"}.png`,
    });
  }
}

export function drawCanvasContent(ctx, items, scale) {
  if (!items || !Array.isArray(items)) return;

  // Draw grid
  ctx.strokeStyle = "#e6e6e6";
  ctx.lineWidth = 1;
  const gridStep = 25 * scale;
  for (let x = 0; x < ctx.canvas.width; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ctx.canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < ctx.canvas.height; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width, y);
    ctx.stroke();
  }

  // Draw items
  items.forEach((it) => {
    const x = Math.round(it.x * scale);
    const y = Math.round(it.y * scale);
    const w = Math.round(it.w * scale);
    const h = Math.round(it.h * scale);
    const rotation = ((it.rotation || 0) * Math.PI) / 180;

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

    if (it.type !== "chair" && it.type !== "light") {
      ctx.fillStyle = [
        "piano",
        "stage",
        "drink_bar",
        "walkway_carpet",
        "catering_stand",
        "exit_door",
        "head_table",
      ].includes(it.type)
        ? "#fff"
        : "#000";

      const fontSize = (Math.min(it.w, it.h) < 50 ? 10 : 12) * scale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        it.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        0,
        0
      );
    }

    ctx.restore();
  });
}

export async function uploadToVendor({ selectedEventId, selectedVendor, backgroundImage, template, items, containerRef, setIsDirty }) {
  if (!selectedEventId) {
    alert("Please choose an event first.");
    return;
  }
  if (!selectedVendor) {
    alert("Please choose a vendor to upload to.");
    return;
  }

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user");
    alert("Please log in to upload the floorplan.");
    return;
  }

  try {
    const { base64Data, mimeType, fileName } = await createFloorplanBlob({
      containerRef,
      backgroundImage,
      template,
      items,
      selectedEventId,
    });

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const storage = getStorage();
    const storageFileName = `Floorplans/${selectedEventId}/${selectedVendor}/${uuidv4()}-${fileName}`;
    const storageRef = ref(storage, storageFileName);

    await uploadBytes(storageRef, blob, {
      contentType: mimeType,
      customMetadata: {
        uploadedBy: user.uid,
        uploadedAt: new Date().toISOString(),
      },
    });

    const floorplanUrl = await getDownloadURL(storageRef);

    const db = getFirestore();
    const floorplanRef = doc(db, "Event", selectedEventId, "Floorplans", selectedVendor);
    const docSnap = await getDoc(floorplanRef);

    const payload = {
      floorplanUrl,
      uploadedAt: new Date(),
      uploadedBy: user.uid,
    };

    if (!docSnap.exists()) {
      await setDoc(floorplanRef, payload);
    } else {
      await updateDoc(floorplanRef, payload);
    }

    alert("Floorplan uploaded successfully");
    setIsDirty(false);
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed: " + err.message);
  }
}

export async function exportToPNG({ containerRef, backgroundImage, template, items, selectedEventId }) {
  const { base64Data, fileName } = await createFloorplanBlob({
    containerRef,
    backgroundImage,
    template,
    items,
    selectedEventId,
  });

  const dataUrl = `data:image/png;base64,${base64Data}`;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
