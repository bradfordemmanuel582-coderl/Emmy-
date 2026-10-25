import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Globe,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  Send,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState<string>(() => {
    return 'https://ais-pre-5oj2bbxqgpcglrli4d6sf3-704594379291.europe-west1.run.app';
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    // Attempt to fetch preferred public shared URL from server
    fetch('/api/app-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.sharedUrl) {
          setShareUrl(data.sharedUrl);
        } else if (typeof window !== 'undefined') {
          // If on ais-pre or custom domain, use that
          setShareUrl(window.location.origin);
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          setShareUrl(window.location.origin);
        }
      });
  }, []);

  // Generate QR code whenever shareUrl changes
  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#059669', // Emerald dark dots
        light: '#ffffff', // White background
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [shareUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Legend AI Assistant',
          text: 'Check out Legend AI Assistant - an intelligent conversational AI assistant with interactive charts, live code preview, and web search!',
          url: shareUrl,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(
    'Chat with Legend AI Assistant - an intelligent conversational AI with interactive charts, web search, and live code preview!'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex h-auto max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Share Legend AI Assistant</h3>
              <p className="text-xs text-zinc-400">Invite anyone to use your AI assistant with a link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Main Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Public Link for Everyone
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-inner">
              <Globe className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Quick Share Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Share Directly To
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Native Device Share Sheet */}
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Share...</span>
              </button>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs font-medium text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs font-medium text-zinc-300 hover:border-cyan-500/40 hover:bg-cyan-950/20 hover:text-cyan-300 transition"
              >
                <Send className="h-3.5 w-3.5 text-cyan-400" />
                <span>Telegram</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  'Check out Legend AI Assistant'
                )}&body=${encodedText}%0A%0A${encodedUrl}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:bg-amber-950/20 hover:text-amber-300 transition"
              >
                <Mail className="h-3.5 w-3.5 text-amber-400" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">Mobile QR Code</span>
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
              >
                {showQr ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            </div>

            {showQr && qrCodeDataUrl && (
              <div className="mt-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="rounded-2xl bg-white p-3 shadow-lg">
                  <img
                    src={qrCodeDataUrl}
                    alt="Scan to open Legend AI Assistant"
                    className="h-44 w-44 rounded-lg object-contain"
                  />
                </div>
                <p className="mt-2.5 text-xs text-zinc-400 text-center">
                  Scan with your phone's camera to instantly open Legend AI Assistant!
                </p>
              </div>
            )}
          </div>

          {/* Permissions & Security explanation */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5 text-xs space-y-1.5 text-zinc-300">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>How it works for visitors:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-200">No account required</strong>: Anyone with this link can start chatting immediately.
              </li>
              <li>
                <strong className="text-zinc-200">Private to each user</strong>: Every user gets their own separate conversation history stored locally on their device.
              </li>
              <li>
                <strong className="text-zinc-200">Full AI Features included</strong>: Real-time streaming, interactive charts, web search, and voice audio work for all visitors!
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-3 flex items-center justify-between">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition"
          >
            <span>Test Open Public Link</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
