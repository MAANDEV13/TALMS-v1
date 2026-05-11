'use client';

import React from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare,
  Check,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  
  React.useEffect(() => {
    fetch('/api/data?table=notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'notifications', action: 'clear' })
      });
      setNotifications([]);
      router.refresh();
    } catch (err) {
      console.error('Failed to clear notifications');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with application statuses and system alerts.</p>
        </div>
        <button 
          onClick={handleClearNotifications}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Bell className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-500">No Notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${notif.unread !== false ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  notif.type === 'approval' ? 'bg-green-100 text-green-600' :
                  notif.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                  notif.type === 'message' || notif.type === 'announcement' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {notif.type === 'approval' && <CheckCircle2 className="w-5 h-5" />}
                  {(notif.type === 'alert' || notif.type === 'error') && <AlertTriangle className="w-5 h-5" />}
                  {(notif.type === 'message' || notif.type === 'announcement') && <MessageSquare className="w-5 h-5" />}
                  {(!notif.type || notif.type === 'system') && <Bell className="w-5 h-5" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${notif.unread !== false ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title || notif.message}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : notif.time}
                    </span>
                  </div>
                  {notif.title && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
