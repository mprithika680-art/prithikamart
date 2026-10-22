import React, { useEffect, useState } from 'react';
import { X, Mail, ShieldAlert, Check, Copy, Clock, Inbox, Server } from 'lucide-react';
import { api } from '../services/api';
import { DeliveredEmailAudit } from '../types';

interface Props {
  email: string;
  onClose: () => void;
  onSelectOtp?: (otp: string) => void;
}

export const SandboxEmailModal: React.FC<Props> = ({ email, onClose, onSelectOtp }) => {
  const [deliveredEmail, setDeliveredEmail] = useState<DeliveredEmailAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchEmail() {
      try {
        setLoading(true);
        const res = await api.getLatestDeliveredEmail(email);
        if (res.email) {
          setDeliveredEmail(res.email);
        }
      } catch (err) {
        console.error('Failed to load delivered sandbox email:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [email]);

  const handleCopyOtp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onSelectOtp) {
      onSelectOtp(code);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div
        id="ethereal-sandbox-email-window"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Top Sandbox Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Ethereal Sandbox Mail Outbox</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Audit Log &bull; Verified Delivery
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Isolated Evaluator Inbox &bull; Simulated SMTP Server</p>
            </div>
          </div>

          <button
            type="button"
            id="close-sandbox-email-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">From:</span> Prithika Mart Security &lt;security@prithikamart.com&gt;
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{deliveredEmail?.sentAt ? new Date(deliveredEmail.sentAt).toLocaleTimeString() : 'Just now'}</span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-700">To:</span> <span className="font-mono text-slate-900 font-bold">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Subject:</span>{' '}
              <span className="text-slate-800 font-medium">
                {deliveredEmail?.subject || 'Prithika Mart - Your One-Time Password (OTP) Verification Code'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Server className="w-3 h-3" /> Status: {deliveredEmail?.status || 'Delivered'}
            </div>
          </div>
        </div>

        {/* Email Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-100/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Fetching authentic delivered email from server outbox...</p>
            </div>
          ) : deliveredEmail ? (
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {/* Internal Brand header */}
              <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Prithika Mart</h4>
                  <p className="text-[11px] text-slate-400">Security & Authentication Center</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                  TLS / AES-256
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                Hello <strong>{deliveredEmail.recipientName}</strong>,
              </p>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                You recently submitted a registration request on Prithika Mart. Use the 6-digit verification code below to verify your email address and activate your account:
              </p>

              {/* Dynamic 6-Digit OTP Box */}
              <div className="bg-slate-50 border-2 border-dashed border-sky-300 rounded-xl p-5 text-center mb-6">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Your One-Time Password (OTP)
                </div>
                <div
                  id="sandbox-actual-otp-display"
                  className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-sky-600 py-1"
                >
                  {deliveredEmail.otpCode}
                </div>
                <p className="text-[11px] text-rose-500 font-semibold mt-2">
                  Valid for 5 minutes &bull; Single-use only
                </p>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    id="copy-sandbox-otp-btn"
                    onClick={() => handleCopyOtp(deliveredEmail.otpCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied OTP!' : 'Copy 6-Digit OTP'}
                  </button>
                </div>
              </div>

              {/* Security Advisory */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Security Note:</strong> Do not share this OTP with anyone, including Prithika Mart support staff. If you did not initiate this request, you can safely ignore this notice.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No delivered email recorded yet for {email}. Please initiate registration first.
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Copy the code above and enter it into the OTP verification field on Prithika Mart.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Back to OTP Verification
          </button>
        </div>
      </div>
    </div>
  );
};
