'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, User, Settings, LogOut, ChevronDown, Building2, FileText, Check, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
    // Load sound preference
    const saved = localStorage.getItem('talms-sound-enabled');
    if (saved !== null) setSoundEnabled(saved === 'true');
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
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
  }, [soundEnabled]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications & play sound
  useEffect(() => {
    const fetchNotifs = () => {
      fetch('/api/data?table=notifications')
        .then(r => r.ok ? r.json() : [])
        .then(notifs => {
          const arr = Array.isArray(notifs) ? notifs : [];
          const unread = arr.filter((n: any) => n.unread === 1 || n.unread === true).length;
          setUnreadCount(unread);
          setRecentNotifs(arr.slice(0, 8));

          // Play sound if unread count increased
          if (unread > prevUnreadRef.current && prevUnreadRef.current !== -1) {
            playNotificationSound();
          }
          if (prevUnreadRef.current === -1) prevUnreadRef.current = unread;
          else prevUnreadRef.current = unread;
        })
        .catch(() => setUnreadCount(0));
    };

    prevUnreadRef.current = -1; // First load marker
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000); // Poll every 8s for real-time feel
    return () => clearInterval(interval);
  }, [playNotificationSound]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'notifications', action: 'markRead', data: { id } })
      });
      setRecentNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: 0 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'notifications', action: 'markAllRead', data: {} })
      });
      setRecentNotifs(prev => prev.map(n => ({ ...n, unread: 0 })));
      setUnreadCount(0);
    } catch (e) {}
  };

  // Toggle sound
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('talms-sound-enabled', String(next));
  };

  // Live search
  useEffect(() => {
    const doSearch = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const term = searchTerm.toLowerCase();
      try {
        const [agenciesRes, appsRes] = await Promise.all([
          fetch('/api/data?table=agencies'),
          fetch('/api/data?table=applications'),
        ]);
        const agencies = agenciesRes.ok ? await agenciesRes.json() : [];
        const apps = appsRes.ok ? await appsRes.json() : [];

    const agencyMatches = agencies
      .filter((a: any) =>
        (a.name || '').toLowerCase().includes(term) ||
        (a.licenseId || a.license_id || '').toLowerCase().includes(term) ||
        (a.region || '').toLowerCase().includes(term) ||
        (a.contactPerson || a.contact_person || '').toLowerCase().includes(term)
      )
      .slice(0, 4)
      .map((a: any) => ({ ...a, _type: 'agency' }));

    const appMatches = apps
      .filter((a: any) =>
        (a.agency || '').toLowerCase().includes(term) ||
        (a.agencyId || a.agency_id || '').toLowerCase().includes(term) ||
        (a.region || '').toLowerCase().includes(term)
      )
      .slice(0, 4)
      .map((a: any) => ({ ...a, _type: 'application' }));

        setSearchResults([...agencyMatches, ...appMatches]);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      }
    };
    doSearch();
  }, [searchTerm]);

  const handleResultClick = (result: any) => {
    setShowSearchResults(false);
    setSearchTerm('');
    if (result._type === 'agency') {
      router.push(`/agencies/${result.id}`);
    } else {
      router.push('/licenses');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'approval': return '✅';
      case 'reminder': return '⏰';
      case 'alert': return '⚠️';
      case 'announcement': return '📢';
      default: return '🔔';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    // Compute time difference accounting for GMT+3
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
    return `${days}d ago`;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-40 flex items-center justify-between px-8">
      {/* Search */}
      <div className="relative w-96" ref={searchRef}>
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          placeholder="Search agencies, applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
        />

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{searchResults.length} results found</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={`${result._type}-${result.id}-${i}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-b-0"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    result._type === 'agency' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {result._type === 'agency' ? <Building2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{result.name || result.agency}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      {result._type === 'agency' ? `Agency • ${result.licenseId || result.license_id || ''}` : `Application • ${result.type || ''}`}
                      {result.region ? ` • ${result.region}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {showSearchResults && searchTerm.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 p-6 text-center">
            <p className="text-sm text-slate-400 font-medium">No results for &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Bell — Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all ${showNotifications ? 'bg-slate-100 text-blue-600' : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white px-1 animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Notifications</span>
                <div className="flex items-center gap-2">
                  {/* Sound toggle */}
                  <button
                    onClick={toggleSound}
                    className={`p-1.5 rounded-lg transition-all ${soundEnabled ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title={soundEnabled ? 'Sound on' : 'Sound off'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all uppercase tracking-wider"
                    >
                      <Check className="w-3 h-3" />
                      Read All
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {recentNotifs.length > 0 ? recentNotifs.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${(n.unread === 1 || n.unread === true) ? 'bg-blue-50/40' : ''}`}
                    onClick={() => {
                      if (n.unread === 1 || n.unread === true) markAsRead(n.id);
                      if (n.link) {
                        setShowNotifications(false);
                        router.push(n.link);
                      }
                    }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{getNotifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold line-clamp-1 ${(n.unread === 1 || n.unread === true) ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title || n.message}
                        </p>
                        {(n.unread === 1 || n.unread === true) && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      {n.title && n.message && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                        {getTimeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <Link 
                  href="/notifications" 
                  onClick={() => setShowNotifications(false)}
                  className="block w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700 py-1.5"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium capitalize">{user?.role.replace('_', ' ') || 'No Role'}</p>
            </div>
            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase tracking-tight border border-blue-200">
                    {user?.role.replace('_', ' ')}
                  </span>
                  {user?.region && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-tight">
                      {user.region}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">{unreadCount}</span>
                  )}
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 py-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    router.push('/login');
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm font-medium text-red-600 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
