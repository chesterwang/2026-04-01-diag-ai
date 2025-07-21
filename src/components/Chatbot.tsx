'use client';

import { useChat } from '@ai-sdk/react';
import Link from 'next/link';
import { MermaidDiagram } from './MermaidDiagram';

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

// Component to render individual message parts including tool calls
function MessageRenderer({ message }: { message: any }) {
  // Debug logging to understand message structure
  if (message.role === 'assistant') {
    console.log('Assistant message:', {
      content: message.content,
      toolInvocations: message.toolInvocations,
      parts: message.parts,
      fullMessage: message
    });
  }
  const renderToolInvocation = (toolInvocation: any) => {
    const { toolName, args, state, result } = toolInvocation;

    return (
      <div key={toolInvocation.toolCallId} className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {toolName}
          </span>
          {state === 'call' && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
              <span>Running...</span>
            </div>
          )}
          {state === 'result' && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Complete</span>
          )}
        </div>

        {args && Object.keys(args).length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Parameters:</strong>
            <div className="mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
              {Object.entries(args).map(([key, value]) => (
                <div key={key} className="mb-1 last:mb-0">
                  <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                  {typeof value === 'object' && value !== null ? (
                    <pre className="inline-block whitespace-pre-wrap break-words text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="break-words">{String(value)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {state === 'result' && result && (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Result:</strong>
            <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border">
              {Array.isArray(result) ? (
                result.map((item: any, index: number) => (
                  <div key={index} className="mb-2 last:mb-0">
                    {item.type === 'text' ? (
                      <div className="whitespace-pre-wrap">{item.text}</div>
                    ) : (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="whitespace-pre-wrap">
                  {typeof result === 'string' ? result : (
                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessageParts = () => {
    // If the message has parts, render them
    if (message.parts && message.parts.length > 0) {
      return message.parts.map((part: any, index: number) => {
        switch (part.type) {
          case 'text':
            // Parse text for Mermaid diagrams
            const textParts = parseTextWithMermaid(part.text);
            return (
              <div key={index}>
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
          case 'tool-invocation':
            return renderToolInvocation(part.toolInvocation);
          default:
            return null;
        }
      });
    }

    // Fallback: render tool invocations and content separately
    const elements = [];

    if (message.toolInvocations && message.toolInvocations.length > 0) {
      elements.push(
        ...message.toolInvocations.map((toolInvocation: any) =>
          renderToolInvocation(toolInvocation)
        )
      );
    }

    if (message.content) {
      // Parse content for Mermaid diagrams
      const contentParts = parseTextWithMermaid(message.content);
      elements.push(
        <div key="content">
          {contentParts.map((contentPart, contentIndex) => {
            if (contentPart.type === 'mermaid') {
              return (
                <div key={contentIndex} className="my-4">
                  <MermaidDiagram chart={contentPart.content} />
                </div>
              );
            } else {
              return (
                <div key={contentIndex} className="whitespace-pre-wrap">
                  {contentPart.content}
                </div>
              );
            }
          })}
        </div>
      );
    }

    return elements.length > 0 ? elements : (
      message.content ? (
        <div>
          {parseTextWithMermaid(message.content).map((contentPart, contentIndex) => {
            if (contentPart.type === 'mermaid') {
              return (
                <div key={contentIndex} className="my-4">
                  <MermaidDiagram chart={contentPart.content} />
                </div>
              );
            } else {
              return (
                <div key={contentIndex} className="whitespace-pre-wrap">
                  {contentPart.content}
                </div>
              );
            }
          })}
        </div>
      ) : null
    );
  };

  return <>{renderMessageParts()}</>;
}

export function Chatbot() {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    status, 
    error, 
    reload, 
    stop 
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-950">
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
                  {status === 'submitted' ? 'Thinking...' : 'Typing...'}
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
              onClick={() => reload()}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium"
            >
              Retry
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
