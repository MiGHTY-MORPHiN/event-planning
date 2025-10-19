import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect, beforeAll } from "vitest";


// --- Mock global functions ---
beforeAll(() => {
  global.alert = vi.fn();
  global.confirm = vi.fn(() => true);
  
  const mockContext = {
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(0)
    })),
    putImageData: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    lineDashOffset: 0,
    globalAlpha: 1,
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn()
  };

  window.HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
  window.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockdata');
});

beforeEach(() => {
  global.alert.mockClear();
  global.confirm.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

import PlannerSignatureView from "../../pages/planner/PlannerSignatureView";

const mockContract = {
  id: "contract123",
  contractUrl: "https://example.com/contract.pdf",
  eventId: "event123",
  fileName: "Wedding Contract.pdf",
  signedAt: null,
  signatureWorkflow: {
    workflowStatus: "sent",
    isElectronic: true
  },
  signatureFields: [
    {
      id: "field1",
      type: "signature",
      label: "Client Signature",
      required: true,
      signerRole: "client",
      signed: false,
      position: { width: 400, height: 100 }
    },
    {
      id: "field2",
      type: "initial",
      label: "Client Initial",
      required: true,
      signerRole: "client",
      signed: false
    },
    {
      id: "field3",
      type: "date",
      label: "Date Signed",
      required: true,
      signerRole: "client",
      signed: false
    },
    {
      id: "field4",
      type: "text",
      label: "Full Name",
      required: true,
      signerRole: "client",
      signed: false
    },
    {
      id: "field5",
      type: "checkbox",
      label: "I Agree",
      required: true,
      signerRole: "client",
      signed: false
    }
  ]
};

const mockCompletedContract = {
  ...mockContract,
  signatureWorkflow: {
    workflowStatus: "completed",
    isElectronic: true
  },
  signedAt: 1609459200000, // Jan 1, 2021
  signatureFields: []
};

describe("PlannerSignatureView", () => {
  const defaultProps = {
    contract: mockContract,
    onFinalize: vi.fn(),
    onSaveDraft: vi.fn(),
    onClose: vi.fn()
  };

  beforeEach(() => {
    defaultProps.onFinalize.mockClear();
    defaultProps.onSaveDraft.mockClear();
    defaultProps.onClose.mockClear();
  });

  it("renders contract PDF viewer", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByTitle("Contract PDF")).toBeInTheDocument();
    expect(screen.getByTitle("Contract PDF")).toHaveAttribute(
      "src",
      expect.stringContaining(mockContract.contractUrl)
    );
  });

  it("displays all signature fields for client", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText("Client Signature")).toBeInTheDocument();
    expect(screen.getByText("Client Initial")).toBeInTheDocument();
    expect(screen.getByText("Date Signed")).toBeInTheDocument();
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("I Agree")).toBeInTheDocument();
  });

  it("marks required fields with asterisk", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const requiredStars = document.querySelectorAll(".required-star-planner");
    expect(requiredStars.length).toBe(5); // All fields are required
  });

  it("renders signature canvas for signature field", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("renders text input for initials field", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const initialsInput = screen.getByPlaceholderText("Enter your initials (e.g., JD)");
    expect(initialsInput).toBeInTheDocument();
    expect(initialsInput).toHaveAttribute("maxLength", "4");
  });

  it("handles initials input with uppercase conversion", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const initialsInput = screen.getByPlaceholderText("Enter your initials (e.g., JD)");
    fireEvent.change(initialsInput, { target: { value: "jd" } });

    expect(initialsInput.value).toBe("JD");
  });

  it("limits initials to 4 characters", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const initialsInput = screen.getByPlaceholderText("Enter your initials (e.g., JD)");
    fireEvent.change(initialsInput, { target: { value: "ABCDEFGH" } });

    expect(initialsInput.value).toBe("ABCD");
  });

  it("renders date field with Use Today button", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText("Use Today's Date")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Click 'Use Today' to set date")).toBeInTheDocument();
  });

  it("sets today's date when Use Today button is clicked", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const dateButton = screen.getByText("Use Today's Date");
    fireEvent.click(dateButton);

    const dateInput = screen.getByPlaceholderText("Click 'Use Today' to set date");
    expect(dateInput.value).toBeTruthy();
    expect(dateInput.value).toMatch(/\w+ \d+, \d{4}/); // Format: "Month Day, Year"
  });

  it("renders text input field", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    expect(textInput).toBeInTheDocument();
  });

  it("updates text field value", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    fireEvent.change(textInput, { target: { value: "John Doe" } });

    expect(textInput.value).toBe("John Doe");
  });

  it("displays character count for text field", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    fireEvent.change(textInput, { target: { value: "John Doe" } });

    expect(screen.getByText("8 characters")).toBeInTheDocument();
  });

  it("renders checkbox field", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText("I agree / I acknowledge this term")).toBeInTheDocument();
  });

  it("toggles checkbox state", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("displays progress indicator", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText(/Progress: \d+ of \d+ fields completed/)).toBeInTheDocument();
  });

  it("updates progress when fields are completed", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText("Progress: 0 of 5 fields completed")).toBeInTheDocument();

    const textInput = screen.getByPlaceholderText("Enter full name");
    fireEvent.change(textInput, { target: { value: "John Doe" } });

    expect(screen.getByText("Progress: 1 of 5 fields completed")).toBeInTheDocument();
  });

  it("disables Save Draft button when no fields completed", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const saveDraftButton = screen.getByText("Save Draft");
    expect(saveDraftButton).toBeDisabled();
  });

  it("enables Save Draft button when at least one field is completed", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    fireEvent.change(textInput, { target: { value: "John Doe" } });

    const saveDraftButton = screen.getByText("Save Draft");
    expect(saveDraftButton).not.toBeDisabled();
  });

  it("calls onSaveDraft when Save Draft button is clicked", async () => {
    defaultProps.onSaveDraft.mockResolvedValue();

    render(<PlannerSignatureView {...defaultProps} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    fireEvent.change(textInput, { target: { value: "John Doe" } });

    const saveDraftButton = screen.getByText("Save Draft");
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(defaultProps.onSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          field4: "John Doe"
        })
      );
    });
  });

  it("validates required fields on finalize", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const finalizeButton = screen.getByText("Finalize & Submit");
    fireEvent.click(finalizeButton);

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("Please complete all required fields")
    );
    expect(defaultProps.onFinalize).not.toHaveBeenCalled();
  });

  it("does not finalize when user cancels confirmation", () => {
    global.confirm.mockReturnValueOnce(false);

    render(<PlannerSignatureView {...defaultProps} />);

    // Fill all required fields
    fireEvent.change(screen.getByPlaceholderText("Enter your initials (e.g., JD)"), { target: { value: "JD" } });
    fireEvent.change(screen.getByPlaceholderText("Enter full name"), { target: { value: "John Doe" } });
    fireEvent.click(screen.getByText("Use Today's Date"));
    fireEvent.click(screen.getByRole("checkbox"));

    const finalizeButton = screen.getByText("Finalize & Submit");
    fireEvent.click(finalizeButton);

    expect(defaultProps.onFinalize).not.toHaveBeenCalled();
  });

  it("displays saving state during save draft", async () => {
    let resolveSave;
    const savePromise = new Promise(resolve => {
      resolveSave = resolve;
    });
    defaultProps.onSaveDraft.mockReturnValue(savePromise);

    render(<PlannerSignatureView {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Enter full name"), { target: { value: "John Doe" } });

    const saveDraftButton = screen.getByText("Save Draft");
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(saveDraftButton).toBeDisabled();
    });

    resolveSave();
  });

  it("handles save draft error gracefully", async () => {
    defaultProps.onSaveDraft.mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PlannerSignatureView {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Enter full name"), { target: { value: "John Doe" } });

    const saveDraftButton = screen.getByText("Save Draft");
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to save draft. Please try again.");
    });

    consoleSpy.mockRestore();
  });

  it("renders completed state when contract is already signed", () => {
    const props = {
      ...defaultProps,
      contract: mockCompletedContract
    };

    render(<PlannerSignatureView {...props} />);

    expect(screen.getByText("Contract Signed Successfully!")).toBeInTheDocument();
    expect(screen.getByText("This contract has been completed and signed.")).toBeInTheDocument();
    expect(screen.getByText(/Signed on:/)).toBeInTheDocument();
  });

  it("displays signed date in completed state", () => {
    const props = {
      ...defaultProps,
      contract: mockCompletedContract
    };

    render(<PlannerSignatureView {...props} />);

    expect(screen.getByText(/January 1, 2021/)).toBeInTheDocument();
  });

  it("calls onClose when Close button clicked in completed state", () => {
    const props = {
      ...defaultProps,
      contract: mockCompletedContract
    };

    render(<PlannerSignatureView {...props} />);

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("loads draft signatures from contract", () => {
    const contractWithDraft = {
      ...mockContract,
      signatureFields: [
        {
          id: "field4",
          type: "text",
          label: "Full Name",
          required: true,
          signerRole: "client",
          signed: false,
          draftSignature: "John Doe Draft"
        }
      ]
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithDraft} />);

    const textInput = screen.getByPlaceholderText("Enter full name");
    expect(textInput.value).toBe("John Doe Draft");
  });

  it("does not load draft signatures for already signed fields", () => {
    const contractWithSignedField = {
      ...mockContract,
      signatureFields: [
        {
          id: "field4",
          type: "text",
          label: "Full Name",
          required: true,
          signerRole: "client",
          signed: true,
          draftSignature: "Should Not Load"
        }
      ]
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithSignedField} />);

    expect(screen.queryByPlaceholderText("Enter full name")).not.toBeInTheDocument();
  });

  it("filters out vendor signature fields", () => {
    const contractWithVendorFields = {
      ...mockContract,
      signatureFields: [
        ...mockContract.signatureFields,
        {
          id: "vendorField",
          type: "signature",
          label: "Vendor Signature",
          required: true,
          signerRole: "vendor",
          signed: false
        }
      ]
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithVendorFields} />);

    expect(screen.queryByText("Vendor Signature")).not.toBeInTheDocument();
    expect(screen.getByText("Progress: 0 of 5 fields completed")).toBeInTheDocument(); // Still 5 client fields
  });

  it("displays legal notice", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText(/Legal Notice:/)).toBeInTheDocument();
    expect(screen.getByText(/electronic signature has the same legal effect/)).toBeInTheDocument();
  });

  it("displays canvas drawing hint", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText(/Draw your signature above/)).toBeInTheDocument();
  });

  it("displays initials input hint", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText(/Type your initials \(2-4 characters/)).toBeInTheDocument();
  });

  it("handles canvas mouse events for drawing", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    const ctx = canvas.getContext("2d");

    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    expect(ctx.beginPath).toHaveBeenCalled();

    // Continue drawing
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    expect(ctx.lineTo).toHaveBeenCalled();

    // Stop drawing
    fireEvent.mouseUp(canvas);
  });

  it("handles canvas touch events for mobile", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    const ctx = canvas.getContext("2d");

    // Start drawing
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 10, clientY: 10 }]
    });
    expect(ctx.beginPath).toHaveBeenCalled();

    // Continue drawing
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 20, clientY: 20 }]
    });

    // Stop drawing
    fireEvent.touchEnd(canvas);
  });

  it("clears canvas signature", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");

    // Draw something
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    // Clear should appear
    const clearButton = screen.getByText("Clear");
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    const ctx = canvas.getContext("2d");
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("displays field count in header", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    expect(screen.getByText(/configured 5 fields for you to complete/)).toBeInTheDocument();
  });

  it("uses singular form for single field", () => {
    const contractWithOneField = {
      ...mockContract,
      signatureFields: [mockContract.signatureFields[0]]
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithOneField} />);

    expect(screen.getByText(/configured 1 field for you to complete/)).toBeInTheDocument();
  });

  it("displays no fields message when no client fields", () => {
    const contractWithNoClientFields = {
      ...mockContract,
      signatureFields: []
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithNoClientFields} />);

    expect(screen.getByText("No signature fields require your attention.")).toBeInTheDocument();
    expect(screen.getByText(/vendor has not configured any fields/)).toBeInTheDocument();
  });

  it("initializes canvas with white background", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    const ctx = canvas.getContext("2d");

    expect(ctx.fillStyle).toBeTruthy();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("sets canvas dimensions from field position", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    expect(canvas).toHaveAttribute("width", "400");
    expect(canvas).toHaveAttribute("height", "100");
  });

  it("uses default dimensions when position not provided", () => {
    const contractWithoutPosition = {
      ...mockContract,
      signatureFields: [
        {
          ...mockContract.signatureFields[0],
          position: null
        }
      ]
    };

    render(<PlannerSignatureView {...defaultProps} contract={contractWithoutPosition} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    expect(canvas).toHaveAttribute("width", "400");
    expect(canvas).toHaveAttribute("height", "100");
  });

  it("formats date correctly", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    fireEvent.click(screen.getByText("Use Today's Date"));

    const dateInput = screen.getByPlaceholderText("Click 'Use Today' to set date");
    const dateValue = dateInput.value;

    // Should be in format like "January 1, 2024"
    expect(dateValue).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  });

  it("prevents drawing when mouse is not down", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");
    const ctx = canvas.getContext("2d");

    // Try to draw without mouseDown
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    // lineTo should not be called without starting drawing
    expect(ctx.lineTo).not.toHaveBeenCalled();
  });

  it("stops drawing when mouse leaves canvas", () => {
    render(<PlannerSignatureView {...defaultProps} />);

    const canvas = document.querySelector(".signature-canvas-planner");

    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

    // Leave canvas
    fireEvent.mouseLeave(canvas);

    // Try to continue drawing - should not work
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
  });

});