import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Safely parses text with LaTeX equations:
 * $$...$$ for block math
 * $...$ for inline math
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // First replace block equations: $$...$$
    let formatted = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, equation) => {
      try {
        return `<div class="my-2.5 overflow-x-auto py-1 text-center font-mono">${katex.renderToString(equation.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch {
        return `<code class="font-mono text-amber-300">$$${equation}$$</code>`;
      }
    });

    // Then replace inline equations: $...$
    formatted = formatted.replace(/\$([^\$\n]+?)\$/g, (_, equation) => {
      try {
        return `<span class="inline-block px-0.5 font-mono">${katex.renderToString(equation.trim(), {
          displayMode: false,
          throwOnError: false,
        })}</span>`;
      } catch {
        return `<code class="font-mono text-amber-300">$${equation}$</code>`;
      }
    });

    // Convert newlines to breaks where appropriate, preserving paragraph structure
    return formatted;
  }, [content]);

  return (
    <div
      className={`prose prose-invert max-w-none text-sm md:text-base leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
