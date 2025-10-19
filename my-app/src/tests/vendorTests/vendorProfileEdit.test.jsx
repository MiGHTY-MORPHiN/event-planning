// src/tests/vendorTests/vendorProfileEdit.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import VendorProfileEdit from "../../pages/vendor/vendorProfileEdit";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));



// Mock Firebase auth
vi.mock("../../firebase", () => ({
  auth: { currentUser: { getIdToken: vi.fn() } },
}));

describe("VendorProfileEdit Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: logged in
    auth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue("fake-token"),
    };

    global.fetch = vi.fn();
  });

  it("renders form fields correctly", async () => {
    // Mock GET profile response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        description: "Test description",
        address: "123 Test St",
        phone: "1234567890",
        email: "test@example.com",
      }),
    });

    render(<VendorProfileEdit />);

    expect(await screen.findByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Profile Picture/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
  });

  it("submits updated profile successfully", async () => {
    // Mock GET profile response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        description: "Old description",
        address: "Old address",
        phone: "0000000000",
        email: "old@example.com",
      }),
    });

    // Mock PUT response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Updated successfully" }),
    });

    render(<VendorProfileEdit />);

    // Wait for initial fetch
    await screen.findByDisplayValue(/Old description/i);

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: "New description" } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "New address" } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: "1111111111" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "new@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    const successMessage = await screen.findByText((content) =>
      content.includes("Profile updated successfully")
    );
    expect(successMessage).toBeInTheDocument();
  });

  it("shows API error message on failed submission", async () => {
    // Mock GET profile response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        description: "Desc",
        address: "Addr",
        phone: "123",
        email: "email@test.com",
      }),
    });

    // Mock PUT failure
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "API error occurred" }),
    });

    render(<VendorProfileEdit />);
    await screen.findByDisplayValue(/Desc/i);

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    const errorMessage = await screen.findByText((content) =>
      content.includes("API error occurred")
    );
    expect(errorMessage).toBeInTheDocument();
  });

  it("handles profile picture upload", async () => {
    // Mock GET profile response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        description: "Desc",
        address: "Addr",
        phone: "123",
        email: "email@test.com",
      }),
    });

    // Mock PUT response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Updated successfully" }),
    });

    render(<VendorProfileEdit />);
    await screen.findByDisplayValue(/Desc/i);

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Profile Picture/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    const successMessage = await screen.findByText((content) =>
      content.includes("Profile updated successfully")
    );
    expect(successMessage).toBeInTheDocument();
  });
});
