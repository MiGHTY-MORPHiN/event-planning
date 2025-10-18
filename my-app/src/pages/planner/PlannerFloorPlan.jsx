import React, { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
	getFirestore,
	doc,
	setDoc,
	updateDoc,
	getDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import "./PlannerFloorPlan.css";

const TEMPLATES = [
	{ id: "blank", name: "Blank", color: "#ffffff", darkColor: "#1f2937" },
	{ id: "banquet", name: "Banquet (rect rows)", color: "#f8fafc", darkColor: "#374151" },
	{ id: "theatre", name: "Theatre (rows)", color: "#fbf7ff", darkColor: "#4c1d95" },
	{ id: "cocktail", name: "Cocktail (open)", color: "#fff8f0", darkColor: "#7c2d12" },
];

const ITEM_PROTOTYPES = {
	table_small: {
		type: "table",
		w: 80,
		h: 80,
		shape: "round",
		color: "#eab308",
		darkColor: "#d97706",
	},
	table_square: {
		type: "table",
		w: 80,
		h: 80,
		shape: "square",
		color: "#f97316",
		darkColor: "#ea580c",
	},
	table_large: {
		type: "table",
		w: 140,
		h: 80,
		shape: "rect",
		color: "#f97316",
		darkColor: "#ea580c",
	},
	chair: { 
		type: "chair", 
		w: 22, 
		h: 22, 
		shape: "round", 
		color: "#60a5fa",
		darkColor: "#3b82f6",
	},
	stage: { 
		type: "stage", 
		w: 300, 
		h: 80, 
		shape: "rect", 
		color: "#6b7280",
		darkColor: "#4b5563",
	},
	light_small: {
		type: "light",
		w: 20,
		h: 20,
		shape: "round",
		color: "#fef08a",
		darkColor: "#fde047",
	},
	light_medium: {
		type: "light",
		w: 30,
		h: 30,
		shape: "round",
		color: "#fef08a",
		darkColor: "#fde047",
	},
	light_large: {
		type: "light",
		w: 40,
		h: 40,
		shape: "round",
		color: "#fef08a",
		darkColor: "#fde047",
	},
	piano: { 
		type: "piano", 
		w: 120, 
		h: 60, 
		shape: "rect", 
		color: "#000000",
		darkColor: "#ffffff",
	},
	dance_floor: {
		type: "dance_floor",
		w: 200,
		h: 200,
		shape: "square",
		color: "#d1d5db",
		darkColor: "#6b7280",
	},
	drink_bar: {
		type: "drink_bar",
		w: 150,
		h: 50,
		shape: "rect",
		color: "#7f1d1d",
		darkColor: "#fecaca",
	},
	cake_table: {
		type: "cake_table",
		w: 60,
		h: 60,
		shape: "square",
		color: "#fbcfe8",
		darkColor: "#db2777",
	},
	head_table: {
		type: "head_table",
		w: 200,
		h: 60,
		shape: "rect",
		color: "#db2777",
		darkColor: "#fbcfe8",
	},
	walkway_carpet: {
		type: "walkway_carpet",
		w: 300,
		h: 40,
		shape: "rect",
		color: "#b91c1c",
		darkColor: "#fecaca",
	},
	catering_stand: {
		type: "catering_stand",
		w: 100,
		h: 50,
		shape: "rect",
		color: "#15803d",
		darkColor: "#bbf7d0",
	},
	exit_door: {
		type: "exit_door",
		w: 60,
		h: 30,
		shape: "rect",
		color: "#dc2626",
		darkColor: "#fca5a5",
	},
};

let nextId = 1;

const PlannerFloorPlan = ({ eventId: initialEventId, setActivePage }) => {
	const [events, setEvents] = useState([]);
	const [selectedEventId, setSelectedEventId] = useState(
		initialEventId || ""
	);
	const [vendors, setVendors] = useState([]);
	const [selectedVendor, setSelectedVendor] = useState("");
	const [template, setTemplate] = useState(TEMPLATES[0].id);
	const [items, setItems] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [isDirty, setIsDirty] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState(null);
	const [darkMode, setDarkMode] = useState(false);
	const containerRef = useRef(null);
	const auth = getAuth();
	const user = auth.currentUser;

	const dragRef = useRef({
		dragging: false,
		rotating: false,
		id: null,
		offsetX: 0,
		offsetY: 0,
		pointerId: null,
		startX: 0,
		startY: 0,
		initialAngle: 0,
		touchAngle: 0,
	});

	// Check system preference for dark mode
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setDarkMode(mediaQuery.matches);
		
		const handleChange = (e) => setDarkMode(e.matches);
		mediaQuery.addEventListener('change', handleChange);
		
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	// Toggle dark mode
	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	// Fetch planner's events
	useEffect(() => {
		const fetchEvents = async () => {
			let user = auth.currentUser;
			while (!user) {
				await new Promise((res) => setTimeout(res, 50));
				user = auth.currentUser;
			}
			try {
				const user = auth.currentUser;
				if (!user) {
					console.warn("No authenticated user, skipping event fetch");
					setEvents([]);
					return;
				}
				const token = await user.getIdToken(true);
				console.log("Fetching events...");
				const res = await fetch(
					`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);
				if (!res.ok) {
					const text = await res.text();
					console.error(`Fetch events failed: ${res.status}`);
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				const data = await res.json();
				console.log("Events fetched:", data);
				setEvents(data.events || []);
				if (!selectedEventId && data.events?.length > 0) {
					setSelectedEventId(data.events[0].id);
				}
			} catch (err) {
				console.error("Fetch events error:", err.message);
				setEvents([]);
			}
		};
		fetchEvents();
	}, []);

	// Fetch vendors when selectedEventId changes
	useEffect(() => {
		if (!selectedEventId) {
			setVendors([]);
			setSelectedVendor("");
			return;
		}
		const fetchVendors = async () => {
			try {
				const user = auth.currentUser;
				const token = user ? await user.getIdToken(true) : "";
				console.log(`Fetching vendors for event ${selectedEventId}`);
				const res = await fetch(
					`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${selectedEventId}/vendors`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);
				if (!res.ok) {
					const text = await res.text();
					console.error(`Fetch vendors failed: ${res.status}`);
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				const data = await res.json();
				console.log("Vendors fetched:", data);
				if (data.message === "No vendors found for this event") {
					setVendors([]);
				} else {
					setVendors(data.vendors || []);
				}
			} catch (err) {
				console.error("Fetch vendors error:", err.message);
				setVendors([]);
			}
		};
		fetchVendors();
	}, [selectedEventId]);

	// Handle image upload
	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		if (!allowedTypes.includes(file.type)) {
			alert(
				"Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
			);
			return;
		}

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			alert(
				"File is too large. Please upload an image smaller than 5MB."
			);
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			setBackgroundImage(event.target.result);
			setIsDirty(true);
		};
		reader.onerror = () => {
			alert("Failed to read the image file.");
		};
		reader.readAsDataURL(file);
	};

	// Clear background image
	const clearBackgroundImage = () => {
		setBackgroundImage(null);
		setIsDirty(true);
	};

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

	const removeSelected = () => {
		if (!selectedId) return;
		setItems((prev) => prev.filter((it) => it.id !== selectedId));
		setSelectedId(null);
		setIsDirty(true);
	};

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
									calculateBoundingHalf(
										it.w,
										it.h,
										it.rotation || 0,
										"w"
									),
									Math.min(
										rect.width -
											calculateBoundingHalf(
												it.w,
												it.h,
												it.rotation || 0,
												"w"
											),
										mouseX - offsetX
									)
								),
								y: Math.max(
									calculateBoundingHalf(
										it.w,
										it.h,
										it.rotation || 0,
										"h"
									),
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
								x: Math.max(
									calculateBoundingHalf(
										item.w,
										item.h,
										newRotation,
										"w"
									),
									Math.min(
										rect.width -
											calculateBoundingHalf(
												item.w,
												item.h,
												newRotation,
												"w"
											),
										item.x
									)
								),
								y: Math.max(
									calculateBoundingHalf(
										item.w,
										item.h,
										newRotation,
										"h"
									),
									Math.min(
										rect.height -
											calculateBoundingHalf(
												item.w,
												item.h,
												newRotation,
												"h"
											),
										item.y
									)
								),
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
			dragRef.current = {
				dragging: false,
				rotating: false,
				id: null,
				offsetX: 0,
				offsetY: 0,
				pointerId: null,
				startX: 0,
				startY: 0,
				initialAngle: 0,
				touchAngle: 0,
			};
		}
	};

	const calculateBoundingHalf = (w, h, rotation, dim) => {
		const rad = (rotation * Math.PI) / 180;
		const cos = Math.abs(Math.cos(rad));
		const sin = Math.abs(Math.sin(rad));
		const bb_w = w * cos + h * sin;
		const bb_h = w * sin + h * cos;
		return dim === "w" ? bb_w / 2 : bb_h / 2;
	};

	const scaleSelected = (factor) => {
		if (!selectedId) return;
		setItems((prev) =>
			prev.map((it) => {
				if (it.id !== selectedId) return it;
				const newW = Math.max(8, it.w * factor);
				const newH = Math.max(8, it.h * factor);
				const rect = containerRef.current?.getBoundingClientRect() || {
					width: 1000,
					height: 1000,
				};
				const newX = Math.max(
					calculateBoundingHalf(newW, newH, it.rotation || 0, "w"),
					Math.min(
						rect.width -
							calculateBoundingHalf(
								newW,
								newH,
								it.rotation || 0,
								"w"
							),
						it.x
					)
				);
				const newY = Math.max(
					calculateBoundingHalf(newW, newH, it.rotation || 0, "h"),
					Math.min(
						rect.height -
							calculateBoundingHalf(
								newW,
								newH,
								it.rotation || 0,
								"h"
							),
						it.y
					)
				);
				return { ...it, w: newW, h: newH, x: newX, y: newY };
			})
		);
		setIsDirty(true);
	};

	const rotateSelected = (delta) => {
		if (!selectedId) return;
		setItems((prev) =>
			prev.map((it) => {
				if (it.id !== selectedId) return it;
				const newRotation = ((it.rotation || 0) + delta + 360) % 360;
				const rect = containerRef.current?.getBoundingClientRect() || {
					width: 1000,
					height: 1000,
				};
				const newX = Math.max(
					calculateBoundingHalf(it.w, it.h, newRotation, "w"),
					Math.min(
						rect.width -
							calculateBoundingHalf(it.w, it.h, newRotation, "w"),
						it.x
					)
				);
				const newY = Math.max(
					calculateBoundingHalf(it.w, it.h, newRotation, "h"),
					Math.min(
						rect.height -
							calculateBoundingHalf(it.w, it.h, newRotation, "h"),
						it.y
					)
				);
				return { ...it, rotation: newRotation, x: newX, y: newY };
			})
		);
		setIsDirty(true);
	};

	const createFloorplanBlob = () => {
		const container = containerRef.current;
		if (!container) {
			throw new Error("Canvas container not found");
		}

		const rect = container.getBoundingClientRect();
		const canvas = document.createElement("canvas");
		const scale = 2;
		canvas.width = Math.round(rect.width * scale);
		canvas.height = Math.round(rect.height * scale);
		const ctx = canvas.getContext("2d");

		if (backgroundImage) {
			const img = new Image();
			img.src = backgroundImage;
			return new Promise((resolve, reject) => {
				img.onload = () => {
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					drawCanvasContent(ctx, scale);
					resolve({
						base64Data: canvas
							.toDataURL("image/png", 0.9)
							.split(",")[1],
						mimeType: "image/png",
						fileName: `floorplan-${selectedEventId || "event"}.png`,
					});
				};
				img.onerror = () =>
					reject(new Error("Failed to load background image"));
			});
		} else {
			const tpl =
				TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
			ctx.fillStyle = tpl.color || "#fff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			drawCanvasContent(ctx, scale);
			return Promise.resolve({
				base64Data: canvas.toDataURL("image/png", 0.9).split(",")[1],
				mimeType: "image/png",
				fileName: `floorplan-${selectedEventId || "event"}.png`,
			});
		}
	};

	const drawCanvasContent = (ctx, scale) => {
		// Draw grid - adjust color based on dark mode
		ctx.strokeStyle = darkMode ? "#374151" : "#e6e6e6";
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
			const rotation = (it.rotation || 0) * (Math.PI / 180);

			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rotation);
			
			// Use dark mode colors if available
			const itemColor = darkMode && it.darkColor ? it.darkColor : it.color;
			ctx.fillStyle = itemColor || "#999";

			if (it.shape === "round") {
				ctx.beginPath();
				ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 2 * Math.PI);
				ctx.fill();
			} else {
				ctx.fillRect(-w / 2, -h / 2, w, h);
			}

			if (it.type !== "chair" && it.type !== "light") {
				// Adjust text color for better contrast in dark mode
				const needsLightText = [
					"piano", "stage", "drink_bar", "walkway_carpet", 
					"catering_stand", "exit_door", "head_table"
				].includes(it.type);
				
				if (darkMode) {
					ctx.fillStyle = needsLightText ? "#ffffff" : "#000000";
				} else {
					ctx.fillStyle = needsLightText ? "#ffffff" : "#000000";
				}
				
				const fontSize = (Math.min(it.w, it.h) < 50 ? 10 : 12) * scale;
				ctx.font = `${fontSize}px sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(
					it.type
						.replace(/_/g, " ")
						.replace(/\b\w/g, (l) => l.toUpperCase()),
					0,
					0
				);
			}
			ctx.restore();
		});
	};

	const uploadToVendor = async () => {
		if (!selectedEventId) {
			alert("Please choose an event first.");
			return;
		}
		if (!selectedVendor) {
			alert("Please choose a vendor to upload to.");
			return;
		}

		try {
			const user = auth.currentUser;
			if (!user) {
				alert("Please log in to upload the floorplan.");
				return;
			}

			const { base64Data, mimeType, fileName } =
				await createFloorplanBlob();

			// Convert base64 to Blob
			const byteCharacters = atob(base64Data);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: mimeType });

			// Upload to Firebase Storage
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

			// Save to Firestore
			const db = getFirestore();
			const floorplanRef = doc(
				db,
				"Event",
				selectedEventId,
				"Floorplans",
				selectedVendor
			);

			const docSnap = await getDoc(floorplanRef);
			if (!docSnap.exists()) {
				await setDoc(floorplanRef, {
					floorplanUrl,
					uploadedAt: new Date(),
					uploadedBy: user.uid,
				});
			} else {
				await updateDoc(floorplanRef, {
					floorplanUrl,
					uploadedAt: new Date(),
					uploadedBy: user.uid,
				});
			}

			alert("Floorplan uploaded successfully");
			setIsDirty(false);
		} catch (err) {
			console.error("Upload error:", err);
			alert("Upload failed: " + err.message);
		}
	};

	const exportToPNG = async () => {
		try {
			const { base64Data, fileName } = await createFloorplanBlob();
			const dataUrl = `data:image/png;base64,${base64Data}`;
			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			a.remove();
		} catch (error) {
			console.error("Export to PNG failed:", error);
			alert("Failed to export floorplan: " + error.message);
		}
	};

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

	// Get current template color based on dark mode
	const getTemplateColor = () => {
		const tpl = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
		return darkMode ? (tpl.darkColor || tpl.color) : tpl.color;
	};

	// Get item color based on dark mode
	const getItemColor = (item) => {
		return darkMode ? (item.darkColor || item.color) : item.color;
	};

	return (
		<div className={`floorplan-page ${darkMode ? 'dark-mode' : ''}`}>
			<header className="floorplan-header">
				<button 
					className="back-button"
					onClick={() => setActivePage?.("dashboard")}
				>
					← Back
				</button>
				<h2>Floorplan Designer</h2>
				<button 
					className="dark-mode-toggle"
					onClick={toggleDarkMode}
					title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
				>
					{darkMode ? '☀️' : '🌙'}
				</button>
			</header>

			<div className="floorplan-content">
				<aside className="floorplan-sidebar">
					<div className="sidebar-section">
						<h3>Choose Event</h3>
						<select
							data-testid="event-selector"
							value={selectedEventId}
							onChange={(e) => setSelectedEventId(e.target.value)}
							className="event-select"
						>
							<option value="">Select an event</option>
							{events.map((event) => (
								<option key={event.id} value={event.id}>
									{event.name || event.id}
								</option>
							))}
						</select>
					</div>

					<div className="sidebar-section">
						<h3>Choose Vendor</h3>
						<select
							data-testid="vendor-selector"
							value={selectedVendor}
							onChange={(e) => setSelectedVendor(e.target.value)}
							className="vendor-select"
							disabled={!selectedEventId}
						>
							<option value="">Select a vendor</option>
							{vendors.map((v) => (
								<option key={v.id} value={v.id}>
									{v.businessName || v.id}
								</option>
							))}
						</select>
					</div>

					<div className="sidebar-section">
						<h3>Template</h3>
						<select
							value={template}
							onChange={(e) => setTemplate(e.target.value)}
						>
							{TEMPLATES.map((t) => (
								<option value={t.id} key={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<div className="sidebar-section">
						<h3>Background Image</h3>
						<div className="image-upload">
							<input
								type="file"
								accept="image/jpeg,image/png,image/gif,image/webp"
								onChange={handleImageUpload}
							/>
							{backgroundImage && (
								<div className="image-preview">
									<img
										src={backgroundImage}
										alt="Background preview"
									/>
									<button
										onClick={clearBackgroundImage}
										className="clear-image"
									>
										Clear Image
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="sidebar-section">
						<h3>Add Items</h3>
						<div className="tool-buttons">
							{Object.entries(ITEM_PROTOTYPES).map(([key, item]) => (
								<button 
									key={key} 
									onClick={() => addItem(key)}
									className="tool-btn"
									style={{
										backgroundColor: getItemColor(item),
										color: darkMode ? '#1f2937' : '#000000'
									}}
								>
									Add {item.type.replace(/_/g, ' ')}
								</button>
							))}
						</div>
					</div>

					<div className="sidebar-section">
						<h3>Selected Item</h3>
						<div className="selected-controls">
							<div className="id-selection">
								<select
									value={selectedId || ""}
									onChange={(e) =>
										setSelectedId(e.target.value || null)
									}
								>
									<option value="">— Select Item —</option>
									{items.map((it) => (
										<option key={it.id} value={it.id}>
											{it.id} ({it.type})
										</option>
									))}
								</select>
							</div>
							{selectedId && (
								<div className="control-buttons">
									<div className="button-group">
										<button onClick={() => scaleSelected(0.9)}>
											Scale Down
										</button>
										<button onClick={() => scaleSelected(1.1)}>
											Scale Up
										</button>
									</div>
									<div className="button-group">
										<button onClick={() => rotateSelected(-15)}>
											Rotate -15°
										</button>
										<button onClick={() => rotateSelected(15)}>
											Rotate +15°
										</button>
									</div>
									<button
										className="danger"
										onClick={removeSelected}
									>
										Remove Item
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="sidebar-section">
						<h3>Save & Export</h3>
						<div className="save-controls">
							<button onClick={exportToPNG}>
								Download PNG
							</button>
							<button
								onClick={uploadToVendor}
								disabled={!selectedEventId || !selectedVendor}
							>
								Send to Vendor
							</button>
							<button onClick={saveLocal}>
								Save Draft
							</button>
							<button onClick={loadLocal}>
								Load Draft
							</button>
						</div>
					</div>

					<div className="sidebar-hint">
						<p>💡 Tip: Click to select, drag to move, Shift+drag to rotate</p>
					</div>
				</aside>

				<main className="floorplan-main">
					<div className="canvas-container">
						<div
							className="floorplan-canvas"
							ref={containerRef}
							onPointerMove={onPointerMove}
							onPointerUp={onPointerUp}
							onPointerCancel={onPointerUp}
							style={{
								background: backgroundImage
									? `url(${backgroundImage}) no-repeat center/contain`
									: getTemplateColor(),
							}}
						>
							{items.map((it) => (
								<div
									key={it.id}
									className={`fp-item ${
										selectedId === it.id ? "selected" : ""
									} ${it.shape === "round" ? "round" : ""}`}
									style={{
										left: `${it.x}px`,
										top: `${it.y}px`,
										width: `${it.w}px`,
										height: `${it.h}px`,
										backgroundColor: getItemColor(it),
										transform: `translate(-50%, -50%) rotate(${
											it.rotation || 0
										}deg)`,
									}}
									onPointerDown={(e) =>
										onPointerDownItem(e, it.id)
									}
								>
									<span className="fp-label">
										{it.type.replace(/_/g, ' ')}
									</span>
								</div>
							))}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default PlannerFloorPlan;