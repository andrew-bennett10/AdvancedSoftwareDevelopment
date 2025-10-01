import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Account from './Account';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Account Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch.mockClear();
  });

  test('redirects to login if no user data in localStorage', () => {
    render(
      <BrowserRouter>
        <Account />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('renders Account Settings page when user is logged in', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    localStorage.setItem('userData', JSON.stringify(mockUser));

    render(
      <BrowserRouter>
        <Account />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Update Account Details')).toBeInTheDocument();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });
  });

  test('successfully updates account details', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    const updatedUser = {
      id: 1,
      username: 'newusername',
      email: 'newemail@example.com'
    };

    localStorage.setItem('userData', JSON.stringify(mockUser));

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: updatedUser })
    });

    // Mock window.alert
    window.alert = jest.fn();

    render(
      <BrowserRouter>
        <Account />
      </BrowserRouter>
    );

    await waitFor(() => {
      const updateButton = screen.getByText('Update Details');
      expect(updateButton).toBeInTheDocument();
    });

    const usernameInput = screen.getByPlaceholderText('Enter username');
    const emailInput = screen.getByPlaceholderText('Enter email');

    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    const updateButton = screen.getByText('Update Details');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:12343/update-account',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1,
            username: 'newusername',
            email: 'newemail@example.com'
          })
        })
      );
      expect(window.alert).toHaveBeenCalledWith('Account details updated successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  test('shows error when email already exists', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    localStorage.setItem('userData', JSON.stringify(mockUser));

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already exists' })
    });

    window.alert = jest.fn();

    render(
      <BrowserRouter>
        <Account />
      </BrowserRouter>
    );

    await waitFor(() => {
      const updateButton = screen.getByText('Update Details');
      expect(updateButton).toBeInTheDocument();
    });

    const updateButton = screen.getByText('Update Details');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Email already exists');
    });
  });
});

