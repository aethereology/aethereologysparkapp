import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReceiptViewer from '../../components/receipt-viewer';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ReceiptViewer', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders initial state correctly', () => {
    render(<ReceiptViewer />);
    
    expect(screen.getByText('Donation Receipt Viewer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter donation ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view receipt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send receipt/i })).toBeInTheDocument();
  });

  it('handles donation ID input', async () => {
    const user = userEvent.setup();
    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    await user.type(input, 'TEST123');
    
    expect(input).toHaveValue('TEST123');
  });

  it('validates donation ID format', async () => {
    const user = userEvent.setup();
    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    // Test invalid characters
    await user.type(input, 'invalid@id!');
    await user.click(viewButton);
    
    expect(screen.getByText(/invalid donation id format/i)).toBeInTheDocument();
  });

  it('handles successful PDF receipt viewing', async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(['%PDF test content'], { type: 'application/pdf' });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock URL.createObjectURL
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    await user.type(input, 'VALID123');
    await user.click(viewButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/donations/VALID123/receipt.pdf'
      );
    });
    
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('handles PDF viewing errors', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Donation not found' }),
    });

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    await user.type(input, 'NOTFOUND123');
    await user.click(viewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error: donation not found/i)).toBeInTheDocument();
    });
  });

  it('handles successful email sending', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        sent: true, 
        recipient: 'test@example.com' 
      }),
    });

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const sendButton = screen.getByRole('button', { name: /send receipt/i });
    
    await user.type(input, 'EMAIL123');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/donations/EMAIL123/receipt',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText(/receipt sent successfully/i)).toBeInTheDocument();
    });
  });

  it('handles email sending errors', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'No donor email on file' }),
    });

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const sendButton = screen.getByRole('button', { name: /send receipt/i });
    
    await user.type(input, 'NOEMAIL123');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error: no donor email on file/i)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    await user.type(input, 'NETWORK123');
    await user.click(viewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows loading states during requests', async () => {
    const user = userEvent.setup();
    
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockReturnValueOnce(fetchPromise);

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    await user.type(input, 'LOADING123');
    await user.click(viewButton);
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(viewButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' })),
    });
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('allows clearing error messages', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not found' }),
    });

    render(<ReceiptViewer />);
    
    const input = screen.getByPlaceholderText('Enter donation ID');
    const viewButton = screen.getByRole('button', { name: /view receipt/i });
    
    // Trigger error
    await user.type(input, 'ERROR123');
    await user.click(viewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error: not found/i)).toBeInTheDocument();
    });
    
    // Clear input should clear error
    await user.clear(input);
    await user.type(input, 'NEW123');
    
    expect(screen.queryByText(/error: not found/i)).not.toBeInTheDocument();
  });
});