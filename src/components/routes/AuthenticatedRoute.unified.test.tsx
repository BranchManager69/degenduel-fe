import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthenticatedRoute } from './AuthenticatedRoute.unified';

// Mock authentication context
jest.mock('../../contexts/UnifiedAuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/UnifiedAuthContext');
  
  return {
    ...originalModule,
    useAuth: jest.fn(() => ({
      isAuthenticated: false,
      isLoading: false,
      user: null
    }))
  };
});

// Mock services
jest.mock('../../services', () => ({
  authService: {
    on: jest.fn(() => jest.fn()),
    checkAuth: jest.fn(),
    getUser: jest.fn()
  },
  AuthEventType: {
    AUTH_STATE_CHANGED: 'auth_state_changed'
  }
}));

describe('AuthenticatedRoute', () => {
  const useAuth = jest.requireMock('../../contexts/UnifiedAuthContext').useAuth;
  
  const ProtectedComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should show loading state when authentication is loading', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthenticatedRoute />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('should redirect to login page when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthenticatedRoute />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
  
  it('should render protected route when user is authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', username: 'testuser' }
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthenticatedRoute />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
  
  it('should store redirect path in localStorage when redirecting', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthenticatedRoute />}>
            <Route path="/protected" element={<ProtectedComponent />} />
          </Route>
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_redirect_path', '/protected');
  });
});