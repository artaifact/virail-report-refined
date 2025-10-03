import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Composant de test simple
const TestComponent = ({ onClick, children }: { onClick?: () => void; children?: React.ReactNode }) => {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={() => setCount(count + 1)} data-testid="counter">
        Count: {count}
      </button>
      <button onClick={onClick} data-testid="callback">
        Callback
      </button>
      {children}
    </div>
  );
};

describe('React Testing Library Integration', () => {
  it('should render components correctly', () => {
    render(<TestComponent />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByTestId('counter')).toBeInTheDocument();
    expect(screen.getByTestId('callback')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    render(<TestComponent />);
    
    const counterButton = screen.getByTestId('counter');
    expect(counterButton).toHaveTextContent('Count: 0');
    
    fireEvent.click(counterButton);
    expect(counterButton).toHaveTextContent('Count: 1');
    
    fireEvent.click(counterButton);
    expect(counterButton).toHaveTextContent('Count: 2');
  });

  it('should handle callbacks', () => {
    const handleClick = jest.fn();
    render(<TestComponent onClick={handleClick} />);
    
    const callbackButton = screen.getByTestId('callback');
    fireEvent.click(callbackButton);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render children correctly', () => {
    render(
      <TestComponent>
        <div data-testid="child">Child Content</div>
      </TestComponent>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should handle async operations', async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState<string | null>(null);
      
      React.useEffect(() => {
        setTimeout(() => {
          setData('Async Data');
        }, 100);
      }, []);
      
      return (
        <div>
          <div data-testid="loading">Loading...</div>
          {data && <div data-testid="data">{data}</div>}
        </div>
      );
    };

    render(<AsyncComponent />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Async Data')).toBeInTheDocument();
  });

  it('should handle form interactions', () => {
    const FormComponent = () => {
      const [value, setValue] = React.useState('');
      
      return (
        <form>
          <input
            data-testid="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter text"
          />
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </form>
      );
    };

    render(<FormComponent />);
    
    const input = screen.getByTestId('input');
    const submitButton = screen.getByTestId('submit');
    
    expect(input).toHaveValue('');
    
    fireEvent.change(input, { target: { value: 'test input' } });
    expect(input).toHaveValue('test input');
    
    expect(submitButton).toBeInTheDocument();
  });
});
