'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MermaidDiagram } from './MermaidDiagram';

// Types for structured Mermaid response
interface MermaidResponse {
  mermaidCode: string;
  thinking: string;
  title: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  mermaidResponse?: MermaidResponse;
}

// Function to parse text and extract Mermaid code blocks
function parseTextWithMermaid(text: string) {
  const parts = [];
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = mermaidRegex.exec(text)) !== null) {
    // Add text before the mermaid block
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText.trim()) {
        parts.push({ type: 'text', content: beforeText });
      }
    }

    // Add the mermaid diagram
    parts.push({ type: 'mermaid', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last mermaid block
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  // If no mermaid blocks found, return the original text as a single part
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}

// Component to render individual message parts including structured responses
function MessageRenderer({ message }: { message: ChatMessage }) {
  // Handle user messages
  if (message.role === 'user') {
    return (
      <div className="whitespace-pre-wrap">
        {message.content}
      </div>
    );
  }

  // Handle assistant messages with structured Mermaid response
  if (message.role === 'assistant' && message.mermaidResponse) {
    const { mermaidCode, thinking, title } = message.mermaidResponse;

    return (
      <div className="space-y-4">
        {/* Thinking/Explanation Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              AI Reasoning
            </span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {thinking}
          </div>
        </div>

        {/* Mermaid Diagram Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {title}
            </h3>
          </div>
          <MermaidDiagram chart={mermaidCode} />
        </div>
      </div>
    );
  }

  // Fallback for regular text content
  if (message.content) {
    const textParts = parseTextWithMermaid(message.content);
    return (
      <div>
        {textParts.map((textPart, textIndex) => {
          if (textPart.type === 'mermaid') {
            return (
              <div key={textIndex} className="my-4">
                <MermaidDiagram chart={textPart.content} />
              </div>
            );
          } else {
            return (
              <div key={textIndex} className="whitespace-pre-wrap">
                {textPart.content}
              </div>
            );
          }
        })}
      </div>
    );
  }

  return null;
}

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content || '',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the structured response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value);
        }
      }

      // Extract JSON from response (handle cases where model adds extra text)
      let jsonResponse = fullResponse;

      // Remove any content before the first {
      const startIndex = fullResponse.indexOf('{');
      if (startIndex !== -1) {
        jsonResponse = fullResponse.substring(startIndex);
      }

      // Find the last } to get the complete JSON object
      const endIndex = jsonResponse.lastIndexOf('}');
      if (endIndex !== -1) {
        jsonResponse = jsonResponse.substring(0, endIndex + 1);
      }

      // Parse the JSON response
      const mermaidResponse: MermaidResponse = JSON.parse(jsonResponse);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        mermaidResponse,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen mx-auto bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mermaid AI Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and visualize diagrams with Mermaid syntax
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200
                     font-medium text-sm px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20
                     transition-colors duration-200"
          >
            ← Home
          </Link>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg mb-2">Welcome to Mermaid AI Assistant!</p>
            <p className="text-sm">
              I can help you create and visualize various types of diagrams using Mermaid syntax.
            </p>
            <div className="mt-4 text-xs space-y-1">
              <p>Try asking:</p>
              <p>"Create a flowchart for user login process"</p>
              <p>"Generate a sequence diagram for API calls"</p>
              <p>"Make a Gantt chart for project timeline"</p>
              <p>"Draw a class diagram for a user management system"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <MessageRenderer message={message} />
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Weather Assistant
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">
                  Generating diagram...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-red-800 dark:text-red-200 text-sm">
              Something went wrong. Please try again.
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading || error != null}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
                       font-medium transition-colors duration-200"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || error != null}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 
                       dark:disabled:bg-gray-600 text-white rounded-lg font-medium 
                       transition-colors duration-200 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
