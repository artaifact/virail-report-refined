import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('should render button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(button).toHaveClass('h-10', 'px-4', 'py-2');
  });

  it('should render button with custom text', () => {
    render(<Button>Custom text</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom text' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Custom text');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled button' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should not handle clicks when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled button</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled button' });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  describe('variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      
      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>);
      
      const button = screen.getByRole('button', { name: 'Destructive' });
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button', { name: 'Link' });
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
    });
  });

  describe('sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default size</Button>);
      
      const button = screen.getByRole('button', { name: 'Default size' });
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small size</Button>);
      
      const button = screen.getByRole('button', { name: 'Small size' });
      expect(button).toHaveClass('h-9', 'rounded-md', 'px-3');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large size</Button>);
      
      const button = screen.getByRole('button', { name: 'Large size' });
      expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
    });

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>);
      
      const button = screen.getByRole('button', { name: 'Icon' });
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom class</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom class' });
    expect(button).toHaveClass('custom-class');
  });

  it('should handle type prop', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should handle other HTML button attributes', () => {
    render(<Button aria-label="Custom label" data-testid="test-button">Button</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('should render with children elements', () => {
    render(
      <Button>
        <span data-testid="icon">🚀</span>
        <span>Launch</span>
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🚀Launch');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should support asChild prop', () => {
    render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveTextContent('Ref button');
  });

  it('should handle focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Button onFocus={handleFocus} onBlur={handleBlur}>
        Focusable button
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'Focusable button' });
    
    fireEvent.focus(button);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(button);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events', () => {
    const handleKeyDown = jest.fn();
    
    render(<Button onKeyDown={handleKeyDown}>Keyboard button</Button>);
    
    const button = screen.getByRole('button', { name: 'Keyboard button' });
    
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('should apply focus-visible styles', () => {
    render(<Button>Focus button</Button>);
    
    const button = screen.getByRole('button', { name: 'Focus button' });
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring');
  });

  it('should have correct base classes', () => {
    render(<Button>Base button</Button>);
    
    const button = screen.getByRole('button', { name: 'Base button' });
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'whitespace-nowrap',
      'rounded-md',
      'text-sm',
      'font-medium'
    );
  });
});
