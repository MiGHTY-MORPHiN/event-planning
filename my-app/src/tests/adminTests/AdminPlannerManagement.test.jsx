import React from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PlannerManagement from "../../pages/admin/adminPlannerManagement/AdminPlannerManagement.jsx";

const mockPlanners = [
	{
		id: "p1",
		name: "Planner One",
		status: "active",
		email: "one@test.com",
		phone: "123",
		activeEvents: 2,
		eventHistoryCount: 5,
	},
	{
		id: "p2",
		name: "Planner Two",
		status: "suspended",
		email: "two@test.com",
		phone: "456",
		activeEvents: 0,
		eventHistoryCount: 3,
	},
];

vi.mock("firebase/auth", () => ({
	getAuth: () => ({
		currentUser: {
			uid: "admin1",
			getIdToken: vi.fn(() => Promise.resolve("mock-token")),
		},
	}),
}));

// Mock the Popup component to match the actual implementation
vi.mock("../../pages/admin/adminGeneralComponents/Popup.jsx", () => ({
	default: ({ isOpen, children, onClose }) =>
		isOpen ? (
			<div className="popup-overlay">
				<section className="popup-content">
					<button className="popup-close-button" onClick={onClose}>
						Close
					</button>
					{children}
				</section>
			</div>
		) : null,
}));

// Mock the events fetch
const mockEvents = [
	{
		id: "e1",
		name: "Test Event",
		status: "active",
		date: "2024-01-01",
		duration: 2,
		location: "Test Location",
		expectedGuestCount: 50,
		budget: 1000,
		eventCategory: "Wedding",
		theme: "Romantic",
		description: "Test event description",
	},
];

describe("PlannerManagement", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn((url) => {
			if (url.includes("/admin/planners")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockPlanners),
				});
			}
			if (url.includes("/admin/planner/") && url.includes("/events")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ events: mockEvents }),
				});
			}
			return Promise.resolve({
				ok: false,
				status: 404,
				statusText: "Not Found",
			});
		});
	});

	it("renders loading state initially", () => {
		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);
		expect(screen.getByText(/Loading planners/i)).toBeInTheDocument();
	});

	it("renders fetched planners", async () => {
		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);

		await waitFor(() => {
			// Use the correct class name that matches your component
			const plannerCards = screen.getAllByRole("article");
			expect(plannerCards).toHaveLength(2);

			const plannerNames = screen.getAllByRole("heading", { level: 4 });
			expect(plannerNames[0]).toHaveTextContent("Planner One");
			expect(plannerNames[1]).toHaveTextContent("Planner Two");
		});
	});

	it("filters planners by search term", async () => {
		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);

		await waitFor(() => {
			const plannerNames = screen.getAllByRole("heading", { level: 4 });
			expect(plannerNames[0]).toHaveTextContent("Planner One");
			expect(plannerNames[1]).toHaveTextContent("Planner Two");
		});

		fireEvent.change(
			screen.getByPlaceholderText(/Search by planner name/i),
			{
				target: { value: "Two" },
			}
		);

		await waitFor(() => {
			const plannerCards = screen.getAllByRole("heading", { level: 4 });
			expect(plannerCards).toHaveLength(1);
			expect(plannerCards[0]).toHaveTextContent("Planner Two");
		});
	});

	it("shows 'No planners found' when API returns empty", async () => {
		global.fetch.mockImplementation((url) => {
			if (url.includes("/admin/planners")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([]),
				});
			}
			return Promise.resolve({
				ok: false,
				status: 404,
			});
		});

		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(screen.getByText(/No planners found/i)).toBeInTheDocument();
		});
	});

	it("displays event details in popup when events are fetched", async () => {
		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(screen.getByText("Planner One")).toBeInTheDocument();
		});

		// Click View Details for the first planner
		const viewDetailsButtons = screen.getAllByText("View Details");
		fireEvent.click(viewDetailsButtons[0]);

		await waitFor(() => {
			// Check that event details are shown
			expect(screen.getByText("Test Event")).toBeInTheDocument();
			expect(screen.getByText(/50 guests/)).toBeInTheDocument();
			expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
			expect(screen.getByText("Wedding")).toBeInTheDocument();
			expect(screen.getByText("Romantic")).toBeInTheDocument();
			expect(
				screen.getByText("Test event description")
			).toBeInTheDocument();
		});
	});

	it("closes popup when close button is clicked", async () => {
		render(
			<MemoryRouter>
				<PlannerManagement />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(screen.getByText("Planner One")).toBeInTheDocument();
		});

		// Open popup
		const viewDetailsButtons = screen.getAllByText("View Details");
		fireEvent.click(viewDetailsButtons[0]);

		await waitFor(() => {
			expect(screen.getByText("Test Event")).toBeInTheDocument();
		});

		// Close popup
		const closeButton = screen.getByText("Close");
		fireEvent.click(closeButton);

		await waitFor(() => {
			// The popup content should no longer be visible
			expect(screen.queryByText("Test Event")).not.toBeInTheDocument();
		});
	});
});
