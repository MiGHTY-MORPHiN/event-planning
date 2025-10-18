import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Upload,
  User,
  FileText,
  Mail,
  Calendar,
  Clock,
  Search,
  X,
  Trash2,
  Edit3,
  Download,
  DollarSign,
  Save,
  Plus,
} from "lucide-react";
import { auth, storage, db } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import "./VendorContract.css";
import Popup from "../general/popup/Popup.jsx";

// ... keep existing code (useDebounce hook) ...

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const VendorContract = ({ setActivePage }) => {
  // ... keep existing code (all state declarations) ...
  const [clients, setClients] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(null);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentReplacingContractId, setCurrentReplacingContractId] = useState(null);
  const [currentSignatureFields, setCurrentSignatureFields] = useState([]);
  const [finalPrices, setFinalPrices] = useState({});
  const [clientServices, setClientServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const cacheKey = `vendorClients_${auth.currentUser?.uid}`;
  const cacheTTL = 5 * 60 * 1000;

  const vendorId = auth.currentUser?.uid;

  // ... keep existing code (all helper functions) ...
  const fetchClientServices = useCallback(async (eventId, vendorId) => {
    if (!auth.currentUser) return [];
    setLoadingServices(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const url = `https://us-central1-planit-sdp.cloudfunctions.net/api/${vendorId}/${eventId}/services-for-contract`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch services: ${res.status}`);
      }
      const data = await res.json();
      return data.services || [];
    } catch (error) {
      console.error("Error fetching client services:", error);
      return [
        {
          id: "1",
          name: "Photography Package",
          description: "Wedding photography service",
        },
        {
          id: "2",
          name: "Videography Package",
          description: "Wedding videography service",
        },
        {
          id: "3",
          name: "Additional Hours",
          description: "Extended coverage time",
        },
      ];
    } finally {
      setLoadingServices(false);
    }
  }, []);

  const updateEventFinalPrices = useCallback(
    async (eventId, vendorId, pricesData) => {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        const url = `https://us-central1-planit-sdp.cloudfunctions.net/api/${vendorId}/${eventId}/update-final-prices`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ finalPrices: pricesData }),
        });
        if (!res.ok) {
          throw new Error(`Failed to update final prices: ${res.status}`);
        }
        console.log("Final prices updated successfully");
      } catch (error) {
        console.error("Error updating final prices:", error);
        throw error;
      }
    },
    []
  );

  const fetchContractFinalPrices = useCallback(async (eventId, vendorId) => {
    if (!auth.currentUser) return {};
    try {
      const token = await auth.currentUser.getIdToken();
      const url = `https://us-central1-planit-sdp.cloudfunctions.net/api/${eventId}/${vendorId}/contract-prices-final`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch contract prices: ${res.status}`);
      }
      const data = await res.json();
      return data.finalPrices || {};
    } catch (error) {
      console.error("Error fetching contract prices:", error);
      return {};
    }
  }, []);

  const loadContractsFromFirestore = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const vendorId = auth.currentUser.uid;
      const contractsData = [];
      const contractsRef = collection(db, "Event");
      const snapshot = await getDocs(contractsRef);
      for (const eventDoc of snapshot.docs) {
        const vendorContractsRef = collection(
          db,
          "Event",
          eventDoc.id,
          "Vendors",
          vendorId,
          "Contracts"
        );
        const vendorContractsSnapshot = await getDocs(vendorContractsRef);
        for (const doc of vendorContractsSnapshot.docs) {
          const contractData = { id: doc.id, ...doc.data() };
          const prices = await fetchContractFinalPrices(eventDoc.id, vendorId);
          contractData.finalPrices = prices;
          contractsData.push(contractData);
        }
      }
      setAllContracts(contractsData);
    } catch (error) {
      console.error("Error loading contracts:", error);
      setError("Failed to load contracts");
    }
  }, [fetchContractFinalPrices]);

  const fetchClients = useCallback(async () => {
    if (!auth.currentUser) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTTL) {
        setClients(data);
        setLoading(false);
        return;
      }
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const url = "https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/bookings";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch clients: ${res.status}`);
      }
      const data = await res.json();
      const formattedClients = (data.bookings || []).map((booking) => ({
        id: booking.eventId,
        eventId: booking.eventId,
        name: booking.client || "Unknown Client",
        email: booking.email || "No email provided",
        event: booking.eventName || "Unnamed Event",
        contractUrl: booking.contractUrl || null,
        firstuploaded: booking.firstuploaded || null,
        lastedited: booking.lastedited || null,
        status: booking.status || "pending",
      }));
      setClients(formattedClients);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: formattedClients,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cacheTTL]);

  // ... keep existing code (useEffect hooks) ...
  useEffect(() => {
    const initializeContracts = async () => {
      if (auth.currentUser) {
        await loadContractsFromFirestore();
        if (clients.length > 0) {
          const existingContracts = clients
            .filter((client) => client.contractUrl)
            .map((client) => ({
              id: uuidv4(),
              eventId: client.eventId,
              vendorId: auth.currentUser?.uid || "",
              clientName: client.name,
              clientEmail: client.email,
              eventName: client.event,
              contractUrl: client.contractUrl,
              googleApisUrl: client.contractUrl,
              fileName: client.contractUrl
                ? client.contractUrl.split("/").pop().split("?")[0]
                : "unknown.pdf",
              fileSize: 0,
              status: "active",
              firstuploaded: client.firstuploaded || null,
              lastedited: client.lastedited || null,
              finalPrices: {},
              signatureWorkflow: {
                isElectronic: false,
                workflowStatus: "completed",
                createdAt: new Date().toISOString(),
                sentAt: null,
                completedAt: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                reminderSettings: {
                  enabled: true,
                  frequency: 3,
                  maxReminders: 3,
                  lastReminderSent: null,
                },
              },
              signatureFields: [],
              signers: [],
              uploadHistory: client.firstuploaded
                ? [
                    {
                      uploadDate: client.firstuploaded,
                      fileName: "existing_contract",
                      fileSize: 0,
                      action: "existing_contract",
                    },
                  ]
                : [],
            }));

          setAllContracts((prev) => {
            const existingEventIds = prev.map((contract) => contract.eventId);
            const newContracts = existingContracts.filter(
              (contract) => !existingEventIds.includes(contract.eventId)
            );
            return [...prev, ...newContracts];
          });
        }
      }
    };
    if (clients.length > 0) {
      initializeContracts();
    }
  }, [clients, loadContractsFromFirestore]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      await fetchClients();
    });
    return () => unsubscribe();
  }, [fetchClients]);

  useEffect(() => {
    const handleStorageChange = () => {
      loadContractsFromFirestore();
    };
    window.addEventListener('contractUpdated', handleStorageChange);
    return () => window.removeEventListener('contractUpdated', handleStorageChange);
  }, [loadContractsFromFirestore]);

  // ... keep existing code (groupedContracts, counters, helper functions) ...
  const groupedContracts = useMemo(() => {
    const groups = {};
    allContracts.forEach((contract) => {
      if (!groups[contract.eventId]) {
        groups[contract.eventId] = [];
      }
      groups[contract.eventId].push(contract);
    });
    return groups;
  }, [allContracts]);

  const clientsWithContracts = useMemo(() => {
    const eventIdsWithContracts = new Set(allContracts.map((c) => c.eventId));
    return clients.filter((client) => eventIdsWithContracts.has(client.eventId));
  }, [clients, allContracts]);

  const uploadedCount = clientsWithContracts.length;
  const pendingCount = clients.length - uploadedCount;
  const eSignatureCount = allContracts.filter(
    (c) => c.signatureWorkflow?.isElectronic
  ).length;

  const createSignersFromFields = (signatureFields, clientInfo) => {
    const signers = new Map();
    signatureFields.forEach((field) => {
      if (!signers.has(field.signerEmail)) {
        signers.set(field.signerEmail, {
          id: uuidv4(),
          role: field.signerRole,
          name: field.signerRole === "client" ? clientInfo.name : "Vendor Name",
          email: field.signerEmail,
          status: "pending",
          accessToken: uuidv4(),
          accessCode: field.signerRole === "client" ? generateAccessCode() : null,
          invitedAt: null,
          accessedAt: null,
          signedAt: null,
          ipAddress: null,
          userAgent: null,
          declineReason: null,
        });
      }
    });
    return Array.from(signers.values());
  };

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createOrUpdateContractEntry = useCallback(
    async (
      eventId,
      contractUrl,
      fileName,
      fileSize,
      clientInfo,
      isUpdate = false,
      replacingContractId = null,
      signatureFields = [],
      finalPricesData = {}
    ) => {
      const vendorId = auth.currentUser?.uid || "";
      const currentTime = { seconds: Math.floor(Date.now() / 1000) };
      try {
        const contractId = uuidv4();

        const newContract = {
          id: contractId,
          eventId,
          vendorId,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          eventName: clientInfo.event,
          contractUrl,
          googleApisUrl: contractUrl,
          fileName,
          fileSize,
          status: "active",
          finalPrices: finalPricesData,
          signatureWorkflow: {
            isElectronic: signatureFields.length > 0,
            workflowStatus: signatureFields.length > 0 ? "draft" : "completed",
            createdAt: new Date().toISOString(),
            sentAt: null,
            completedAt: signatureFields.length === 0 ? new Date().toISOString() : null,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            reminderSettings: {
              enabled: true,
              frequency: 3,
              maxReminders: 3,
              lastReminderSent: null,
            },
          },
          signatureFields: signatureFields,
          signers: signatureFields.length > 0 ? createSignersFromFields(signatureFields, clientInfo) : [],
          auditTrail: [
            {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              action: "contract_created",
              actor: auth.currentUser?.email || "vendor",
              actorRole: "vendor",
              details: `Contract ${signatureFields.length > 0 ? "created with e-signature fields" : "uploaded as traditional contract"} with final pricing`,
              ipAddress: "system",
            },
          ],
          documentVersions: [
            {
              version: 1,
              type: "original",
              url: contractUrl,
              createdAt: new Date().toISOString(),
              description: "Original contract document",
            },
          ],
          firstuploaded: currentTime,
          lastedited: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
          uploadHistory: [
            {
              uploadDate: currentTime,
              fileName,
              fileSize,
              action: replacingContractId ? `replacement for ${replacingContractId}` : "initial_upload",
            },
          ],
        };

        const contractRef = doc(db, "Event", eventId, "Vendors", vendorId, "Contracts", contractId);
        await setDoc(contractRef, newContract);

        if (Object.keys(finalPricesData).length > 0) {
          await updateEventFinalPrices(eventId, vendorId, finalPricesData);
        }

        setAllContracts((prev) => [...prev, newContract]);

        setClients((prev) =>
          prev.map((c) =>
            c.eventId === eventId
              ? {
                  ...c,
                  contractUrl: contractUrl,
                  lastedited: currentTime,
                  firstuploaded: c.firstuploaded || currentTime,
                  signatureStatus: signatureFields.length > 0 ? "pending_signature" : "completed",
                }
              : c
          )
        );
        console.log(
          `${replacingContractId ? "Updated" : "New"} contract saved with${
            signatureFields.length > 0 ? " signature fields" : "out signature fields"
          } and final pricing:`,
          contractId
        );
        return contractId;
      } catch (error) {
        console.error("Error in contract management:", error);
        setError("Failed to save contract");
        return null;
      }
    },
    [updateEventFinalPrices]
  );

  const handleFileUpload = useCallback(
    async (eventId, file, replacingContractId = null, signatureFields = []) => {
      if (!auth.currentUser || !file) return;
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type. Please upload PDF, DOC, or DOCX files only.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size too large. Please upload files smaller than 10MB.");
        return;
      }

      const clientInfo = clients.find((c) => c.eventId === eventId);
      if (!clientInfo) {
        alert("Client information not found.");
        return;
      }

      setCurrentClient(clientInfo);
      setCurrentFile(file);
      setCurrentReplacingContractId(replacingContractId);
      setCurrentSignatureFields(signatureFields);

      const services = await fetchClientServices(eventId, vendorId);
      setClientServices(services);

      const initialPrices = {};
      services.forEach((service) => {
        initialPrices[service.id] = "";
      });
      setFinalPrices(initialPrices);

      setShowPricingModal(true);
    },
    [clients, fetchClientServices, vendorId]
  );

  const handlePricingSubmit = async () => {
    if (!currentFile || !currentClient) return;

    const emptyPrices = Object.values(finalPrices).some(
      (price) => price === "" || price === null || price === undefined
    );
    if (emptyPrices) {
      alert("Please enter final prices for all services.");
      return;
    }

    setUploading(currentClient.eventId);

    try {
      const vendorId = auth.currentUser.uid;
      const isUpdate = currentReplacingContractId !== null;
      const fileName = `Contracts/${currentClient.eventId}/${vendorId}/${uuidv4()}-${currentFile.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, currentFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const formattedPrices = {};
      Object.keys(finalPrices).forEach((serviceId) => {
        formattedPrices[serviceId] = parseFloat(finalPrices[serviceId]) || 0;
      });

      const contractId = await createOrUpdateContractEntry(
        currentClient.eventId,
        downloadUrl,
        currentFile.name,
        currentFile.size,
        currentClient,
        isUpdate,
        currentReplacingContractId,
        currentSignatureFields,
        formattedPrices
      );

      if (currentSignatureFields.length > 0) {
        alert("Contract uploaded successfully with final pricing! You can now send it for electronic signature.");
      } else {
        alert(isUpdate ? "Contract updated successfully with final pricing!" : "Contract uploaded successfully with final pricing!");
      }

      setShowPricingModal(false);
      setCurrentClient(null);
      setCurrentFile(null);
      setCurrentReplacingContractId(null);
      setCurrentSignatureFields([]);
      setFinalPrices({});
      setClientServices([]);

      return contractId;
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Failed to ${currentReplacingContractId ? "update" : "upload"} contract: ${err.message}`);
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteContract = useCallback(
    async (eventId, contractId) => {
      if (!auth.currentUser) {
        setError("User not authenticated");
        return;
      }
      if (!confirm(`Are you sure you want to delete this contract?`)) {
        return;
      }
      try {
        const vendorId = auth.currentUser.uid;
        const contractRef = doc(db, "Event", eventId, "Vendors", vendorId, "Contracts", contractId);
        await deleteDoc(contractRef);
        setAllContracts((prev) => {
          const updatedContracts = prev.filter((contract) => contract.id !== contractId);
          return updatedContracts;
        });
        setClients((prev) =>
          prev.map((c) => {
            if (c.eventId === eventId) {
              const remainingContracts = groupedContracts[eventId]?.filter((c) => c.id !== contractId) || [];
              return {
                ...c,
                contractUrl: remainingContracts.length > 0 ? remainingContracts[remainingContracts.length - 1].contractUrl : null,
                firstuploaded: remainingContracts.length > 0 ? c.firstuploaded : null,
                lastedited: remainingContracts.length > 0 ? c.lastedited : null,
              };
            }
            return c;
          })
        );
        alert("Contract deleted successfully!");
      } catch (err) {
        console.error("Delete error:", err);
        alert(`Failed to delete contract: ${err.message}`);
      }
    },
    [groupedContracts]
  );

  const handleSetupSignatures = (contract) => {
    localStorage.setItem('contractForSignature', JSON.stringify(contract));
    setActivePage('setup-signature');
  };

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.event.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [clients, debouncedSearchTerm]);

  const uploadedClients = useMemo(() => {
    const eventIdsWithContracts = new Set(allContracts.map((c) => c.eventId));
    return filteredClients.filter((client) => eventIdsWithContracts.has(client.eventId));
  }, [filteredClients, allContracts]);

  const pendingClients = useMemo(() => {
    const eventIdsWithContracts = new Set(allContracts.map((c) => c.eventId));
    return filteredClients.filter((client) => !eventIdsWithContracts.has(client.eventId));
  }, [filteredClients, allContracts]);

  const getContractInfo = useCallback((eventId) => groupedContracts[eventId] || [], [groupedContracts]);

  const viewContractDetails = useCallback((contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
    if (contract.fileName.toLowerCase().endsWith(".pdf")) {
      setIframeSrc(`${contract.contractUrl}#toolbar=1&navpanes=0&scrollbar=1`);
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getTotalContractValue = (finalPrices) => {
    if (!finalPrices || Object.keys(finalPrices).length === 0) return 0;
    return Object.values(finalPrices).reduce((sum, price) => sum + (parseFloat(price) || 0), 0);
  };

  const handleDownloadContract = (contractUrl, fileName) => {
    const link = document.createElement("a");
    link.href = contractUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ClientCard = React.memo(({ client }) => {
    const eventContracts = getContractInfo(client.eventId);

    return (
      <article className="vendor-client-card">
        <section className="vendor-client-info-section">
          <p>
            <User size={16} />
            {client.name}
          </p>
          <p>
            <Mail size={16} />
            {client.email}
          </p>
          <p>
            <Calendar size={16} />
            {client.event}
          </p>
        </section>

        <section className="vendor-upload-section">
          <label className="vendor-upload-btn">
            <Plus size={16} />
            Add Contract
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              disabled={uploading === client.eventId}
              onChange={(e) => e.target.files[0] && handleFileUpload(client.eventId, e.target.files[0])}
            />
          </label>
        </section>

        {eventContracts.length > 0 ? (
          <section className="vendor-contracts-list">
            {eventContracts.map((contract) => (
              <article key={contract.id} className="vendor-contract-item">
                <section className="vendor-contract-details">
                  <section className="vendor-contract-name-row">
                    <button
                      className="vendor-file-name-btn"
                      onClick={() => viewContractDetails(contract)}
                      title="Click to view contract details"
                    >
                      <FileText size={16} />
                      {contract.fileName}
                    </button>
                  </section>
                  <section className="vendor-contract-meta">
                    <span className="vendor-last-edited">
                      <Clock size={14} />
                      {new Date(contract.lastedited.seconds * 1000).toLocaleDateString()}
                    </span>
                    {contract.finalPrices && Object.keys(contract.finalPrices).length > 0 && (
                      <span className="vendor-contract-amount">
                        <DollarSign size={14} />
                        {formatCurrency(getTotalContractValue(contract.finalPrices))}
                      </span>
                    )}
                    <span className={`vendor-status-badge status-${contract.status}`}>
                      {contract.status}
                    </span>
                    {contract.signatureWorkflow?.isElectronic && (
                      <span className={`vendor-status-badge status-${contract.signatureWorkflow.workflowStatus}`}>
                        {contract.signatureWorkflow.workflowStatus.replace("_", " ")}
                      </span>
                    )}
                  </section>
                </section>

                <section className="vendor-contract-actions">
                  <button
                    className="vendor-btn-sign"
                    onClick={() => handleSetupSignatures(contract)}
                    title="Setup electronic signature"
                  >
                    <Edit3 size={14} />
                    E-Sign
                  </button>
                  <label className="vendor-btn-replace" title="Replace contract">
                    <Upload size={14} />
                    Replace
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      disabled={uploading === client.eventId}
                      onChange={(e) =>
                        e.target.files[0] && handleFileUpload(client.eventId, e.target.files[0], contract.id)
                      }
                    />
                  </label>
                  <button
                    className="vendor-btn-download"
                    onClick={() => handleDownloadContract(contract.contractUrl, contract.fileName)}
                    title="Download contract"
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    className="vendor-btn-delete"
                    onClick={() => handleDeleteContract(client.eventId, contract.id)}
                    title="Delete contract"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </section>
              </article>
            ))}
          </section>
        ) : (
          <p className="vendor-no-contracts">No contracts uploaded yet.</p>
        )}
      </article>
    );
  });

  if (loading) {
    return (
      <section className="vendor-loading-screen">
        <div className="vendor-spinner"></div>
        <p>Loading your clients...</p>
      </section>
    );
  }

  if (error) return <p className="vendor-error">{error}</p>;

  if (!clients.length) {
    return (
      <section className="vendor-contracts-page">
        <header className="vendor-contracts-header">
          <section className="vendor-header-left">
            <h1 className="vendor-contracts-title">Contract Management</h1>
            <p className="vendor-contracts-subtitle">Manage contracts and final pricing for your events and clients</p>
          </section>
        </header>
        <div className="vendor-empty-state">
          <FileText size={48} />
          <h2>No clients found</h2>
          <p>Your client contracts will appear here once you have bookings.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="vendor-contracts-page">
      <header className="vendor-contracts-header">
        <section className="vendor-header-left">
          <h1 className="vendor-contracts-title">Contract Management</h1>
          <p className="vendor-contracts-subtitle">Manage contracts and final pricing for your events and clients</p>
        </section>
        <section className="vendor-search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by client name, event name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vendor-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="vendor-clear-search">
              <X size={16} />
            </button>
          )}
        </section>
      </header>

      <section className="vendor-summary-grid">
        <article className="vendor-summary-card">
          <section className="vendor-summary-card-header">
            <section className="vendor-summary-icon blue">
              <FileText size={24} />
            </section>
          </section>
          <p className="vendor-summary-label">Total Contracts</p>
          <h2 className="vendor-summary-value">{allContracts.length}</h2>
          <p className="vendor-summary-subtext">Active contracts</p>
        </article>

        <article className="vendor-summary-card">
          <section className="vendor-summary-card-header">
            <section className="vendor-summary-icon green">
              <User size={24} />
            </section>
          </section>
          <p className="vendor-summary-label">Clients with Contracts</p>
          <h2 className="vendor-summary-value">{uploadedCount}</h2>
          <p className="vendor-summary-subtext">Contracts uploaded</p>
        </article>

        <article className="vendor-summary-card">
          <section className="vendor-summary-card-header">
            <section className="vendor-summary-icon yellow">
              <Clock size={24} />
            </section>
          </section>
          <p className="vendor-summary-label">Pending Contracts</p>
          <h2 className="vendor-summary-value">{pendingCount}</h2>
          <p className="vendor-summary-subtext">Awaiting upload</p>
        </article>

        <article className="vendor-summary-card">
          <section className="vendor-summary-card-header">
            <section className="vendor-summary-icon purple">
              <Edit3 size={24} />
            </section>
          </section>
          <p className="vendor-summary-label">E-Signature Ready</p>
          <h2 className="vendor-summary-value">{eSignatureCount}</h2>
          <p className="vendor-summary-subtext">Electronic signatures</p>
        </article>
      </section>

      {uploadedClients.length > 0 && (
        <section className="vendor-clients-section">
          <section className="vendor-section-header">
            <h2 className="vendor-section-title">
              <FileText size={20} />
              Clients with Contracts ({uploadedClients.length})
            </h2>
          </section>
          <section className="vendor-section-content">
            <section className="vendor-clients-list">
              {uploadedClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </section>
          </section>
        </section>
      )}

      {pendingClients.length > 0 && (
        <section className="vendor-clients-section" style={{ marginTop: '2rem' }}>
          <section className="vendor-section-header">
            <h2 className="vendor-section-title">
              <Clock size={20} />
              Clients Pending Contracts ({pendingClients.length})
            </h2>
          </section>
          <section className="vendor-section-content">
            <section className="vendor-clients-list">
              {pendingClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </section>
          </section>
        </section>
      )}

      {debouncedSearchTerm && filteredClients.length === 0 && (
        <section className="vendor-no-results">
          <Search size={48} />
          <h3>No contracts found</h3>
          <p>No contracts match "{debouncedSearchTerm}"</p>
        </section>
      )}

      {/* Pricing Modal */}
      <Popup isOpen={showPricingModal} onClose={() => setShowPricingModal(false)}>
        {currentClient && (
          <div className="vendor-pricing-modal">
            <div className="vendor-modal-header">
              <div className="vendor-modal-title-section">
                <h3>Set Final Pricing</h3>
                <p>Enter the final contracted prices for {currentClient.name}</p>
              </div>
              <button className="vendor-close-btn" onClick={() => setShowPricingModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="vendor-pricing-form">
              <div className="vendor-client-summary">
                <div>
                  <User size={16} />
                  <span>{currentClient.name}</span>
                </div>
                <div>
                  <Calendar size={16} />
                  <span>{currentClient.event}</span>
                </div>
              </div>

              <div className="vendor-services-pricing">
                <h4>Services & Final Pricing</h4>
                {loadingServices ? (
                  <div className="vendor-loading-services">
                    <div className="vendor-spinner-small"></div>
                    <span>Loading services...</span>
                  </div>
                ) : (
                  <div className="vendor-pricing-fields">
                    {clientServices.map((service) => (
                      <div key={service.id} className="vendor-price-field">
                        <div className="vendor-price-label">
                          <span className="vendor-service-name">{service.name}</span>
                          {service.description && (
                            <span className="vendor-service-description">{service.description}</span>
                          )}
                        </div>
                        <div className="vendor-price-input-container">
                          <span className="vendor-currency-icon">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={finalPrices[service.id] || ""}
                            onChange={(e) =>
                              setFinalPrices((prev) => ({
                                ...prev,
                                [service.id]: e.target.value,
                              }))
                            }
                            className="vendor-price-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="vendor-pricing-summary">
                  <div className="vendor-total-calculation">
                    <span className="vendor-total-label">Total Contract Value:</span>
                    <span className="vendor-total-amount">
                      {formatCurrency(
                        Object.values(finalPrices).reduce((sum, price) => sum + (parseFloat(price) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vendor-modal-footer">
              <button className="vendor-btn-secondary" onClick={() => setShowPricingModal(false)}>
                Cancel
              </button>
              <button className="vendor-btn-primary" onClick={handlePricingSubmit} disabled={loadingServices}>
                <Save size={16} />
                Save Final Pricing & Upload Contract
              </button>
            </div>
          </div>
        )}
      </Popup>

      {/* Contract Details Modal */}
      <Popup isOpen={showContractModal} onClose={() => setShowContractModal(false)}>
        {selectedContract && (
          <div className="vendor-contract-details-modal">
            <div className="vendor-modal-header">
              <div className="vendor-modal-title-section">
                <h3>Contract Details</h3>
                <div className="vendor-modal-quick-info">
                  <span className="vendor-file-name-display">{selectedContract.fileName}</span>
                  <span className={`vendor-status-badge status-${selectedContract.status}`}>
                    {selectedContract.status}
                  </span>
                  {selectedContract.signatureWorkflow?.isElectronic && (
                    <span className={`vendor-status-badge status-${selectedContract.signatureWorkflow.workflowStatus}`}>
                      {selectedContract.signatureWorkflow.workflowStatus}
                    </span>
                  )}
                </div>
              </div>
              <div className="vendor-modal-header-actions">
                <button
                  className="vendor-btn-download"
                  onClick={() => handleDownloadContract(selectedContract.contractUrl, selectedContract.fileName)}
                >
                  <Download size={16} />
                  Download
                </button>
                <button className="vendor-close-btn" onClick={() => setShowContractModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="vendor-modal-body">
              <div className="vendor-contract-viewer">
                {selectedContract.fileName.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={iframeSrc} title="Contract Document" />
                ) : (
                  <div className="vendor-unsupported-file">
                    <FileText size={48} />
                    <p>Preview not available for this file type.</p>
                    <p>Please download the file to view it.</p>
                  </div>
                )}
              </div>

              <div className="vendor-contract-info-panel">
                <div className="vendor-info-section">
                  <h4>Contract Information</h4>
                  <div className="vendor-info-grid">
                    <div className="vendor-info-item">
                      <label>Client Name</label>
                      <span>{selectedContract.clientName}</span>
                    </div>
                    <div className="vendor-info-item">
                      <label>Client Email</label>
                      <span>{selectedContract.clientEmail}</span>
                    </div>
                    <div className="vendor-info-item">
                      <label>Event Name</label>
                      <span>{selectedContract.eventName}</span>
                    </div>
                    <div className="vendor-info-item">
                      <label>File Name</label>
                      <span>{selectedContract.fileName}</span>
                    </div>
                    <div className="vendor-info-item">
                      <label>Last Updated</label>
                      <span>{new Date(selectedContract.lastedited.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedContract.finalPrices && Object.keys(selectedContract.finalPrices).length > 0 && (
                  <div className="vendor-info-section">
                    <h4>Pricing Breakdown</h4>
                    <div className="vendor-pricing-breakdown">
                      {Object.keys(selectedContract.finalPrices).map((serviceId) => {
                        const service = clientServices.find((s) => s.id === serviceId) || {
                          name: `Service ${serviceId}`,
                        };
                        return (
                          <div key={serviceId} className="vendor-price-item">
                            <span className="vendor-service-name">{service.name}</span>
                            <span className="vendor-price-value">
                              {formatCurrency(selectedContract.finalPrices[serviceId])}
                            </span>
                          </div>
                        );
                      })}
                      <div className="vendor-price-total">
                        <span className="vendor-total-label">Total:</span>
                        <span className="vendor-total-value">
                          {formatCurrency(getTotalContractValue(selectedContract.finalPrices))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedContract.signatureWorkflow?.isElectronic && (
                  <div className="vendor-info-section">
                    <h4>Signature Workflow</h4>
                    <div className="vendor-info-grid">
                      <div className="vendor-info-item">
                        <label>Workflow Status</label>
                        <span>{selectedContract.signatureWorkflow.workflowStatus}</span>
                      </div>
                      <div className="vendor-info-item">
                        <label>Created</label>
                        <span>{new Date(selectedContract.signatureWorkflow.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedContract.signatureWorkflow.sentAt && (
                        <div className="vendor-info-item">
                          <label>Sent for Signature</label>
                          <span>{new Date(selectedContract.signatureWorkflow.sentAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedContract.signatureWorkflow.completedAt && (
                        <div className="vendor-info-item">
                          <label>Completed</label>
                          <span>{new Date(selectedContract.signatureWorkflow.completedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Popup>
    </section>
  );
};

export default VendorContract;