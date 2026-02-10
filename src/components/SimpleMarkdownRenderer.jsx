import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const SimpleMarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // LaTeX ve Format Temizliği
  let processedContent = content
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') 
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$')
    .replace(/(\s|$)rac\{/g, '$1\\frac{')
    .replace(/(\s|$)cdot/g, '$1\\cdot');

  return (
    <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed break-words overflow-x-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2 [&_.katex-display]:px-1 [&_.katex]:max-w-full">
      {/* [&>*:last-child]:mb-0 -> Son elemanın alt boşluğunu sıfırlar.
         overflow-x-auto -> Uzun formüllerin sayfayı bozmasını engeller, kutu içinde kaydırır.
      */}
      <ReactMarkdown
        children={processedContent}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Linkler
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
          ),
          // Kod blokları
          code: ({ node, inline, className, children, ...props }) => {
            return !inline ? (
              <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto my-2 text-xs">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-pink-500" {...props}>
                {children}
              </code>
            );
          },
          // Matematik blokları (P ve DIV içindeki taşmaları önlemek için)
          p: ({ children }) => (
            <p className="mb-2 overflow-x-auto">{children}</p>
          ),
          // Tablolar
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-left text-xs border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              {children}
            </td>
          ),
        }}
      />
    </div>
  );
};

export default SimpleMarkdownRenderer;
