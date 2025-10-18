import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Send } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import PDFSignatureEditor from "./PDFSignatureEditor";
import VendorSignatureCanvas from "./VendorSignatureCanvas";

const SetupElectronicSignature = ({ setActivePage }) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedFields, setSavedFields] = useState(null);
  const [vendorSignature, setVendorSignature] = useState(null);
  const [currentStep, setCurrentStep] = useState("setup");
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState(null);

  useEffect(() => {
    const contractData = localStorage.getItem("contractForSignature");
    if (contractData) {
      try {
        const parsed = JSON.parse(contractData);
        setContract(parsed);
        if (parsed.vendorSignature) {
          setVendorSignature(parsed.vendorSignature);
        }
      } catch (error) {
        console.error("Error parsing contract data:", error);
        setSignatureError("Failed to load contract data");
      }
    }
    setLoading(false);
  }, []);

  const createSignersFromFields = (signatureFields, clientInfo) => {
    const signers = new Map();

    signatureFields.forEach((field) => {
      if (!signers.has(field.signerEmail)) {
        signers.set(field.signerEmail, {
          id: uuidv4(),
          role: field.signerRole,
          name:
            field.signerRole === "client" ? clientInfo.name : "Vendor Name",
          email: field.signerEmail,
          status: "pending",
          accessToken: uuidv4(),
          accessCode:
            field.signerRole === "client" ? generateAccessCode() : null,
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

  const handleSaveSignatureFields = async (signatureFields) => {
    if (!contract) return;

    try {
      const contractRef = doc(
        db,
        "Event",
        contract.eventId,
        "Vendors",
        auth.currentUser.uid,
        "Contracts",
        contract.id
      );

      const signers = createSignersFromFields(signatureFields, {
        name: contract.clientName,
        email: contract.clientEmail,
      });

      await updateDoc(contractRef, {
        signatureFields: signatureFields,
        signers: signers,
        "signatureWorkflow.isElectronic": true,
        "signatureWorkflow.workflowStatus": "draft",
        auditTrail: [
          ...(contract.auditTrail || []),
          {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            action: "signature_fields_defined",
            actor: auth.currentUser?.email || "vendor",
            actorRole: "vendor",
            details: `${signatureFields.length} signature fields defined`,
            ipAddress: "system",
          },
        ],
        updatedAt: new Date().toISOString(),
      });

      setSavedFields(signatureFields);
      alert(
        "✅ Signature fields saved successfully!\n\nNow you need to sign the contract before sending it to the client."
      );
      setCurrentStep("vendor-sign");
    } catch (error) {
      console.error("Error saving signature fields:", error);
      alert("❌ Failed to save signature fields: " + error.message);
    }
  };

  const validateVendorSignature = (signatureData) => {
    const errors = [];

    if (!signatureData) {
      errors.push("Signature data is missing");
    }

    if (!signatureData.signatureData) {
      errors.push("No signature image data found");
    }

    if (!signatureData.vendorName || signatureData.vendorName.trim() === "") {
      errors.push("Vendor name is required");
    }

    if (!signatureData.vendorEmail || signatureData.vendorEmail.trim() === "") {
      errors.push("Vendor email is required");
    }

    if (!signatureData.signedAt) {
      errors.push("Signature timestamp is missing");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const dataURLtoBlob = (dataURL) => {
    try {
      if (!dataURL || typeof dataURL !== "string") {
        throw new Error("Invalid data URL");
      }

      const arr = dataURL.split(",");

      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/png";

      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error("Error converting data URL to blob:", error);
      throw new Error("Failed to process signature image: " + error.message);
    }
  };

  const uploadVendorSignature = async (signatureDataURL, vendorName, vendorEmail) => {
    try {
      if (!signatureDataURL || typeof signatureDataURL !== "string") {
        throw new Error("Invalid signature data format");
      }

      if (!signatureDataURL.includes("data:image")) {
        throw new Error("Invalid signature data format: not a proper image data URL");
      }

      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await auth.currentUser.getIdToken();

      const blob = dataURLtoBlob(signatureDataURL);

      if (!blob || blob.size === 0) {
        throw new Error("Signature blob is empty");
      }

      console.log("Uploading vendor signature, blob size:", blob.size);

      const formData = new FormData();
      formData.append("signature", blob, `vendor_signature_${Date.now()}.png`);

      const API_BASE = "https://us-central1-planit-sdp.cloudfunctions.net/api";
      const response = await fetch(
        `${API_BASE}/vendor/contracts/${contract.eventId}/${contract.id}/vendor-signature/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Vendor signature uploaded successfully:", data.downloadURL);

      return {
        signatureUrl: data.downloadURL,
        signatureData: signatureDataURL,
        vendorName,
        vendorEmail,
        signedAt: new Date().toISOString(),
        storageMethod: "firebase",
        fieldId: "vendor_signature",
        signerRole: "vendor",
      };
    } catch (error) {
      console.error("Error uploading vendor signature:", error);
      throw error;
    }
  };

  const handleVendorSignatureSave = async (vendorSigData) => {
    if (!contract) {
      setSignatureError("Contract data is missing");
      return;
    }

    try {
      setUploadingSignature(true);
      setSignatureError(null);

      console.log("Starting vendor signature upload with data:", {
        vendorName: vendorSigData.vendorName,
        vendorEmail: vendorSigData.vendorEmail,
        contractId: contract.id,
        eventId: contract.eventId,
      });

      const validation = validateVendorSignature(vendorSigData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const uploadedSig = await uploadVendorSignature(
        vendorSigData.signatureData,
        vendorSigData.vendorName,
        vendorSigData.vendorEmail
      );

      console.log("Vendor signature uploaded successfully:", uploadedSig);

      const preparedSig = {
        signatureUrl: uploadedSig.signatureUrl,
        signatureData: uploadedSig.signatureData,
        vendorName: uploadedSig.vendorName,
        vendorEmail: uploadedSig.vendorEmail,
        signedAt: uploadedSig.signedAt,
        storageMethod: uploadedSig.storageMethod,
        fieldId: uploadedSig.fieldId,
        signerRole: uploadedSig.signerRole,
      };

      console.log("Prepared signature for storage:", preparedSig);

      setVendorSignature(preparedSig);

      const contractRef = doc(
        db,
        "Event",
        contract.eventId,
        "Vendors",
        auth.currentUser.uid,
        "Contracts",
        contract.id
      );

      const updatedVendorSignature = {
        signatureUrl: preparedSig.signatureUrl,
        signatureData: preparedSig.signatureData,
        vendorName: preparedSig.vendorName,
        vendorEmail: preparedSig.vendorEmail,
        signedAt: preparedSig.signedAt,
        storageMethod: preparedSig.storageMethod,
        fieldId: preparedSig.fieldId,
        signerRole: preparedSig.signerRole,
      };

      await updateDoc(contractRef, {
        vendorSignature: updatedVendorSignature,
        "signatureWorkflow.vendorSignedAt": new Date().toISOString(),
        auditTrail: [
          ...(contract.auditTrail || []),
          {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            action: "vendor_signature_uploaded",
            actor: auth.currentUser?.email || "vendor",
            actorRole: "vendor",
            details: `Vendor signature uploaded - Storage: ${preparedSig.storageMethod}`,
            ipAddress: "system",
          },
        ],
        updatedAt: new Date().toISOString(),
      });

      console.log("Contract updated with vendor signature in Firestore");

      alert(
        "✅ Your signature has been saved successfully!\n\nYou can now send the contract to the client for signature."
      );
      setCurrentStep("ready");
    } catch (error) {
      console.error("Error saving vendor signature:", error);
      setSignatureError(error.message);
      alert("❌ Failed to save your signature: " + error.message);
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSendForSignature = async (signatureFields) => {
    if (!contract) return;

    if (!savedFields && signatureFields.length > 0) {
      alert("⚠️ Please save the signature fields first before sending.");
      return;
    }

    if (!vendorSignature) {
      alert("⚠️ Please sign the contract first before sending to client.");
      return;
    }

    try {
      const fieldsToSend = savedFields || signatureFields;

      const contractRef = doc(
        db,
        "Event",
        contract.eventId,
        "Vendors",
        auth.currentUser.uid,
        "Contracts",
        contract.id
      );

      const signers = createSignersFromFields(fieldsToSend, {
        name: contract.clientName,
        email: contract.clientEmail,
      });

      const updateData = {
        signatureFields: fieldsToSend,
        signers: signers,
        vendorSignature: {
          signatureUrl: vendorSignature.signatureUrl,
          signatureData: vendorSignature.signatureData,
          vendorName: vendorSignature.vendorName,
          vendorEmail: vendorSignature.vendorEmail,
          signedAt: vendorSignature.signedAt,
          storageMethod: vendorSignature.storageMethod,
          fieldId: vendorSignature.fieldId,
          signerRole: vendorSignature.signerRole,
        },
        "signatureWorkflow.isElectronic": true,
        "signatureWorkflow.workflowStatus": "sent",
        "signatureWorkflow.sentAt": new Date().toISOString(),
        "signatureWorkflow.vendorSignedAt": vendorSignature.signedAt,
        auditTrail: [
          ...(contract.auditTrail || []),
          {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            action: "vendor_signed",
            actor: auth.currentUser?.email || "vendor",
            actorRole: "vendor",
            details: "Vendor signed the contract",
            ipAddress: "system",
          },
          {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            action: "sent_for_signature",
            actor: auth.currentUser?.email || "vendor",
            actorRole: "vendor",
            details: "Contract sent for client signature",
            ipAddress: "system",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(contractRef, updateData);

      alert(
        "🎉 Contract sent for signature successfully!\n\nThe client will receive the contract for signing.\n\nYour vendor signature has been recorded."
      );

      window.dispatchEvent(new Event("contractUpdated"));

      localStorage.removeItem("contractForSignature");
      setActivePage("contracts");
    } catch (error) {
      console.error("Error sending contract for signature:", error);
      alert("❌ Failed to send contract for signature: " + error.message);
    }
  };

  const handleBack = () => {
    if (currentStep === "vendor-sign") {
      setCurrentStep("setup");
      return;
    }

    const confirmLeave = window.confirm(
      "Are you sure you want to go back? Any unsaved changes will be lost."
    );
    if (confirmLeave) {
      localStorage.removeItem("contractForSignature");
      setActivePage("contracts");
    }
  };

  if (loading) {
    return (
      <div className="setup-signature-loading">
        <div className="spinner"></div>
        <p>Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="setup-signature-error">
        <h2>Contract Not Found</h2>
        <p>Unable to load contract data. Please try again.</p>
        <button onClick={handleBack} className="btn-primary">
          <ArrowLeft size={16} />
          Back to Contracts
        </button>
      </div>
    );
  }

  return (
    <div className="setup-signature-page">
      <div className="setup-signature-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="header-info">
          <h1>
            {currentStep === "setup" && "Setup Electronic Signature"}
            {currentStep === "vendor-sign" && "Sign Contract"}
            {currentStep === "ready" && "Ready to Send"}
          </h1>
          <p className="contract-name">{contract.fileName}</p>
          <div className="contract-meta">
            <span>Client: {contract.clientName}</span>
            <span>•</span>
            <span>Event: {contract.eventName}</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div
            className={`step ${
              currentStep === "setup"
                ? "active"
                : currentStep !== "setup"
                ? "completed"
                : ""
            }`}
          >
            <span className="step-number">1</span>
            <span className="step-label">Setup Fields</span>
          </div>
          <div className="step-line"></div>
          <div
            className={`step ${
              currentStep === "vendor-sign"
                ? "active"
                : currentStep === "ready"
                ? "completed"
                : ""
            }`}
          >
            <span className="step-number">2</span>
            <span className="step-label">Sign</span>
          </div>
          <div className="step-line"></div>
          <div
            className={`step ${currentStep === "ready" ? "active" : ""}`}
          >
            <span className="step-number">3</span>
            <span className="step-label">Send</span>
          </div>
        </div>
      </div>

      {signatureError && (
        <div className="error-banner">
          <p>{signatureError}</p>
        </div>
      )}

      <div className="setup-signature-content">
        {currentStep === "setup" && (
          <PDFSignatureEditor
            contractUrl={contract.contractUrl}
            onSave={handleSaveSignatureFields}
            onSend={() => {}}
            savedFields={savedFields}
          />
        )}

        {currentStep === "vendor-sign" && (
          <VendorSignatureCanvas
            vendorName={
              auth.currentUser?.displayName || auth.currentUser?.email || "Vendor"
            }
            vendorEmail={auth.currentUser?.email || ""}
            onSave={handleVendorSignatureSave}
            onCancel={() => setCurrentStep("setup")}
            isUploading={uploadingSignature}
          />
        )}

        {currentStep === "ready" && savedFields && vendorSignature && (
          <div className="ready-to-send-section">
            <div className="ready-content">
              <h2>Ready to Send Contract</h2>
              <p>Your contract has been configured and you have signed it.</p>

              <div className="summary-box">
                <h3>Contract Summary</h3>
                <div className="summary-item">
                  <span className="label">Signature Fields:</span>
                  <span className="value">{savedFields.length}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Vendor Signature:</span>
                  <span className="value">✓ Signed</span>
                </div>
                <div className="summary-item">
                  <span className="label">Signature Storage:</span>
                  <span className="value">
                    {vendorSignature.storageMethod === "firebase"
                      ? "✓ Firebase Storage"
                      : "⚠ Base64 Embedded"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Client Email:</span>
                  <span className="value">{contract.clientEmail}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Signed At:</span>
                  <span className="value">
                    {new Date(vendorSignature.signedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="action-buttons-ready">
                <button
                  onClick={() => setCurrentStep("vendor-sign")}
                  className="btn-back-sign"
                  disabled={uploadingSignature}
                >
                  <ArrowLeft size={16} />
                  Back to Sign
                </button>
                <button
                  onClick={() => handleSendForSignature(savedFields)}
                  className="btn-send-contract"
                  disabled={uploadingSignature}
                >
                  <Send size={16} />
                  Send for Client Signature
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupElectronicSignature;