import React, { useState } from 'react';
import { X, Play, RotateCcw, ExternalLink } from 'lucide-react';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [sandboxKey, setSandboxKey] = useState(0);

  if (!isOpen) return null;

  // Wrap code into full HTML document if not already full document
  let srcDoc = code;
  const isHtml = language.toLowerCase() === 'html';
  const isJs = ['javascript', 'js'].includes(language.toLowerCase());

  if (isJs) {
    srcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; padding: 20px; }
    #console { background: #18181b; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.5; border: 1px solid #27272a; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #10b981;">⚡ JavaScript Console Output:</div>
  <div id="console"></div>
  <script>
    const consoleDiv = document.getElementById('console');
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog(...args);
      consoleDiv.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
    };
    try {
      ${code}
    } catch (e) {
      consoleDiv.innerHTML += '<span style="color:#ef4444;">Error: ' + e.message + '</span>\\n';
    }
  </script>
</body>
</html>`;
  } else if (isHtml && !code.includes('<!DOCTYPE') && !code.includes('<html')) {
    srcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #09090b; color: #f4f4f5; font-family: system-ui, sans-serif; margin: 0; padding: 16px; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sandbox Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="text-sm font-semibold text-zinc-100">Live Code Sandbox</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSandboxKey((k) => k + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reload</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sandboxed iFrame Preview */}
        <div className="relative flex-1 bg-zinc-950">
          <iframe
            key={sandboxKey}
            title="Sandbox Output"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-modals"
            className="h-full w-full border-0 bg-zinc-950"
          />
        </div>
      </div>
    </div>
  );
};
