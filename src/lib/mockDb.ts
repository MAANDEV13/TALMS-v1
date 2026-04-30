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
      localStorage.setItem('talms_agencies', JSON.stringify([]));
    }

    if (!localStorage.getItem('talms_applications')) {
      localStorage.setItem('talms_applications', JSON.stringify([]));
    }

    if (!localStorage.getItem('talms_notifications')) {
      localStorage.setItem('talms_notifications', JSON.stringify([]));
    }

    if (!localStorage.getItem('talms_agency_changes')) {
      localStorage.setItem('talms_agency_changes', JSON.stringify([]));
    }

    if (!localStorage.getItem('talms_activities')) {
      localStorage.setItem('talms_activities', JSON.stringify([]));
    }

    if (!localStorage.getItem('talms_settings')) {
      localStorage.setItem('talms_settings', JSON.stringify({
        registrationFee: 1000,
        renewalFee: 600,
        applicationFee: 500,
        certAuthText: "This certificate authorizes the holder to operate as a licensed Travel Agency, providing approved travel and tourism services in accordance with the laws and regulations of the Republic of Somaliland and applicable International aviation standards.",
        certSuspensionText: "This certificate is subject to periodic review and may be suspended or revoked in the event of noncompliance with the applicable laws and regulations."
      }));
    }
  },

  // Generic Get/Set
  get: (key: string) => JSON.parse(localStorage.getItem(`talms_${key}`) || '[]'),
  save: (key: string, data: any) => localStorage.setItem(`talms_${key}`, JSON.stringify(data)),
  
  // Specific Operations
  addApplication: (app: any) => {
    const apps = MOCK_DB.get('applications');
    
    // Final safety check for New applications to prevent duplicates by name
    if (app.type === 'New') {
      const exists = apps.some((a: any) => a.agency.toLowerCase() === app.agency.toLowerCase());
      if (exists) {
        console.warn('Duplicate application attempt blocked for:', app.agency);
        return false;
      }
    }
    
    MOCK_DB.save('applications', [app, ...apps]);
    return true;
  },

  getNextLicenseId: () => {
    const agencies = MOCK_DB.get('agencies');
    const apps = MOCK_DB.get('applications').filter((a: any) => a.status !== 'Draft');
    const year = new Date().getFullYear();
    const nextNumber = (agencies.length + apps.length + 1).toString().padStart(3, '0');
    return `${nextNumber}-MOCAAD-DCA/${year}`;
  },

  getDraftId: () => {
    return `DRAFT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  updateApplicationStatus: (id: string, status: string, color: string, comment?: string) => {
    const apps = MOCK_DB.get('applications');
    const updated = apps.map((app: any) => 
      app.id === id ? { 
        ...app, 
        status, 
        statusColor: color,
        reviewComment: comment || app.reviewComment 
      } : app
    );
    MOCK_DB.save('applications', updated);
  },

  addUser: (user: any) => {
    const users = MOCK_DB.get('users');
    MOCK_DB.save('users', [...users, { ...user, id: Math.random().toString(36).substr(2, 9), status: 'Active' }]);
  },

  checkAgencyName: (name: string) => {
    const agencies = MOCK_DB.get('agencies');
    const apps = MOCK_DB.get('applications');
    const nameExists = agencies.some((a: any) => a.name.toLowerCase() === name.toLowerCase()) ||
                       apps.some((a: any) => a.agency.toLowerCase() === name.toLowerCase());
    return !nameExists;
  },

  requestAgencyChange: (change: { agencyId: string, type: 'edit' | 'delete', data?: any, requester: string }) => {
    const changes = MOCK_DB.get('agency_changes');
    const newChange = {
      ...change,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pending DG Approval',
      date: new Date().toLocaleDateString()
    };
    MOCK_DB.save('agency_changes', [newChange, ...changes]);
  },

  approveAgencyChange: (changeId: string) => {
    const changes = MOCK_DB.get('agency_changes');
    const agencies = MOCK_DB.get('agencies');
    const change = changes.find((c: any) => c.id === changeId);

    if (!change) return;

    let updatedAgencies;
    if (change.type === 'delete') {
      updatedAgencies = agencies.filter((a: any) => a.id !== change.agencyId);
    } else {
      updatedAgencies = agencies.map((a: any) => 
        a.id === change.agencyId ? { ...a, ...change.data, name: change.data.newName || a.name } : a
      );
    }

    MOCK_DB.save('agencies', updatedAgencies);
    MOCK_DB.save('agency_changes', changes.filter((c: any) => c.id !== changeId));
  },

  logActivity: (userName: string, action: string, target: string) => {
    const activities = MOCK_DB.get('activities') || [];
    const newActivity = {
      id: Math.random().toString(36).substr(2, 9),
      user: userName,
      action: action,
      target: target,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    MOCK_DB.save('activities', [newActivity, ...activities.slice(0, 99)]);
  },

  getSettings: () => {
    const settings = localStorage.getItem('talms_settings');
    return settings ? JSON.parse(settings) : {
      registrationFee: 1000,
      renewalFee: 600,
      applicationFee: 500,
      certAuthText: "This certificate authorizes the holder to operate as a licensed Travel Agency, providing approved travel and tourism services in accordance with the laws and regulations of the Republic of Somaliland and applicable International aviation standards.",
      certSuspensionText: "This certificate is subject to periodic review and may be suspended or revoked in the event of noncompliance with the applicable laws and regulations."
    };
  },

  updateSettings: (newSettings: any) => {
    const current = MOCK_DB.getSettings();
    localStorage.setItem('talms_settings', JSON.stringify({ ...current, ...newSettings }));
  },

  updateApplication: (updatedApp: any) => {
    const apps = MOCK_DB.get('applications');
    const updated = apps.map((app: any) => 
      app.id === updatedApp.id ? updatedApp : app
    );
    MOCK_DB.save('applications', updated);
  },

  // Wipe all data and re-seed only system users
  clearAndSeedUsers: () => {
    if (typeof window === 'undefined') return;
    const SEED_USERS = [
      { id: '1', name: 'Admin User',    email: 'admin@agency.gov',    password: 'admin123', role: 'admin',            status: 'Active' },
      { id: '2', name: 'Ahmed Officer', email: 'officer@agency.gov',  password: 'admin123', role: 'officer',          status: 'Active' },
      { id: '3', name: 'Sarah Director',email: 'director@agency.gov', password: 'admin123', role: 'director',         status: 'Active' },
      { id: '4', name: 'Guleid General',email: 'gd@agency.gov',       password: 'admin123', role: 'general_director', status: 'Active' },
    ];
    // Clear every collection
    ['agencies','applications','notifications','agency_changes','activities','fines'].forEach(
      (key) => localStorage.removeItem(`talms_${key}`)
    );
    // Re-seed users only
    localStorage.setItem('talms_users', JSON.stringify(SEED_USERS));
    // Keep settings untouched
    console.info('[TALMS] Database cleared. Only seed users remain.');
  },
};
