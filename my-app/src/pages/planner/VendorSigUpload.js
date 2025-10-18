/**
 * VendorSigUpload.js
 * Handles uploading vendor signatures to Firebase Storage
 * Integrates with SignatureAudit collection structure
 */

export const uploadVendorSignature = async (
  signatureDataURL,
  vendorName,
  vendorEmail,
  contractId,
  eventId,
  auth
) => {
  try {
    // Validate inputs
    if (!signatureDataURL || typeof signatureDataURL !== 'string') {
      throw new Error('Invalid signature data format');
    }

    if (!signatureDataURL.includes('data:image')) {
      throw new Error('Invalid signature data format: not a proper image data URL');
    }

    // Get auth token
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await auth.currentUser.getIdToken();

    // Convert data URL to blob
    const blob = dataURLtoBlob(signatureDataURL);

    if (!blob || blob.size === 0) {
      throw new Error('Signature blob is empty');
    }

    console.log('Uploading vendor signature, blob size:', blob.size);

    // Create FormData
    const formData = new FormData();
    formData.append('signature', blob, `vendor_signature_${Date.now()}.png`);

    // Upload to backend API
    const API_BASE = 'https://us-central1-planit-sdp.cloudfunctions.net/api';
    const response = await fetch(
      `${API_BASE}/vendor/contracts/${eventId}/${contractId}/vendor-signature/upload`,
      {
        method: 'POST',
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

    console.log('Vendor signature uploaded successfully:', data.downloadURL);

    // Return structured data matching SignatureAudit format
    return {
      // Firebase Storage URL (primary)
      signatureUrl: data.downloadURL,
      // Base64 backup
      signatureData: signatureDataURL,
      // Vendor details
      vendorName,
      vendorEmail,
      // Signature metadata
      signedAt: new Date().toISOString(),
      storageMethod: 'firebase',
      // Audit trail info
      fieldId: 'vendor_signature',
      signerRole: 'vendor',
      signerId: auth.currentUser.uid,
    };
  } catch (error) {
    console.error('Error uploading vendor signature:', error);
    throw error;
  }
};

/**
 * Converts a data URL to a Blob
 */
const dataURLtoBlob = (dataURL) => {
  try {
    if (!dataURL || typeof dataURL !== 'string') {
      throw new Error('Invalid data URL');
    }

    const arr = dataURL.split(',');

    // Extract MIME type
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';

    // Decode base64
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

/**
 * Prepares vendor signature for storage in contract document
 * Matches SignatureAudit structure
 */
export const prepareVendorSignatureForStorage = (uploadedSigData) => {
  if (!uploadedSigData.signatureUrl && !uploadedSigData.signatureData) {
    throw new Error('No signature data provided');
  }

  return {
    // Primary storage
    signatureUrl: uploadedSigData.signatureUrl || null,
    signatureData: uploadedSigData.signatureData || null,
    // Vendor details
    vendorName: uploadedSigData.vendorName,
    vendorEmail: uploadedSigData.vendorEmail,
    // Signature metadata
    signedAt: uploadedSigData.signedAt,
    storageMethod: uploadedSigData.storageMethod || 'firebase',
    // Audit trail
    fieldId: uploadedSigData.fieldId || 'vendor_signature',
    signerRole: uploadedSigData.signerRole || 'vendor',
  };
};

/**
 * Validates vendor signature data before saving
 */
export const validateVendorSignature = (signatureData) => {
  const errors = [];

  if (!signatureData) {
    errors.push('Signature data is missing');
  }

  if (
    !signatureData.signatureUrl &&
    !signatureData.signatureData
  ) {
    errors.push('No signature image data found');
  }

  if (!signatureData.vendorName || signatureData.vendorName.trim() === '') {
    errors.push('Vendor name is required');
  }

  if (!signatureData.vendorEmail || signatureData.vendorEmail.trim() === '') {
    errors.push('Vendor email is required');
  }

  if (!signatureData.signedAt) {
    errors.push('Signature timestamp is missing');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats vendor signature for display in certificate
 * Ensures correct data source prioritization
 */
export const getSignatureDisplaySource = (vendorSignature) => {
  if (!vendorSignature) {
    return null;
  }

  // Prefer Firebase Storage URL
  if (vendorSignature.signatureUrl) {
    return {
      src: vendorSignature.signatureUrl,
      source: 'firebase',
      alt: 'Vendor Signature (Firebase Storage)',
    };
  }

  // Fallback to base64
  if (vendorSignature.signatureData) {
    return {
      src: vendorSignature.signatureData,
      source: 'base64',
      alt: 'Vendor Signature (Embedded)',
    };
  }

  return null;
};