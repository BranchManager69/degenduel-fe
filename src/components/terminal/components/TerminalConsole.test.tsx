// Test file to verify markdown rendering behavior
import { render } from '@testing-library/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

// Extract the exact markdown components from TerminalConsole.tsx
const markdownComponents = {
  // Style markdown elements for terminal
  p: ({ children }: any) => <span className="block mb-2">{children}</span>,
  strong: ({ children }: any) => <span className="text-purple-300 font-bold">{children}</span>,
  em: ({ children }: any) => <span className="text-cyan-300 italic">{children}</span>,
  h1: ({ children }: any) => <span className="text-mauve text-lg font-bold block mb-2">{children}</span>,
  h2: ({ children }: any) => <span className="text-mauve-light text-base font-bold block mb-1">{children}</span>,
  h3: ({ children }: any) => <span className="text-purple-300 font-semibold block mb-1">{children}</span>,
  ul: ({ children }: any) => <div className="ml-2 mb-2">{children}</div>,
  ol: ({ children }: any) => <div className="ml-2 mb-2">{children}</div>,
  li: ({ children }: any) => <div className="text-gray-300 mb-1">• {children}</div>,
  a: ({ children, href }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline"
    >
      {children}
    </a>
  ),
  code: ({ children }: any) => (
    <span className="bg-gray-800 text-green-400 px-1 rounded font-mono text-sm">
      {children}
    </span>
  ),
  blockquote: ({ children }: any) => (
    <div className="border-l-2 border-purple-500 pl-2 ml-2 text-gray-400 italic">
      {children}
    </div>
  ),
};

// Test component that mirrors MarkdownRenderer exactly
const TestMarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

describe('Markdown Rendering Test', () => {
  const testContent = `**DegenDuel** is a crypto trading and DeFi platform designed for traders who love competition, strategy, and real-time market action. Here's what you can do on DegenDuel:

- **Compete in Trading Contests:** Join or create trading duels with friends or the community and prove your trading skills.
- **Track Hot Tokens:** Follow trending cryptocurrencies and get real-time updates on price movements.
- **Analyze the Market:** Use powerful tools to monitor market stats, trading signals, and token performance.
- **Manage Your Portfolio:** View your portfolio summary, performance metrics, and transaction history all in one place.
- **Engage in Social Features:** Compare your performance with other users, check leaderboards, and watch live trading activity.

DegenDuel is all about making crypto trading fun, competitive, and social—while providing you with the data and tools to level up your trading game.

Want to learn more about a specific feature or get started with a contest? Let me know!`;

  it('should render bold text with purple-300 styling', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Find all bold elements
    const boldElements = container.querySelectorAll('span.text-purple-300.font-bold');
    
    // Should have multiple bold elements
    expect(boldElements.length).toBeGreaterThan(0);
    
    // Check specific bold text content
    const boldTexts = Array.from(boldElements).map(el => el.textContent);
    expect(boldTexts).toContain('DegenDuel');
    expect(boldTexts).toContain('Compete in Trading Contests:');
    expect(boldTexts).toContain('Track Hot Tokens:');
    expect(boldTexts).toContain('Analyze the Market:');
  });

  it('should render bullet points with correct styling', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Find all list items
    const listItems = container.querySelectorAll('div.text-gray-300.mb-1');
    
    // Should have 5 bullet points
    expect(listItems.length).toBe(5);
    
    // Each should start with bullet character
    Array.from(listItems).forEach(item => {
      expect(item.textContent?.startsWith('•')).toBe(true);
    });
  });

  it('should render paragraphs with correct structure', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Find paragraph elements
    const paragraphs = container.querySelectorAll('span.block.mb-2');
    
    // Should have multiple paragraphs
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('should render list container with correct styling', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Find list container
    const listContainer = container.querySelector('div.ml-2.mb-2');
    
    expect(listContainer).toBeInTheDocument();
  });

  it('should properly nest bold text within list items', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Find list items that contain bold text
    const listItems = container.querySelectorAll('div.text-gray-300.mb-1');
    
    let foundBoldInList = false;
    Array.from(listItems).forEach(item => {
      const boldInItem = item.querySelector('span.text-purple-300.font-bold');
      if (boldInItem) {
        foundBoldInList = true;
      }
    });
    
    expect(foundBoldInList).toBe(true);
  });

  it('should render the exact content structure expected', () => {
    const { container } = render(<TestMarkdownRenderer content={testContent} />);
    
    // Test for specific expected content patterns
    expect(container.textContent).toContain('DegenDuel is a crypto trading');
    expect(container.textContent).toContain('• Compete in Trading Contests:');
    expect(container.textContent).toContain('• Track Hot Tokens:');
    expect(container.textContent).toContain('Want to learn more about a specific feature');
  });
});