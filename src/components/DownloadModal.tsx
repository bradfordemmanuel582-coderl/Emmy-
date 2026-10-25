import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  FolderArchive,
  Terminal,
  Check,
  Share,
  PlusSquare,
  ExternalLink,
  Copy,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const directDownloadUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/project/download-zip`
      : '/api/project/download-zip';

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch('/api/project/download-zip');
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'legend-ai-assistant.zip';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 500);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.warn('Blob download encountered error, attempting direct navigation fallback:', err);
      // Fallback direct link trigger
      try {
        const link = document.createElement('a');
        link.href = directDownloadUrl;
        link.download = 'legend-ai-assistant.zip';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        setDownloadError(err.message || 'Download blocked by browser iframe');
      }
    } finally {
      setDownloadingZip(false);
    }
  };

  const copyDownloadUrl = () => {
    navigator.clipboard.writeText(directDownloadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyInstallCommands = () => {
    navigator.clipboard.writeText('npm install\nnpm run dev');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex h-auto max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Download Legend AI Assistant</h3>
              <p className="text-xs text-zinc-400">Install as an app or download the full source code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Iframe Notice & Open in New Tab Button */}
          {isInIframe && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div>
                    <strong className="text-blue-300 font-semibold">Running in AI Studio Preview:</strong>{' '}
                    <span className="text-zinc-300">
                      Web browsers block file downloads and app installation inside embedded preview panes.
                    </span>
                  </div>
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                  >
                    <span>Open App in New Tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Option 1: Install as PWA App on Phone or PC */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition hover:border-zinc-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 font-bold">
                  <Laptop className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Install as Standalone App</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                      PWA
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Install on Windows, Mac, Android, or iOS to run like a desktop/mobile app without browser bars.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              {isInstalled ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/30">
                  <Check className="h-4 w-4" />
                  <span>Legend AI Assistant is already installed on your device!</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={async () => {
                    const success = await install();
                    if (success) onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-500/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Install App to Desktop / Home Screen</span>
                </button>
              ) : isIOS ? (
                <div className="rounded-xl bg-zinc-900/90 p-3 text-xs text-zinc-300 space-y-1.5 border border-zinc-800">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>How to install on iPhone or iPad:</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Share className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>1. Tap the <strong>Share</strong> button in Safari's bottom bar.</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <PlusSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>2. Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 space-y-1.5">
                  <p>
                    Open the app in a full browser tab (or Chrome/Edge), then click the <strong>Install</strong> icon in the address bar (or menu <strong className="text-zinc-200">⋮ &gt; Cast, save, and share &gt; Install Legend AI Assistant</strong>).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Download Full Source Code ZIP */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 transition hover:border-zinc-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FolderArchive className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">
                    Download Full Source Code (.zip)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Download the complete codebase to run locally with Node.js.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                >
                  {downloadingZip ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Packaging ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download legend-ai-assistant.zip</span>
                    </>
                  )}
                </button>

                {/* Direct link fallback */}
                <a
                  href={directDownloadUrl}
                  download="legend-ai-assistant.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition w-full sm:w-auto"
                  title="Direct download link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Direct Link</span>
                </a>

                {/* Copy URL button */}
                <button
                  onClick={copyDownloadUrl}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition w-full sm:w-auto"
                  title="Copy direct download URL"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Download initiated! Check your browser's Downloads folder.</span>
                </div>
              )}

              {downloadError && (
                <div className="text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30">
                  {downloadError}. Try opening the Direct Link above or pasting the Copied URL in a new browser tab.
                </div>
              )}

              {/* Local run instructions */}
              <div className="rounded-xl bg-zinc-900 p-3 text-xs border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span>How to run on your machine:</span>
                  </span>
                  <button
                    onClick={copyInstallCommands}
                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : null}
                    <span className="text-[11px]">{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded-lg overflow-x-auto leading-relaxed">
                  unzip legend-ai-assistant.zip{'\n'}cd legend-ai-assistant{'\n'}npm install{'\n'}npm run dev
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
