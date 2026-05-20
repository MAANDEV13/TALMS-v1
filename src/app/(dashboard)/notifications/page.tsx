'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare,
  Check,
  Loader2,
  Filter,
  Megaphone,
  Timer,
  Eye,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type FilterType = 'all' | 'unread' | 'approval' | 'reminder' | 'alert' | 'system' | 'announcement';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dgReminders, setDgReminders] = useState<any[]>([]);
  const router = useRouter();
  const prevUnreadRef = useRef(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notification sound
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Fallback: Web Audio API chime
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(1047, ctx.currentTime);
            osc2.frequency.setValueAtTime(1319, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.3);
            osc2.stop(ctx.currentTime + 0.3);
          } catch (e) {}
        });
      }
    } catch (e) {}
  }, []);
  
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/data?table=notifications');
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        setNotifications(arr);
        
        // Play sound if unread count increased
        const unread = arr.filter((n: any) => n.unread === 1 || n.unread === true).length;
        if (unread > prevUnreadRef.current && prevUnreadRef.current !== -1) {
          playNotificationSound();
        }
        prevUnreadRef.current = unread;
      }
    } catch (err) {
      console.error('Failed to load notifications');
    }
    setLoading(false);
  }, [playNotificationSound]);

  // Load DG reminders
  const loadDgReminders = useCallback(async () => {
    if (user?.role !== 'general_director') return;
    
    try {
      const [appsRes, agenciesRes] = await Promise.all([
        fetch('/api/data?table=applications'),
        fetch('/api/data?table=agencies')
      ]);
      
      const apps = appsRes.ok ? await appsRes.json() : [];
      const agencies = agenciesRes.ok ? await agenciesRes.json() : [];
      const appList = Array.isArray(apps) ? apps : [];
      const agencyList = Array.isArray(agencies) ? agencies : [];
      
      const reminders: any[] = [];
      
      // Pending approvals
      const pendingApps = appList.filter((a: any) => 
        a.status === 'Pending DG Approval' || a.status === 'Pending Director Approval'
      );
      if (pendingApps.length > 0) {
        reminders.push({
          id: 'r-pending',
          icon: '📋',
          title: `${pendingApps.length} Pending Approval${pendingApps.length > 1 ? 's' : ''}`,
          message: `You have ${pendingApps.length} application(s) waiting for your review and approval.`,
          link: '/approvals',
          color: 'amber'
        });
      }
      
      // Expiring licenses (within 30 days)
      const now = new Date();
      const expiringAgencies = agencyList.filter((a: any) => {
        const expiry = a.expiry_date || a.expiryDate;
        if (!expiry) return false;
        const expiryDate = new Date(expiry);
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
      });
      if (expiringAgencies.length > 0) {
        reminders.push({
          id: 'r-expiring',
          icon: '⏰',
          title: `${expiringAgencies.length} License${expiringAgencies.length > 1 ? 's' : ''} Expiring Soon`,
          message: `${expiringAgencies.map((a: any) => a.name).join(', ')} — expiring within 30 days.`,
          link: '/agencies',
          color: 'red'
        });
      }
      
      // Unreviewed applications
      const unreviewedApps = appList.filter((a: any) => 
        a.status === 'Under Review' || a.status === 'Pending Initial Review'
      );
      if (unreviewedApps.length > 0) {
        reminders.push({
          id: 'r-unreviewed',
          icon: '📄',
          title: `${unreviewedApps.length} Unreviewed Application${unreviewedApps.length > 1 ? 's' : ''}`,
          message: `Applications still in the review pipeline that need attention.`,
          link: '/licenses',
          color: 'blue'
        });
      }
      
      // Renewal deadlines
      const renewalApps = appList.filter((a: any) => 
        a.type === 'Renewal' && (a.status || '').includes('Pending')
      );
      if (renewalApps.length > 0) {
        reminders.push({
          id: 'r-renewals',
          icon: '🔄',
          title: `${renewalApps.length} Pending Renewal${renewalApps.length > 1 ? 's' : ''}`,
          message: `Renewal applications require timely processing.`,
          link: '/approvals',
          color: 'indigo'
        });
      }
      
      setDgReminders(reminders);
    } catch (err) {
      console.error('Failed to load DG reminders');
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    loadDgReminders();
  }, [loadNotifications, loadDgReminders]);

  // Auto-refresh every 10s for real-time updates
  useEffect(() => {
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'notifications', action: 'markRead', data: { id } })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: 0 } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'notifications', action: 'markAllRead', data: {} })
      });
      setNotifications(prev => prev.map(n => ({ ...n, unread: 0 })));
    } catch (err) {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle2 className="w-5 h-5" />;
      case 'reminder': return <Timer className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'message': return <MessageSquare className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'approval': return 'bg-green-100 text-green-600';
      case 'reminder': return 'bg-amber-100 text-amber-600';
      case 'alert': return 'bg-red-100 text-red-600';
      case 'announcement': return 'bg-blue-100 text-blue-600';
      case 'message': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    // Use GMT+3 timezone for time calculation
    const created = new Date(dateStr);
    const nowGMT3 = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    const createdGMT3 = new Date(created.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    const diff = nowGMT3.getTime() - createdGMT3.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return created.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread === 1 || n.unread === true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => n.unread === 1 || n.unread === true).length;

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'unread', label: `Unread (${unreadCount})`, icon: Eye },
    { key: 'approval', label: 'Approvals', icon: CheckCircle2 },
    { key: 'reminder', label: 'Reminders', icon: Timer },
    { key: 'alert', label: 'Alerts', icon: AlertTriangle },
    { key: 'announcement', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with application statuses and system alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* DG Reminders Section */}
      {user?.role === 'general_director' && dgReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-600" />
            Action Required — Reminders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dgReminders.map(reminder => (
              <button
                key={reminder.id}
                onClick={() => router.push(reminder.link)}
                className={`text-left p-5 rounded-2xl border transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                  reminder.color === 'amber' ? 'bg-amber-50 border-amber-200 hover:border-amber-300' :
                  reminder.color === 'red' ? 'bg-red-50 border-red-200 hover:border-red-300' :
                  reminder.color === 'blue' ? 'bg-blue-50 border-blue-200 hover:border-blue-300' :
                  'bg-indigo-50 border-indigo-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{reminder.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${
                      reminder.color === 'amber' ? 'text-amber-900' :
                      reminder.color === 'red' ? 'text-red-900' :
                      reminder.color === 'blue' ? 'text-blue-900' :
                      'text-indigo-900'
                    }`}>{reminder.title}</p>
                    <p className={`text-xs mt-1 font-medium line-clamp-2 ${
                      reminder.color === 'amber' ? 'text-amber-700' :
                      reminder.color === 'red' ? 'text-red-700' :
                      reminder.color === 'blue' ? 'text-blue-700' :
                      'text-indigo-700'
                    }`}>{reminder.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === f.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Bell className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-500">
              {filter === 'all' ? 'No Notifications' : `No ${filter} notifications`}
            </p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                  (notif.unread === 1 || notif.unread === true) 
                    ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 bg-blue-50/20' 
                    : ''
                }`}
                onClick={() => {
                  if (notif.unread === 1 || notif.unread === true) markAsRead(notif.id);
                  if (notif.link) router.push(notif.link);
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getNotifColor(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold leading-tight ${
                        (notif.unread === 1 || notif.unread === true) ? 'text-slate-900' : 'text-slate-600'
                      }`}>{notif.title || notif.message}</h3>
                      {notif.title && notif.message && (
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(notif.unread === 1 || notif.unread === true) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(notif.created_at)}
                      </span>
                    </div>
                  </div>
                  {notif.type && (
                    <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getNotifColor(notif.type)}`}>
                      {notif.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
