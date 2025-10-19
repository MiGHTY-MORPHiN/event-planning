/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Popup from "../../pages/general/popup/Popup.jsx"; // Adjust path if needed

describe("Popup Component (Simple Version)", () => {
	const mockOnClose = vi.fn();

	beforeEach(() => {
		// Reset the mock before each test
		mockOnClose.mockClear();
	});

	it("does not render when isOpen is false", () => {
		render(
			<Popup isOpen={false} onClose={mockOnClose}>
				<div>Test Content</div>
			</Popup>
		);
		// Check for absence of the overlay or content
		expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /close/i })
		).not.toBeInTheDocument();
		// Since no role='dialog', we check for the section element as a proxy if needed,
		// but checking for content is usually sufficient.
		expect(screen.queryByRole("region")).not.toBeInTheDocument(); // <section> defaults to region if no accessible name
	});

	it("renders when isOpen is true with content and close button", () => {
		render(
			<Popup isOpen={true} onClose={mockOnClose}>
				<div>Test Content</div>
			</Popup>
		);
		// Check for elements that *are* present in this version
		const section = screen.getByText("Test Content").closest("section"); // Find the <section>
		expect(section).toBeInTheDocument();
		expect(section).toHaveClass("popup-content"); // Verify class

		expect(screen.getByText("Test Content")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /close/i })
		).toBeInTheDocument(); // Default button text
	});

	it("calls onClose when close button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<Popup isOpen={true} onClose={mockOnClose}>
				<div>Test Content</div>
			</Popup>
		);

		await user.click(screen.getByRole("button", { name: /close/i }));
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	// The overlay click test needs adjustment as the handler isn't on the overlay div
	// In the simple version, clicking the overlay *won't* close the popup unless explicitly added.
	// This test assumes the overlay *should not* close the popup based on the provided code.
	it("does NOT call onClose when the overlay is clicked (based on provided code)", async () => {
		const user = userEvent.setup();
		render(
			<Popup isOpen={true} onClose={mockOnClose}>
				<div>Test Content</div>
			</Popup>
		);

		// Find the overlay element (the div with class popup-overlay)
		const section = screen.getByText("Test Content").closest("section");
		const overlay = section.parentElement;
		expect(overlay).toHaveClass("popup-overlay");

		// Click the overlay directly
		await user.click(overlay);
		expect(mockOnClose).not.toHaveBeenCalled(); // Should not close
	});

	it("stops event propagation when content area (<section>) is clicked", async () => {
		const user = userEvent.setup();
		// Mock a parent click handler to see if it fires
		const handleParentClick = vi.fn();

		render(
			<div onClick={handleParentClick} data-testid="parent-container">
				<Popup isOpen={true} onClose={mockOnClose}>
					<div>Test Content</div>
				</Popup>
			</div>
		);

		// Find the section element
		const section = screen.getByText("Test Content").closest("section");
		expect(section).toHaveClass("popup-content");

		// Click inside the section element
		await user.click(section);
		// The parent handler should NOT have been called because of stopPropagation
		expect(handleParentClick).not.toHaveBeenCalled();

		// Click on the content inside the section
		await user.click(screen.getByText("Test Content"));
		expect(handleParentClick).not.toHaveBeenCalled();
	});

	// Remove Escape key test as it's not implemented in the simple version
	// it("calls onClose when Escape key is pressed", async () => { ... });

	it("renders children content correctly", () => {
		render(
			<Popup isOpen={true} onClose={mockOnClose}>
				<h1>Custom Heading</h1>
				<p>Descriptive text</p>
				<button>Action</button>
			</Popup>
		);

		expect(
			screen.getByRole("heading", { name: /custom heading/i, level: 1 })
		).toBeInTheDocument();
		expect(screen.getByText("Descriptive text")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /action/i })
		).toBeInTheDocument();
	});

	// Remove ARIA attributes test as they are not present in the simple version
	// it("has appropriate ARIA attributes for accessibility", () => { ... });
});
