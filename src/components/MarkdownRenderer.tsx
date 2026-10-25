import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { InteractiveChart } from './InteractiveChart';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-zinc-200 text-sm md:text-[15px] leading-relaxed break-words space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code & Chart rendering
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1].toLowerCase() : '';
            const codeString = String(children).replace(/\n$/, '');

            if (lang === 'chart') {
              return <InteractiveChart rawJson={codeString} />;
            }

            const isMultiLine = codeString.includes('\n');
            if (lang || isMultiLine) {
              return <CodeBlock language={lang} code={codeString} />;
            }

            return (
              <code
                className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[13px] text-emerald-300 border border-zinc-700/40"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-sm">
                <table className="w-full border-collapse text-left text-xs md:text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300 font-semibold">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-zinc-800/60">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 text-zinc-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3.5 py-2.5 text-zinc-300">{children}</td>;
          },

          // Headers
          h1({ children }) {
            return (
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-6 mb-3 border-b border-zinc-800 pb-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-white mt-5 mb-2.5">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base md:text-lg font-semibold text-zinc-100 mt-4 mb-2">
                {children}
              </h3>
            );
          },

          // Paragraphs & Lists
          p({ children }) {
            return <p className="mb-2.5 leading-relaxed text-zinc-200">{children}</p>;
          },
          ul({ children }) {
            return <ul className="my-2.5 list-disc pl-5 space-y-1 text-zinc-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2.5 list-decimal pl-5 space-y-1 text-zinc-200">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-4 border-emerald-500 bg-zinc-900/60 py-2 px-4 rounded-r-lg italic text-zinc-300">
                {children}
              </blockquote>
            );
          },

          // External links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
              >
                <span>{children}</span>
                <ExternalLink className="h-3 w-3 inline" />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
