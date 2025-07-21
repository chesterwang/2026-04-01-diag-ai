'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize mermaid with secure configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
      pie: {
        useMaxWidth: true,
      },
      mindmap: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart.trim()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate a unique ID for this diagram
        const diagramId = id || `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear the element
        elementRef.current.innerHTML = '';
        
        // Validate and render the diagram
        const isValid = await mermaid.parse(chart);
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax');
        }

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, chart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          // Add responsive styling to the SVG
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Rendering diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Diagram Rendering Error
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
        <details className="mt-2">
          <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
            Show diagram source
          </summary>
          <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded border overflow-x-auto">
            <code>{chart}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="mermaid-diagram-container">
      <div 
        ref={elementRef} 
        className="mermaid-diagram bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto"
      />
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Mermaid Diagram</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(chart);
          }}
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Copy diagram source"
        >
          📋 Copy Source
        </button>
      </div>
    </div>
  );
}
