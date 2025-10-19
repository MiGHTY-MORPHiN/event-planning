// src/tests/adminTests/AdminGate.test.jsx
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AdminGate from "../../pages/admin/AdminGate";
import { MemoryRouter } from "react-router-dom";

// Mock Firebase auth
const mockOnAuthStateChanged = vi.fn();
const mockGetIdToken = vi.fn();
vi.mock("../../firebase", () => ({
	auth: {
		onAuthStateChanged: (cb) => mockOnAuthStateChanged(cb),
	},
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

beforeEach(() => {
	vi.restoreAllMocks();
	mockOnAuthStateChanged.mockReset();
	mockGetIdToken.mockReset();
	mockNavigate.mockReset();
	global.fetch = vi.fn();
});

describe("AdminGate", () => {
	it("shows loading initially", () => {
		render(
			<MemoryRouter>
				<AdminGate />
			</MemoryRouter>
		);
		expect(screen.getByText(/checking your profile/i)).toBeInTheDocument();
	});

	it("redirects to admin home if profile exists", async () => {
		mockOnAuthStateChanged.mockImplementationOnce((cb) =>
			cb({ getIdToken: async () => "fake-token" })
		);
		global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });

		render(
			<MemoryRouter>
				<AdminGate />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/admin/home");
		});
	});

	it("shows error message if no user", async () => {
		mockOnAuthStateChanged.mockImplementationOnce((cb) => cb(null));

		render(
			<MemoryRouter>
				<AdminGate />
			</MemoryRouter>
		);

		expect(
			await screen.findByText(/could not verify admin status/i)
		).toBeInTheDocument();
	});

	it("shows error message on fetch failure", async () => {
		mockOnAuthStateChanged.mockImplementationOnce((cb) =>
			cb({ getIdToken: async () => "fake-token" })
		);
		global.fetch.mockRejectedValueOnce(new Error("Boom"));

		render(
			<MemoryRouter>
				<AdminGate />
			</MemoryRouter>
		);

		expect(
			await screen.findByText(/could not verify admin status/i)
		).toBeInTheDocument();
	});
});
