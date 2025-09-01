import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})


const mockSignInWithEmailAndPassword = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockSendPasswordResetEmail = vi.fn()
const mockGoogleAuthProvider = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  sendPasswordResetEmail: (...args) => mockSendPasswordResetEmail(...args),
  GoogleAuthProvider: vi.fn(() => mockGoogleAuthProvider),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in with google$/i })).toBeInTheDocument()
  })

  test('calls signInWithEmailAndPassword and navigates on successful login', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i })) // ✅ only the submit button

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })})

  test('shows error message on invalid credentials', async () => {
    mockSignInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/invalid-credential' })

    render(<MemoryRouter><Login /></MemoryRouter>)

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrong' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))

    await waitFor(() => {expect(screen.getByText(/invalid credential/i)).toBeInTheDocument()})
  })

  test('calls Google sign-in and navigates on success', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({ user: { uid: '123' } })

    render(<MemoryRouter><Login /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /^log in with google$/i })) // ✅ exact

    await waitFor(() => {
      expect(mockSignInWithPopup).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/home')
    })
  })

  test('handles forgot password flow when email is entered', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce()

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'reset@example.com' },
    })

    fireEvent.click(screen.getByText(/^forgot password\?$/i)) // ✅ exact match

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'reset@example.com')
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument()
    })
  })

  test('shows error if forgot password is clicked without email', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText(/^forgot password\?$/i)) 

    await waitFor(() => {
      expect(screen.getByText(/enter your email first/i)).toBeInTheDocument()
    })
  })
})
