import React, {
	useEffect,
	useState,
	useMemo,
	useCallback,
	useRef,
} from "react";
import {
	Calendar,
	User,
	FileText,
	Search,
	X,
	Edit3,
	Download,
	Trash2,
	Clock,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { auth } from "../../firebase";
import "./PlannerContract.css";
import Popup from "../general/popup/Popup.jsx";
import PlannerSignatureView from "./PlannerSignatureView";
import { createSignatureDetailsDocument, getUserIPAddress } from "./PlannerSigAttch.js";

const API_BASE = "https://us-central1-planit-sdp.cloudfunctions.net/api";

const useDebounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);
	return debouncedValue;
};

const PlannerContract = () => {
	const [contracts, setContracts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedContract, setSelectedContract] = useState(null);
	const [showSignModal, setShowSignModal] = useState(false);
	const [signatureData, setSignatureData] = useState({});
	const [isSaving, setIsSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);

	function formatDate(date) {
		if (!date) return "";

		if(typeof date === 'object' && typeof date._seconds === 'number' && typeof date._nanoseconds === 'number') {
			const jsDate = new Date( date._seconds * 1000 + date._nanoseconds / 1e6);
			return jsDate.toLocaleString();
		}

		if (date instanceof Date) {
			return date.toLocaleString();
		}

		if (typeof date === "string") {
			return new Date(date).toLocaleString();
		}

		return String(date);
	}

	const getAuthToken = async () => {
		if (!auth.currentUser) {
			throw new Error("User not authenticated");
		}
		return await auth.currentUser.getIdToken();
	};

	const fetchContracts = useCallback(async () => {
		if (!auth.currentUser) {
			setError("User not authenticated");
			setLoading(false);
			return;
		}

		try {
			const token = await getAuthToken();
			const response = await fetch(`${API_BASE}/planner/contracts`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch contracts: ${response.status}`);
			}

			const data = await response.json();
			console.log("Fetched contracts:", data.contracts);
			setContracts(data.contracts || []);
		} catch (err) {
			console.error("Error fetching contracts:", err);
			setError("Failed to load contracts: " + err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			if (!user) {
				setError("User not authenticated");
				setLoading(false);
				return;
			}
			await fetchContracts();
		});
		return () => unsubscribe();
	}, [fetchContracts]);

	const dataURLtoBlob = (dataURL) => {
		try {
			if (!dataURL || typeof dataURL !== 'string') {
				throw new Error('Invalid data URL');
			}

			const arr = dataURL.split(',');
			const mimeMatch = arr[0].match(/:(.*?);/);
			const mime = mimeMatch ? mimeMatch[1] : 'image/png';
			const bstr = atob(arr[1]);
			let n = bstr.length;
			const u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}
			return new Blob([u8arr], { type: mime });
		} catch (error) {
			console.error('Error converting data URL to blob:', error);
			throw new Error('Failed to process signature image: ' + error.message);
		}
	};

	const uploadSignature = async (fieldId, dataURL, contractId, eventId) => {
		try {
			const token = await getAuthToken();
			
			console.log('Uploading signature for fieldId:', fieldId);
			console.log('Data URL type:', typeof dataURL);
			console.log('Data URL preview:', dataURL ? dataURL.substring(0, 100) : 'null');
			
			if (!dataURL || typeof dataURL !== 'string') {
				throw new Error('Invalid signature data format: data is not a string');
			}

			if (!dataURL.includes('data:image')) {
				console.error('Invalid data URL format. Expected data:image/..., got:', dataURL.substring(0, 50));
				throw new Error('Invalid signature data format: not a proper image data URL');
			}

			const blob = dataURLtoBlob(dataURL);
			
			if (!blob || blob.size === 0) {
				throw new Error('Signature blob is empty');
			}

			console.log('Blob created successfully, size:', blob.size);

			const formData = new FormData();
			formData.append('signature', blob, `${fieldId}.png`);

			const response = await fetch(
				`${API_BASE}/planner/contracts/${eventId}/${contractId}/${fieldId}/signatures/upload`,
				{
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error || `Upload failed with status ${response.status}`
				);
			}

			const data = await response.json();
			return {
				url: data.downloadURL,
				metadata: {
					fieldId,
					signerId: auth.currentUser.uid,
					signerRole: 'client',
					contractId,
					eventId,
					signatureUrl: data.downloadURL,
					signedAt: new Date().toISOString(),
					userAgent: navigator.userAgent,
				}
			};
		} catch (error) {
			console.error('Error uploading signature:', error);
			throw error;
		}
	};

	const saveDraftSignature = useCallback(async (signatureDataParam) => {
		if (!selectedContract || Object.keys(signatureDataParam).length === 0) {
			setSaveStatus("No signatures to save");
			return;
		}

		setIsSaving(true);
		setSaveStatus("Saving draft...");

		try {
			const draftSignatures = {};

			for (const [fieldId, dataURL] of Object.entries(signatureDataParam)) {
				const savedSignature = await uploadSignature(
					fieldId,
					dataURL,
					selectedContract.id,
					selectedContract.eventId
				);
				draftSignatures[fieldId] = savedSignature;
			}

			const token = await getAuthToken();
			const response = await fetch(
				`${API_BASE}/planner/contracts/${selectedContract.id}/signatures/draft`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						eventId: selectedContract.eventId,
						vendorId: selectedContract.vendorId,
						signatures: draftSignatures,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to save draft: ${response.status}`);
			}

			const result = await response.json();

			setContracts((prev) =>
				prev.map((c) =>
					c.id === selectedContract.id
						? {
								...c,
								signatureFields: result.signatureFields,
								draftSignatures,
								lastedited: { seconds: Math.floor(Date.now() / 1000) },
						  }
						: c
				)
			);

			setSaveStatus("Draft saved successfully!");
			setTimeout(() => setSaveStatus(""), 3000);
		} catch (error) {
			console.error("Error saving draft signature:", error);
			setSaveStatus(`Failed to save draft: ${error.message}`);
			setTimeout(() => setSaveStatus(""), 3000);
		} finally {
			setIsSaving(false);
		}
	}, [selectedContract]);

	const sendSignedContract = async (signatureDataParam) => {
		if (!selectedContract) return;

		const requiredFields = selectedContract.signatureFields.filter(
			(f) => f.signerRole === "client" && f.required
		);
		const signedFieldIds = Object.keys(signatureDataParam);
		const missingRequired = requiredFields.filter(
			(f) => !signedFieldIds.includes(f.id)
		);

		if (missingRequired.length > 0) {
			alert(
				`Please sign all required fields: ${missingRequired
					.map((f) => f.label)
					.join(", ")}`
			);
			return;
		}

		setIsSaving(true);
		setSaveStatus("Finalizing signatures...");

		try {
			const finalSignatures = {};

			for (const [fieldId, data] of Object.entries(signatureDataParam)) {
				const field = selectedContract.signatureFields.find(f => f.id === fieldId);
				
				if (field && field.type === 'signature' && data && typeof data === 'string' && data.includes('data:image')) {
					const savedSignature = await uploadSignature(
						fieldId,
						data,
						selectedContract.id,
						selectedContract.eventId
					);
					finalSignatures[fieldId] = savedSignature;
				} else {
					finalSignatures[fieldId] = {
						url: data,
						metadata: {
							fieldId,
							signerId: auth.currentUser.uid,
							signerRole: "client",
							contractId: selectedContract.id,
							eventId: selectedContract.eventId,
							signedAt: new Date().toISOString(),
							userAgent: navigator.userAgent,
						},
					};
				}
			}

			const ipAddress = await getUserIPAddress();
			
			const signerInfo = {
				ipAddress: ipAddress,
				userAgent: navigator.userAgent,
				signedAt: new Date().toISOString(),
				signerName: selectedContract.clientName,
				signerEmail: selectedContract.clientEmail
			};

			const token = await getAuthToken();
			const response = await fetch(
				`${API_BASE}/planner/contracts/${selectedContract.id}/finalize`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						eventId: selectedContract.eventId,
						vendorId: selectedContract.vendorId,
						signatures: finalSignatures,
						signatureFields: selectedContract.signatureFields,
						signerInfo: signerInfo,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to finalize contract: ${response.status}`);
			}

			const result = await response.json();

			await fetch(
				`${API_BASE}/planner/contracts/${selectedContract.id}/confirm-services`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						eventId: selectedContract.eventId,
						vendorId: selectedContract.vendorId,
					}),
				}
			);

			setSaveStatus("Generating signature certificate...");

			const vendorSignature = selectedContract.vendorSignature || null;

			console.log('Vendor signature data:', vendorSignature);

			const signatureDoc = createSignatureDetailsDocument(
				selectedContract,
				signatureDataParam,
				signerInfo,
				vendorSignature
			);

			signatureDoc.download();

			setTimeout(() => {
				alert(
					`Successfully signed!\n\n` +
					`A signature details document has been downloaded.\n` +
					`You can print it to PDF and attach it to the contract:\n\n` +
					`1. Open the downloaded HTML file\n` +
					`2. Press Ctrl+P (or Cmd+P on Mac)\n` +
					`3. Select "Save as PDF"\n` +
					`4. Attach it to the original contract`
				);
			}, 500);

			setContracts((prev) =>
				prev.map((c) =>
					c.id === selectedContract.id
						? { ...c, ...result.contract }
						: c
				)
			);

			setShowSignModal(false);
			setSelectedContract(null);
			setSignatureData({});
			setSaveStatus("");

			await fetchContracts();
		} catch (err) {
			console.error("Error finalizing contract:", err);
			alert(`Failed to finalize contract: ${err.message}`);
			setSaveStatus(`Failed to finalize: ${err.message}`);
		} finally {
			setIsSaving(false);
		}
	};

	const deleteContract = useCallback(
		async (eventId, contractId, contractUrl, vendorId) => {
			if (!auth.currentUser) {
				setError("User not authenticated");
				return;
			}

			const confirmDelete = window.confirm(
				"Are you sure you want to delete this contract? This action cannot be undone."
			);
			if (!confirmDelete) return;

			try {
				const token = await getAuthToken();
				const response = await fetch(
					`${API_BASE}/planner/contracts/${contractId}?eventId=${eventId}&vendorId=${vendorId}&contractUrl=${encodeURIComponent(contractUrl)}`,
					{
						method: 'DELETE',
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (!response.ok) {
					throw new Error(`Failed to delete contract: ${response.status}`);
				}

				setContracts((prev) => prev.filter((c) => c.id !== contractId));
				setSaveStatus("Contract deleted successfully!");
				setTimeout(() => setSaveStatus(""), 5000);
			} catch (error) {
				console.error("Error deleting contract:", error);
				setError(`Failed to delete contract: ${error.message}`);
				setSaveStatus(`Failed to delete contract: ${error.message}`);
				setTimeout(() => setSaveStatus(""), 5000);
			}
		},
		[]
	);

	const loadDraftSignatures = useCallback((contract) => {
		if (contract.signatureFields) {
			const draftData = {};
			contract.signatureFields.forEach((field) => {
				if (field.draftSignature && !field.signed) {
					draftData[field.id] = field.draftSignature;
				}
			});
			setSignatureData(draftData);
		}
	}, []);

	const isContractSignedByClient = useCallback((contract) => {
		if (!contract.signatureFields || contract.signatureFields.length === 0) {
			return false;
		}

		const clientFields = contract.signatureFields.filter(
			field => field.signerRole === 'client'
		);

		if (clientFields.length === 0) {
			return false;
		}

		const allClientFieldsSigned = clientFields.every(field => field.signed === true);

		const workflowCompleted = contract.signatureWorkflow?.workflowStatus === 'completed';

		return allClientFieldsSigned && workflowCompleted;
	}, []);

	const getContractStatusDisplay = useCallback((contract) => {
		if (!contract.signatureWorkflow?.isElectronic) {
			return { text: 'Active', class: 'active' };
		}

		const status = contract.signatureWorkflow.workflowStatus;

		switch (status) {
			case 'draft':
				return { text: 'Draft', class: 'draft' };
			case 'sent':
				return { text: 'Pending Signature', class: 'pending' };
			case 'partially_signed':
				return { text: 'Partially Signed', class: 'partial' };
			case 'completed':
				return { text: 'Signed', class: 'completed' };
			default:
				return { text: 'Active', class: 'active' };
		}
	}, []);

	const groupedContracts = useMemo(() => {
		const groups = {};
		contracts.forEach((contract) => {
			if (!groups[contract.eventId]) {
				groups[contract.eventId] = {
					eventName: contract.eventName,
					eventDate: contract.eventDate,
					contracts: []
				};
			}
			groups[contract.eventId].contracts.push(contract);
		});
		return groups;
	}, [contracts]);

	const filteredEventIds = useMemo(() => {
		return Object.keys(groupedContracts).filter((eventId) => {
			const event = groupedContracts[eventId];
			return event.eventName
				.toLowerCase()
				.includes(debouncedSearchTerm.toLowerCase());
		});
	}, [groupedContracts, debouncedSearchTerm]);

	const totalContracts = contracts.length;
	const pendingContracts = contracts.filter(
		(c) => c.signatureWorkflow?.workflowStatus === "sent" || 
		       c.signatureWorkflow?.workflowStatus === "partially_signed"
	).length;
	const signedContracts = contracts.filter(
		(c) => isContractSignedByClient(c)
	).length;

	const handleDownloadContract = (contractUrl, fileName) => {
		const link = document.createElement("a");
		link.href = contractUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const EventCard = React.memo(({ eventId, eventData }) => {
		return (
			<article className="event-card">
				<section className="event-info">
					<p>
						<FileText size={16} /> {eventData.eventName}
					</p>
					<p>
						<Calendar size={16} /> {eventData.eventDate
							? formatDate(eventData.eventDate)
							: "No date"}
					</p>
				</section>
				<section className="contracts-list">
					{eventData.contracts.length === 0 ? (
						<p>No contracts for this event.</p>
					) : (
						eventData.contracts.map((contract) => {
							const isSigned = isContractSignedByClient(contract);
							const statusDisplay = getContractStatusDisplay(contract);
							
							return (
								<article key={contract.id} className="contract-item">
									<section className="contract-details">
										<section className="contract-name-row">
											<button
												className="file-name-btn"
												onClick={() => {
													setSelectedContract(contract);
													loadDraftSignatures(contract);
													setShowSignModal(true);
												}}
												title="View and sign contract"
											>
												{contract.fileName}
											</button>
										</section>
										<section className="contract-meta">
											<span className="last-edited">
												Last edited: {contract.lastedited?.seconds
													? new Date(
															contract.lastedited.seconds * 1000
													  ).toLocaleDateString()
													: "Unknown"}
											</span>
											<span className={`status-badge status-${statusDisplay.class}`}>
												{statusDisplay.text}
											</span>
										</section>
									</section>
									<section className="contract-actions">
										<button
											className="btn-sign"
											onClick={() => {
												setSelectedContract(contract);
												loadDraftSignatures(contract);
												setShowSignModal(true);
											}}
											title={isSigned ? "Contract already signed" : "Sign contract"}
											disabled={isSigned}
										>
											<Edit3 size={14} />
											{isSigned ? "Signed" : "Sign"}
										</button>
										<button
											className="btn-download"
											onClick={() =>
												handleDownloadContract(
													contract.contractUrl,
													contract.fileName
												)
											}
											title="Download contract"
										>
											<Download size={14} />
											Download
										</button>
										<button
											className="btn-delete"
											onClick={() =>
												deleteContract(
													contract.eventId,
													contract.id,
													contract.contractUrl,
													contract.vendorId
												)
											}
											title="Delete contract"
										>
											<Trash2 size={14} />
											Delete
										</button>
									</section>
								</article>
							);
						})
					)}
				</section>
			</article>
		);
	});

	if (loading) {
		return (
			<section className="loading-screen">
				<section className="spinner"></section>
				<p>Loading your contracts...</p>
			</section>
		);
	}

	if (error) {
		return <p className="error">{error}</p>;
	}

	if (contracts.length === 0) {
		return (
			<section className="contracts-page">
				<header className="contracts-header">
					<section className="header-left">
						<h1 className="contracts-title">Contract Management</h1>
						<p className="contracts-subtitle">Manage your vendor contracts!</p>
					</section>
				</header>
				<p className="no-events">No contracts found.</p>
			</section>
		);
	}

	return (
		<section className="contracts-page">
			<header className="contracts-header">
				<section className="header-left">
					<h1 className="contracts-title">Contract Management</h1>
					<p className="contracts-subtitle">Manage your vendor contracts!</p>
				</section>
				<section className="search-container">
					<Search size={20} />
					<input
						type="text"
						placeholder="Search by event name..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="search-input"
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm("")}
							className="clear-search"
						>
							<X size={16} />
						</button>
					)}
				</section>
			</header>

			<section className="summary-grid">
				<article className="summary-card">
					<section className="summary-card-header">
						<section className="summary-icon blue">
							<FileText size={24} />
						</section>
					</section>
					<p className="summary-label">Total Contracts</p>
					<h2 className="summary-value">{totalContracts}</h2>
					<p className="summary-subtext">Active contracts</p>
				</article>

				<article className="summary-card">
					<section className="summary-card-header">
						<section className="summary-icon yellow">
							<Clock size={24} />
						</section>
					</section>
					<p className="summary-label">Pending Signatures</p>
					<h2 className="summary-value">{pendingContracts}</h2>
					<p className="summary-subtext">Awaiting your signature</p>
				</article>

				<article className="summary-card">
					<section className="summary-card-header">
						<section className="summary-icon green">
							<CheckCircle size={24} />
						</section>
					</section>
					<p className="summary-label">Signed Contracts</p>
					<h2 className="summary-value">{signedContracts}</h2>
					<p className="summary-subtext">Completed contracts</p>
				</article>
			</section>

			<section className="events-section">
				<section className="section-header">
					<h2 className="section-title">
						<Calendar size={20} />
						Your Events ({filteredEventIds.length})
					</h2>
				</section>
				<section className="section-content">
					<section className="events-list">
						{filteredEventIds.map((eventId) => (
							<EventCard
								key={eventId}
								eventId={eventId}
								eventData={groupedContracts[eventId]}
							/>
						))}
					</section>
				</section>
			</section>

			{debouncedSearchTerm && filteredEventIds.length === 0 && (
				<section className="no-results">
					<p>No events found matching "{debouncedSearchTerm}"</p>
				</section>
			)}
			
			<Popup
				isOpen={showSignModal}
				onClose={() => {
					setShowSignModal(false);
					setSelectedContract(null);
					setSignatureData({});
					setSaveStatus("");
				}}
			>
				{selectedContract && (
					<PlannerSignatureView
						contract={selectedContract}
						onFinalize={sendSignedContract}
						onSaveDraft={saveDraftSignature}
						onClose={() => {
							setShowSignModal(false);
							setSelectedContract(null);
							setSignatureData({});
							setSaveStatus("");
						}}
					/>
				)}
			</Popup>

			{saveStatus && (
				<section className="toast-notification">
					{saveStatus}
				</section>
			)}
		</section>
	);
};

export default PlannerContract;
