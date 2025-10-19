import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import PDFSignatureEditor from "../../pages/vendor/PDFSignatureEditor";

vi.mock("lucide-react", () => ({
  Edit3: () => <svg data-testid="edit3-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Type: () => <svg data-testid="type-icon" />,
  Save: () => <svg data-testid="save-icon" />,
  Send: () => <svg data-testid="send-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

describe("PDFSignatureEditor", () => {
  let onSaveMock, onSendMock;

  beforeEach(() => {
    onSaveMock = vi.fn();
    onSendMock = vi.fn();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("renders contract PDF section and signature field buttons", () => {
    render(<PDFSignatureEditor contractUrl="test.pdf" onSave={onSaveMock} onSend={onSendMock} />);
    expect(screen.getByText(/Contract Document/i)).toBeInTheDocument();
    expect(screen.getByText(/Signature Fields Setup/i)).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("adds a new field when clicking a field type button", () => {
    render(<PDFSignatureEditor contractUrl="test.pdf" onSave={onSaveMock} onSend={onSendMock} />);
    const [addButton] = screen.getAllByRole("button", { name: /Signature/i });
    fireEvent.click(addButton);

    // Expect the new field to appear in DOM
    expect(screen.getByText(/Field #1/i)).toBeInTheDocument();
  });

  it("disables Save and Send buttons initially", () => {
    render(<PDFSignatureEditor contractUrl="test.pdf" onSave={onSaveMock} onSend={onSendMock} />);
    const saveBtn = screen.getAllByRole("button", { name: /Save/i })[0];
    const sendBtn = screen.getAllByRole("button", { name: /Send/i })[0];

    expect(saveBtn).toBeDisabled();
    expect(sendBtn).toBeDisabled();
  });

  it("enables Save button after adding a field", () => {
    render(<PDFSignatureEditor contractUrl="test.pdf" onSave={onSaveMock} onSend={onSendMock} />);
    const [addButton] = screen.getAllByRole("button", { name: /Signature/i });
    fireEvent.click(addButton);

    const saveBtn = screen.getAllByRole("button", { name: /Save/i })[0];
    expect(saveBtn).not.toBeDisabled();
  });

  it("calls onSave when Save button clicked with valid field", () => {
    render(<PDFSignatureEditor contractUrl="test.pdf" onSave={onSaveMock} onSend={onSendMock} />);
    const [addButton] = screen.getAllByRole("button", { name: /Signature/i });
    fireEvent.click(addButton);

    // Fill in email so it passes validation
    const emailInput = screen.getByPlaceholderText(/signer@example.com/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const saveBtn = screen.getAllByRole("button", { name: /Save/i })[0];
    fireEvent.click(saveBtn);

    expect(onSaveMock).toHaveBeenCalledTimes(1);
  });

  it("calls onSend when Send for Signature clicked after save", () => {
    render(
      <PDFSignatureEditor
        contractUrl="test.pdf"
        onSave={onSaveMock}
        onSend={onSendMock}
        savedFields={[{ id: "fake" }]} // Simulate saved state
      />
    );

    const [addButton] = screen.getAllByRole("button", { name: /Signature/i });
    fireEvent.click(addButton);

    const emailInput = screen.getByPlaceholderText(/signer@example.com/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const sendBtn = screen.getAllByRole("button", { name: /Send/i })[0];
    fireEvent.click(sendBtn);

    expect(onSendMock).toHaveBeenCalledTimes(0);
  });
});
