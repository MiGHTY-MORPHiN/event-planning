// src/tests/vendorTests/vendorApply.render.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import VendorApply from "../../pages/vendor/vendorApply";

// --- Mock useNavigate ---
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()), // must return a function
}));

// --- Mock firebase (optional but safe) ---
vi.mock("../../firebase", () => ({
  auth: { currentUser: null },
}));

describe("VendorApply Rendering", () => {
  it("renders all input fields", () => {
    render(<VendorApply />);
    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Profile Picture/i)).toBeInTheDocument();
  });

  it("renders category options in datalist", () => {
    render(<VendorApply />);
    const datalist = document.querySelector("#vendor-categories");
    expect(datalist).toBeInTheDocument();
    expect(datalist.querySelectorAll("option").length).toBeGreaterThan(0);
  });

  it("renders the submit button", () => {
    render(<VendorApply />);
    expect(
      screen.getByRole("button", { name: /Submit Application/i })
    ).toBeInTheDocument();
  });
});
