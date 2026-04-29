'use client';

// Central Mock Database Utility using LocalStorage
export const MOCK_DB = {
  // Initialize DB with default data if empty
  init: () => {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem('talms_users')) {
      localStorage.setItem('talms_users', JSON.stringify([
        { id: '1', name: 'Admin User', email: 'admin@agency.gov', password: 'admin123', role: 'admin', status: 'Active' },
        { id: '2', name: 'Ahmed Officer', email: 'officer@agency.gov', password: 'admin123', role: 'officer', status: 'Active' },
        { id: '3', name: 'Sarah Director', email: 'director@agency.gov', password: 'admin123', role: 'director', status: 'Active' },
        { id: '4', name: 'Guleid General', email: 'gd@agency.gov', password: 'admin123', role: 'general_director', status: 'Active' },
      ]));
    }

    if (!localStorage.getItem('talms_agencies')) {
      localStorage.setItem('talms_agencies', JSON.stringify([
        { id: '1', name: 'Hargeisa Global Travel', licenseId: 'SL-2023-001', city: 'Hargeisa', branches: 4, joined: 'Jan 2023', status: 'Active' },
        { id: '2', name: 'Borama Express', licenseId: 'SL-2023-042', city: 'Borama', branches: 2, joined: 'Mar 2023', status: 'Active' },
        { id: '3', name: 'Berbera Sea Tours', licenseId: 'SL-2023-115', city: 'Berbera', branches: 3, joined: 'Jun 2023', status: 'Active' },
      ]));
    }

    if (!localStorage.getItem('talms_applications')) {
      localStorage.setItem('talms_applications', JSON.stringify([
        { id: 'app1', agency: 'Burao Expeditions', type: 'New', status: 'Under Review', statusColor: 'amber', date: 'Oct 24, 2023', priority: 'High' },
        { id: 'app2', agency: 'Gabiley Travel', type: 'Renewal', status: 'Approved by Officer', statusColor: 'blue', date: 'Oct 23, 2023', priority: 'Medium' },
      ]));
    }

    if (!localStorage.getItem('talms_notifications')) {
      localStorage.setItem('talms_notifications', JSON.stringify([
        { id: '1', type: 'approval', title: 'License Approved', message: 'The renewal for Atlas Travel Co. has been final approved.', time: '10 minutes ago', unread: true },
        { id: '2', type: 'alert', title: 'Expiring Soon', message: '12 licenses are expiring within the next 30 days.', time: '1 hour ago', unread: true },
      ]));
    }
  },

  // Generic Get/Set
  get: (key: string) => JSON.parse(localStorage.getItem(`talms_${key}`) || '[]'),
  save: (key: string, data: any) => localStorage.setItem(`talms_${key}`, JSON.stringify(data)),
  
  // Specific Operations
  addApplication: (app: any) => {
    const apps = MOCK_DB.get('applications');
    MOCK_DB.save('applications', [app, ...apps]);
  },

  updateApplicationStatus: (id: string, status: string, color: string) => {
    const apps = MOCK_DB.get('applications');
    const updated = apps.map((app: any) => 
      app.id === id ? { ...app, status, statusColor: color } : app
    );
    MOCK_DB.save('applications', updated);
  },

  addUser: (user: any) => {
    const users = MOCK_DB.get('users');
    MOCK_DB.save('users', [...users, { ...user, id: Math.random().toString(36).substr(2, 9), status: 'Active' }]);
  }
};
