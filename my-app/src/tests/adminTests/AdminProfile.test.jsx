/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, beforeEach, vi, expect, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// --- Mock child UI components ---
// Fix: Mock the actual LoadingSpinner component structure based on the DOM output
vi.mock("../../general/loadingspinner/LoadingSpinner.jsx", () => ({
	default: ({ text, variant, size }) => (
		<div
			aria-label={
				text ||
				(variant === "inline"
					? "Loading..."
					: "Loading your profile...")
			}
			className="loading-spinner-container"
			role="status"
			data-testid="loading-spinner"
			data-variant={variant}
			data-size={size}
		>
			<div className="loading-spinner-content">
				<svg
					aria-hidden="true"
					className="lucide lucide-loader loading-spinner-icon"
					fill="none"
					height="24"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					viewBox="0 0 24 24"
					width="24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M12 2v4" />
					<path d="m16.2 7.8 2.9-2.9" />
					<path d="M18 12h4" />
					<path d="m16.2 16.2 2.9 2.9" />
					<path d="M12 18v4" />
					<path d="m4.9 19.1 2.9-2.9" />
					<path d="M2 12h4" />
					<path d="m4.9 4.9 2.9 2.9" />
				</svg>
				<p className="loading-spinner-text">
					{text ||
						(variant === "inline"
							? "Loading..."
							: "Loading your profile...")}
				</p>
			</div>
		</div>
	),
}));

// --- Mock firebase modules ---
let mockUser = null;
vi.mock("../../firebase", () => {
	const mockAuth = {};
	return {
		auth: mockAuth,
		__dangerouslySetFirebaseMocks: (user) => {
			mockAuth.currentUser = user;
		},
	};
});
vi.mock("firebase/auth", () => ({
	getAuth: vi.fn(() => ({})),
	onAuthStateChanged: vi.fn((auth, callback) => {
		// Implementation will be set in beforeEach
		return vi.fn(); // Return unsubscribe function
	}),
}));

// --- Mock apiConfig ---
vi.mock("../../apiConfig", () => ({
	default: "http://mock-api.com",
}));

// Now import the component under test AFTER all module mocks
import AdminProfile from "../../pages/admin/adminProfile/AdminProfile.jsx";
import { onAuthStateChanged } from "firebase/auth";
import { __dangerouslySetFirebaseMocks } from "../../firebase";

// --- Global mocks ---
global.fetch = vi.fn();
global.console.error = vi.fn();
global.FileReader = class {
	constructor() {
		this.onload = null;
		this.onerror = null;
		this.result = null;
	}
	readAsDataURL(file) {
		if (this.onload) {
			this.result = "data:image/png;base64,mock-base64-data";
			this.onload({ target: { result: this.result } });
		}
	}
};

describe("AdminProfile", () => {
	const mockAdminData = {
		fullName: "Admin User",
		email: "admin@example.com",
		phone: "1234567890",
		profilePic: "http://mock-api.com/profile-pic.png",
	};

	beforeEach(() => {
		vi.clearAllMocks();

		const currentUser = {
			uid: "test-admin",
			getIdToken: vi.fn(() => Promise.resolve("mock-token")),
		};
		__dangerouslySetFirebaseMocks(currentUser);

		onAuthStateChanged.mockImplementation((auth, callback) => {
			// Simulate async auth state check
			setTimeout(() => callback(currentUser), 0);
			return vi.fn();
		});

		global.fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockAdminData),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		__dangerouslySetFirebaseMocks(null);
	});

	it("renders admin profile correctly in view mode", async () => {
		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		// Wait for loading to complete and check view mode content
		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(screen.getByText("Admin Profile")).toBeInTheDocument();
		expect(
			screen.getByText("Manage your personal information")
		).toBeInTheDocument();
		expect(screen.getByText("Admin User")).toBeInTheDocument();
		expect(screen.getByText("Administrator")).toBeInTheDocument();
		expect(screen.getByText("admin@example.com")).toBeInTheDocument();
		expect(screen.getByText("1234567890")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Edit Profile/i })
		).toBeInTheDocument();

		// Check profile image
		const profileImage = await screen.findByAltText("Your profile picture");
		expect(profileImage).toHaveAttribute(
			"src",
			expect.stringContaining("profile-pic.png")
		);
	});

	it("renders default avatar when no profile picture is provided", async () => {
		const adminDataWithoutPic = {
			...mockAdminData,
			profilePic: null,
		};

		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(adminDataWithoutPic),
		});

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		const profileImage = await screen.findByAltText("Your profile picture");
		expect(profileImage).toHaveAttribute("src", "/default-avatar.png");
	});

	it("shows 'Not provided' when phone number is missing", async () => {
		const adminDataWithoutPhone = {
			...mockAdminData,
			phone: null,
		};

		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(adminDataWithoutPhone),
		});

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(await screen.findByText("Not provided")).toBeInTheDocument();
	});

	it("switches to edit mode on button click", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		const editButton = await screen.findByRole("button", {
			name: /Edit Profile/i,
		});
		await user.click(editButton);

		expect(
			screen.getByRole("heading", { name: /Edit Profile/i })
		).toBeInTheDocument();
		expect(
			screen.getByText("Update your personal information")
		).toBeInTheDocument();
		expect(screen.getByLabelText(/Full Name/i)).toHaveValue("Admin User");
		expect(screen.getByLabelText(/Phone/i)).toHaveValue("1234567890");
		expect(screen.getByText("Change Picture")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Close & Cancel/i })
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Save Changes/i })
		).toBeInTheDocument();
	});

	it("handles form input changes in edit mode", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		const editButton = await screen.findByRole("button", {
			name: /Edit Profile/i,
		});
		await user.click(editButton);

		const nameInput = screen.getByLabelText(/Full Name/i);
		const phoneInput = screen.getByLabelText(/Phone/i);

		await user.clear(nameInput);
		await user.type(nameInput, "Updated Admin Name");

		await user.clear(phoneInput);
		await user.type(phoneInput, "9876543210");

		expect(nameInput).toHaveValue("Updated Admin Name");
		expect(phoneInput).toHaveValue("9876543210");
	});

	it("cancels edit mode without saving changes", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		const editButton = await screen.findByRole("button", {
			name: /Edit Profile/i,
		});
		await user.click(editButton);

		const nameInput = screen.getByLabelText(/Full Name/i);
		await user.clear(nameInput);
		await user.type(nameInput, "Temporary Change");

		await user.click(
			screen.getByRole("button", { name: /Close & Cancel/i })
		);

		// Should be back in view mode with original data
		expect(await screen.findByText("Admin User")).toBeInTheDocument();
		expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
	});

	it("saves changes, calls PUT, and returns to view mode", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		const editButton = await screen.findByRole("button", {
			name: /Edit Profile/i,
		});
		await user.click(editButton);

		const nameInput = screen.getByLabelText(/Full Name/i);
		await user.clear(nameInput);
		await user.type(nameInput, "Updated Admin");

		// Mock the PUT request and subsequent GET request
		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ message: "Update successful" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						...mockAdminData,
						fullName: "Updated Admin",
					}),
			});

		await user.click(screen.getByRole("button", { name: /Save Changes/i }));

		// Check that PUT was called with correct data
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"http://mock-api.com/admin/me",
				expect.objectContaining({
					method: "PUT",
					headers: {
						Authorization: "Bearer mock-token",
						"Content-Type": "application/json",
					},
					body: expect.stringContaining('"fullName":"Updated Admin"'),
				})
			);
		});

		// Should return to view mode with updated data
		expect(await screen.findByText("Updated Admin")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Save Changes/i })
		).not.toBeInTheDocument();
	});

	it("handles API errors when fetching profile", async () => {
		global.fetch.mockRejectedValueOnce(new Error("Network error"));

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(await screen.findByText("Network error")).toBeInTheDocument();
	});

	it("handles 403 forbidden error when fetching profile", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 403,
		});

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(
			await screen.findByText("Access Forbidden: You are not an admin.")
		).toBeInTheDocument();
	});

	it("shows error when no admin profile is found", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(null),
		});

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(
			await screen.findByText("Admin profile not found.")
		).toBeInTheDocument();
	});

	it("handles authentication state changes", async () => {
		// Test when user is not logged in
		onAuthStateChanged.mockImplementationOnce((auth, callback) => {
			setTimeout(() => callback(null), 0);
			return vi.fn();
		});

		render(
			<MemoryRouter>
				<AdminProfile />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("loading-spinner")
			).not.toBeInTheDocument();
		});

		expect(
			await screen.findByText("You must be logged in to view this page.")
		).toBeInTheDocument();
	});
});
