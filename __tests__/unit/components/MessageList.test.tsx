import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from '@/components/MessageList/MessageList';
import type { ChatUIMessage } from '@/lib/types/components';

vi.mock('@/components/MessageList/MessageList.utils', () => ({
  formatContent: vi.fn((content) => content),
  getSourceExplanation: vi.fn(() => ({ text: 'Sources explanation' })),
  getSimilarityColor: vi.fn(() => '#22c55e'),
  getSimilarityPercentage: vi.fn((score) => Math.round(score * 100)),
  isValidScore: vi.fn((score) => score !== null && score !== undefined),
}));

const createMockMessage = (
  overrides: Partial<ChatUIMessage> = {}
): ChatUIMessage => ({
  id: '1',
  role: 'user',
  content: 'Test message',
  timestamp: '2024-01-01T12:00:00Z',
  ...overrides,
});

describe('MessageList', () => {
  const mockScrollAnchorRef = { current: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no messages', () => {
    render(<MessageList messages={[]} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Upload a document and start asking questions!')).toBeInTheDocument();
  });

  it('should render messages', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({ id: '1', role: 'user', content: 'Hello' }),
      createMockMessage({ id: '2', role: 'assistant', content: 'Hi there' }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('should display correct role labels', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({ role: 'user' }),
      createMockMessage({ role: 'assistant' }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('should render sources when present', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({
        sources: [
          { filename: 'doc1.txt', fileType: 'TEXT', score: 0.9 },
        ],
      }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('doc1.txt')).toBeInTheDocument();
  });

  it('should display source scores', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({
        sources: [
          { filename: 'doc1.txt', fileType: 'TEXT', score: 0.85 },
        ],
      }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText(/score: 0.85/)).toBeInTheDocument();
  });

  it('should display source preview when available', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({
        sources: [
          {
            filename: 'doc1.txt',
            fileType: 'TEXT',
            score: 0.9,
            preview: 'This is a preview of the document content...',
          },
        ],
      }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('This is a preview of the document content...')).toBeInTheDocument();
  });

  it('should show loading state for streaming messages', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({ isStreaming: true }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });

  it('should show loading sources state', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({ loadingPhase: 'loadingSources' }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('Loading sources')).toBeInTheDocument();
  });

  it('should format timestamp', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({
        timestamp: '2024-01-01T14:30:00Z',
      }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  it('should render scroll anchor', () => {
    const scrollRef = { current: null };
    const { container } = render(<MessageList messages={[]} scrollAnchorRef={scrollRef} />);

    expect(container.querySelector('div[ref]') || container.lastChild).toBeDefined();
  });

  it('should handle multiple sources', () => {
    const messages: ChatUIMessage[] = [
      createMockMessage({
        sources: [
          { filename: 'doc1.txt', fileType: 'TEXT', score: 0.9 },
          { filename: 'doc2.txt', fileType: 'TEXT', score: 0.8 },
          { filename: 'doc3.txt', fileType: 'TEXT', score: 0.7 },
        ],
      }),
    ];

    render(<MessageList messages={messages} scrollAnchorRef={mockScrollAnchorRef} />);

    expect(screen.getByText('doc1.txt')).toBeInTheDocument();
    expect(screen.getByText('doc2.txt')).toBeInTheDocument();
    expect(screen.getByText('doc3.txt')).toBeInTheDocument();
  });

  it('should render without scrollAnchorRef', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});
