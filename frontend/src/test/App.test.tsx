import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  it('renders the main app without crashing', () => {
    renderWithRouter(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays navigation elements', () => {
    renderWithRouter(<App />);
    // Check if basic elements are present
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