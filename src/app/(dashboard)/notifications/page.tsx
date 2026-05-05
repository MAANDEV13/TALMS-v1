'use client';

import React from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare,
  Search,
  Check
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    import('@/lib/mockDb').then(({ MOCK_DB }) => {
      MOCK_DB.init();
      setNotifications(MOCK_DB.get('notifications') || []);
    });
  }, []);

  const handleClearNotifications = () => {
    import('@/lib/mockDb').then(({ MOCK_DB }) => {
      MOCK_DB.save('notifications', []);
      setNotifications([]);
    });
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${notif.unread ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notif.type === 'approval' ? 'bg-green-100 text-green-600' :
                notif.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                notif.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {notif.type === 'approval' && <CheckCircle2 className="w-5 h-5" />}
                {notif.type === 'alert' && <AlertTriangle className="w-5 h-5" />}
                {notif.type === 'message' && <MessageSquare className="w-5 h-5" />}
                {notif.type === 'system' && <Bell className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${notif.unread ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h3>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.time}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
          <button className="text-sm font-bold text-slate-500 hover:text-slate-700">View older notifications</button>
        </div>
      </div>
    </div>
  );
}
