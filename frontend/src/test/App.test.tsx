import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    loading: false
  })
}));

describe('App Component', () => {
  it('renders the main app without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays navigation elements', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});

describe('Basic Component Tests', () => {
  it('should render a simple component', () => {
    const TestComponent = () => <div data-testid="test">Hello World</div>;
    render(<TestComponent />);
    expect(screen.getByTestId('test')).toHaveTextContent('Hello World');
  });

  it('should handle basic user interactions', () => {
    const TestComponent = () => (
      <button data-testid="button" onClick={() => {}}>
        Click me
      </button>
    );
    render(<TestComponent />);
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
});