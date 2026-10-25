import React, { useState } from 'react';
import { Copy, Check, Play, WrapText } from 'lucide-react';
import { CodeSandboxModal } from './CodeSandboxModal';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);

  const cleanLang = (language || 'text').toLowerCase();
  const canRun = ['html', 'js', 'javascript'].includes(cleanLang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="group relative my-4 rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-md overflow-hidden text-sm">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {language || 'code'}
          </span>

          <div className="flex items-center gap-2">
            {canRun && (
              <button
                onClick={() => setShowSandbox(true)}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition border border-emerald-500/30"
                title="Run in live sandbox"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Run</span>
              </button>
            )}

            <button
              onClick={() => setIsWrapped(!isWrapped)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                isWrapped
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300'
              }`}
              title="Toggle word wrap"
            >
              <WrapText className="h-3 w-3" />
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre
          className={`p-4 font-mono text-xs md:text-sm text-zinc-200 overflow-x-auto leading-relaxed ${
            isWrapped ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          }`}
        >
          <code>{code}</code>
        </pre>
      </div>

      {canRun && (
        <CodeSandboxModal
          isOpen={showSandbox}
          onClose={() => setShowSandbox(false)}
          code={code}
          language={cleanLang}
        />
      )}
    </>
  );
};
