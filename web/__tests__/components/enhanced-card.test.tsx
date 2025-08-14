import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/enhanced-card';

describe('Enhanced Card Components', () => {
  describe('Card', () => {
    it('renders with default styles', () => {
      render(
        <Card data-testid="card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl', 'border', 'bg-card');
    });

    it('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <Card ref={ref}>
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('handles interactive variant with hover effects', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <Card 
          variant="interactive" 
          onClick={handleClick}
          data-testid="interactive-card"
        >
          <CardContent>Interactive content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('interactive-card');
      expect(card).toHaveClass('cursor-pointer');
      
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies elevated variant styles', () => {
      render(
        <Card variant="elevated" data-testid="card">
          <CardContent>Elevated content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies outline variant styles', () => {
      render(
        <Card variant="outline" data-testid="card">
          <CardContent>Outline content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2');
    });

    it('applies ghost variant styles', () => {
      render(
        <Card variant="ghost" data-testid="card">
          <CardContent>Ghost content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-none', 'shadow-none');
    });

    it('applies different sizes correctly', () => {
      const { rerender } = render(
        <Card size="sm" data-testid="card">
          <CardContent>Small card</CardContent>
        </Card>
      );
      
      let card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4');
      
      rerender(
        <Card size="lg" data-testid="card">
          <CardContent>Large card</CardContent>
        </Card>
      );
      
      card = screen.getByTestId('card');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('CardHeader', () => {
    it('renders with correct structure', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="header">
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Test Title');
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Test Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders with muted text styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="description">
              Test description text
            </CardDescription>
          </CardHeader>
        </Card>
      );
      
      const description = screen.getByTestId('description');
      expect(description).toHaveTextContent('Test description text');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with proper padding', () => {
      render(
        <Card>
          <CardContent data-testid="content">
            Test content
          </CardContent>
        </Card>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveTextContent('Test content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with flex layout', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders full card with all components', () => {
      const handleAction = jest.fn();
      
      render(
        <Card variant="interactive" size="md">
          <CardHeader>
            <CardTitle>Donation Receipt</CardTitle>
            <CardDescription>Receipt for your generous donation</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Amount: $100.00</p>
            <p>Date: January 15, 2024</p>
          </CardContent>
          <CardFooter>
            <button onClick={handleAction}>Download PDF</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Donation Receipt');
      expect(screen.getByText('Receipt for your generous donation')).toBeInTheDocument();
      expect(screen.getByText('Amount: $100.00')).toBeInTheDocument();
      expect(screen.getByText('Date: January 15, 2024')).toBeInTheDocument();
      
      const button = screen.getByRole('button', { name: 'Download PDF' });
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation for interactive cards', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <Card 
          variant="interactive" 
          onClick={handleClick}
          tabIndex={0}
          data-testid="interactive-card"
        >
          <CardContent>Interactive content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('interactive-card');
      
      // Focus the card
      card.focus();
      expect(card).toHaveFocus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Press Space
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('provides proper heading hierarchy', () => {
      render(
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Main Title</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Second Title</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
      
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Main Title');
      expect(headings[1]).toHaveTextContent('Second Title');
    });

    it('supports ARIA attributes', () => {
      render(
        <Card aria-label="Donation card" role="article">
          <CardHeader>
            <CardTitle>Donation Information</CardTitle>
            <CardDescription>Details about your donation</CardDescription>
          </CardHeader>
          <CardContent>
            Donation content here
          </CardContent>
        </Card>
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Donation card');
    });
  });
});