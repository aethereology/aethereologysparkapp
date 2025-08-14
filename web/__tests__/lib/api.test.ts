import { API_BASE_URL, downloadReceipt, sendReceiptEmail } from '../../lib/api';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement and related DOM methods
const mockClick = jest.fn();
const mockElement = {
  href: '',
  download: '',
  style: { display: '' },
  click: mockClick,
};
const mockCreateElement = jest.fn(() => mockElement);
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('API Library', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockClick.mockClear();
    mockCreateElement.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  describe('API_BASE_URL', () => {
    it('uses correct base URL', () => {
      expect(API_BASE_URL).toBe('http://localhost:8080');
    });
  });

  describe('downloadReceipt', () => {
    it('successfully downloads a receipt', async () => {
      const mockBlob = new Blob(['%PDF-1.4 test content'], { type: 'application/pdf' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      await downloadReceipt('TEST123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/donations/TEST123/receipt.pdf'
      );
      
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockElement.href).toBe('blob:mock-url');
      expect(mockElement.download).toBe('receipt-TEST123.pdf');
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockElement);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Donation not found' }),
      });

      await expect(downloadReceipt('NOTFOUND123')).rejects.toThrow('Donation not found');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/donations/NOTFOUND123/receipt.pdf'
      );
      
      // Should not create download elements on error
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(downloadReceipt('NETWORK123')).rejects.toThrow('Network error');
      
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('handles API errors without detail field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(downloadReceipt('ERROR123')).rejects.toThrow('HTTP error! status: 500');
    });

    it('validates donation ID format', async () => {
      await expect(downloadReceipt('')).rejects.toThrow('Invalid donation ID');
      await expect(downloadReceipt('   ')).rejects.toThrow('Invalid donation ID');
    });

    it('handles blob creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.reject(new Error('Blob creation failed')),
      });

      await expect(downloadReceipt('BLOB123')).rejects.toThrow('Blob creation failed');
    });
  });

  describe('sendReceiptEmail', () => {
    it('successfully sends receipt email', async () => {
      const mockResponse = {
        sent: true,
        recipient: 'test@example.com'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendReceiptEmail('EMAIL123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/donations/EMAIL123/receipt',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('handles email send failure from API', async () => {
      const mockResponse = {
        sent: false,
        recipient: 'test@example.com'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendReceiptEmail('FAILED123');
      expect(result).toEqual(mockResponse);
      expect(result.sent).toBe(false);
    });

    it('handles API errors for email sending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'No donor email on file' }),
      });

      await expect(sendReceiptEmail('NOEMAIL123')).rejects.toThrow('No donor email on file');
    });

    it('handles network errors for email sending', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(sendReceiptEmail('TIMEOUT123')).rejects.toThrow('Network timeout');
    });

    it('validates donation ID for email sending', async () => {
      await expect(sendReceiptEmail('')).rejects.toThrow('Invalid donation ID');
      await expect(sendReceiptEmail('   ')).rejects.toThrow('Invalid donation ID');
    });

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(sendReceiptEmail('JSON123')).rejects.toThrow('Invalid JSON');
    });

    it('handles missing response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await sendReceiptEmail('NULL123');
      expect(result).toBeNull();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('handles fetch returning null response', async () => {
      mockFetch.mockResolvedValueOnce(null);

      await expect(downloadReceipt('NULL123')).rejects.toThrow();
    });

    it('handles API response with malformed error object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve('not an object'),
      });

      await expect(downloadReceipt('MALFORMED123')).rejects.toThrow('HTTP error! status: 400');
    });

    it('handles donation ID with special characters', async () => {
      const validSpecialId = 'DON-2024_001';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' })),
      });

      await downloadReceipt(validSpecialId);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8080/api/v1/donations/${validSpecialId}/receipt.pdf`
      );
    });
  });

  describe('Browser Compatibility', () => {
    it('handles missing URL.createObjectURL', async () => {
      const originalCreateObjectURL = global.URL.createObjectURL;
      // @ts-ignore
      delete global.URL.createObjectURL;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' })),
      });

      await expect(downloadReceipt('COMPAT123')).rejects.toThrow();

      // Restore
      global.URL.createObjectURL = originalCreateObjectURL;
    });

    it('handles missing document.createElement', async () => {
      const originalCreateElement = document.createElement;
      // @ts-ignore
      delete document.createElement;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'application/pdf' })),
      });

      await expect(downloadReceipt('NODOM123')).rejects.toThrow();

      // Restore
      Object.defineProperty(document, 'createElement', {
        value: originalCreateElement,
        writable: true,
      });
    });
  });
});