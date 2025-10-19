/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoadingSpinner from "../../pages/general/loadingspinner/LoadingSpinner.jsx"; // Adjust path if needed

// Mock Lucide React icon
vi.mock("lucide-react", () => ({
	Loader: vi.fn(({ className }) => (
		<div data-testid="loader-icon" className={className}>
			Spinner Icon
		</div>
	)),
}));

describe("LoadingSpinner Component", () => {
	it("renders with default text", () => {
		render(<LoadingSpinner />);

		// Check container presence and role
		const container = screen.getByRole("status");
		expect(container).toBeInTheDocument();
		expect(container).toHaveClass("loading-spinner-container");

		// Check default text
		expect(screen.getByText("Loading...")).toBeInTheDocument();
		expect(container).toHaveAttribute("aria-label", "Loading...");

		// Check icon presence
		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
		expect(screen.getByTestId("loader-icon")).toHaveClass(
			"loading-spinner-icon"
		);
	});

	it("renders with custom text", () => {
		const customText = "Processing data...";
		render(<LoadingSpinner text={customText} />);

		// Check container presence and role
		const container = screen.getByRole("status");
		expect(container).toBeInTheDocument();

		// Check custom text
		expect(screen.getByText(customText)).toBeInTheDocument();
		expect(container).toHaveAttribute("aria-label", customText);
		expect(screen.getByText(customText)).toHaveClass(
			"loading-spinner-text"
		);

		// Check icon presence
		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
	});

	it("renders the content wrapper div", () => {
		render(<LoadingSpinner />);
		const contentWrapper = screen.getByText("Loading...").parentElement;
		expect(contentWrapper).toHaveClass("loading-spinner-content");
		expect(contentWrapper.children.length).toBe(2); // Icon and text
	});

	it("applies correct CSS classes", () => {
		render(<LoadingSpinner text="Testing classes" />);
		expect(screen.getByRole("status")).toHaveClass(
			"loading-spinner-container"
		);
		expect(screen.getByTestId("loader-icon")).toHaveClass(
			"loading-spinner-icon"
		);
		expect(screen.getByText("Testing classes")).toHaveClass(
			"loading-spinner-text"
		);
	});
});
