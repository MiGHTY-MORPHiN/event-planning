import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../pages/Signup'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {...actual,
    useNavigate: () => mockNavigate,
  }
})
//

const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockGoogleAuthProvider = vi.fn()

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  GoogleAuthProvider: vi.fn(() => mockGoogleAuthProvider),
}))

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders signup form correctly', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^sign up with google$/i })).toBeInTheDocument()

    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  test('calls createUserWithEmailAndPassword and navigates on success', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }))

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@example.com',
        'password123'
      )
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  test('shows error if email is in the system', async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'alreadythere@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/account with this email already exists/i)
      ).toBeInTheDocument()
    })
  })

  test('shows error if password is too weak', async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/weak-password',
    })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'weakpassword@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: '123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/password should be at least 6 characters/i)
      ).toBeInTheDocument()
    })
  })

  test('calls Google signup and navigates on success', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({ user: { uid: '123' } })

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /^sign up with google$/i }))

    await waitFor(() => {
      expect(mockSignInWithPopup).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
