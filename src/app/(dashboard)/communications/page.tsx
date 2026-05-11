'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'email' | 'announcement'>('announcement');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState(''); // Comma separated for emails
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!subject || !body) {
      setMessage({ type: 'error', text: 'Subject and message body are required.' });
      return;
    }

    if (type === 'email' && !recipients) {
      setMessage({ type: 'error', text: 'Recipients are required for emails.' });
      return;
    }

    setLoading(true);
    try {
      const emailList = recipients.split(',').map(e => e.trim()).filter(e => e);
      
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject,
          body,
          recipients: type === 'email' ? emailList : undefined
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `${type === 'email' ? 'Email' : 'Announcement'} sent successfully!` });
        setSubject('');
        setBody('');
        setRecipients('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send communication.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Communications</h1>
        <p className="text-slate-500 mt-1">Broadcast announcements to system users or send official emails to agencies.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-4">
            <button
              onClick={() => setType('announcement')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border ${
                type === 'announcement'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Megaphone className="w-5 h-5" />
              System Announcement
            </button>
            <button
              onClick={() => setType('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border ${
                type === 'email'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-5 h-5" />
              External Email
            </button>
          </div>
        </div>

        <div className="p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            } animate-in fade-in slide-in-from-top-2`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-6">
            {type === 'email' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Recipients (Email Addresses)
                </label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="agency1@example.com, agency2@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-slate-900"
                />
                <p className="text-xs text-slate-500 font-medium">Separate multiple email addresses with commas.</p>
              </div>
            )}

            {type === 'announcement' && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 animate-in fade-in duration-300">
                <Megaphone className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  Announcements will be visible to all TALMS users in their notification center. They will also trigger a notification alert.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Subject / Title
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={type === 'email' ? "e.g., Action Required: Renew License" : "e.g., System Maintenance Notice"}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 font-bold ${
                  type === 'email' ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Message Content</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
                className={`w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 resize-y min-h-[200px] leading-relaxed ${
                  type === 'email' ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                }`}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 ${
                  type === 'email'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {type === 'email' ? 'Send External Email' : 'Post Announcement'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
