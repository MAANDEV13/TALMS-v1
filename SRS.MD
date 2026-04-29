📘 Travel Agency License Management System (TALMS)

## 1. 🧩 System Overview

A **web-based government system** for managing travel agency license registration, renewal, approval workflow, and monitoring.

The system enforces:

* Strict approval hierarchy
* Document validation
* License lifecycle tracking
* Expiry notifications

---

## 2. 👥 User Roles & Permissions

### 🔹 Admin

* Full system control
* Manage users (Officers, Directors)
* Configure system settings
* View all data & reports

### 🔹 Officer

* Create & edit applications
* Upload documents
* Review applications
* Change status → *Under Review / Approved by Officer / Needs Revision / Rejected*
* Add comments

### 🔹 Director

* Review officer-approved applications
* Approve / Reject
* Add comments

### 🔹 General Director

* Final approval authority
* Approve / Reject final stage

---

## 3. 🔄 Workflow (Approval Process)

```
Draft → Under Review → Approved by Officer → Approved by Director → Final Approved
                                 ↓
                        Needs Revision / Rejected
```

### Key Rules:

* Each stage **must be completed sequentially**
* Users can **only act within their role**
* Comments required for:

  * Rejection
  * Needs Revision

---

## 4. 📄 License Management

### License Types:

* New License
* Renewal License (full re-entry required)

### Rules:

* No duplicate agency names allowed (strict validation)
* Renewal does NOT auto-fill old data
* Previous licenses remain stored for history

---

## 5. 🏢 Agency & Branch Structure

### Model:

* **1 License → Multiple Branches**

### Branch Fields:

* Branch Name
* Address
* City / Country
* Status (Active / Inactive)

---

## 6. 📁 Document Management

### Supported:

* PDF + Images
* Max size: 20MB per file

### Features:

* Upload / Replace documents
* Preview documents
* Version tracking (recommended)

### Suggested Document List:

* Business Registration
* Owner ID
* Office Lease
* Tax Certificate

---

## 7. 🔔 Notifications System

### Email Automation:

* Sent at:

  * 60 days before expiry
  * 50 days before expiry
  * 40 days before expiry

### Recipients:

* Assigned Officers
* Admin (optional)

### Future:

* SMS integration (design API-ready)

---

## 8. 📊 Dashboard & Reporting

### Widgets:

* Total Licenses
* Pending Approvals
* Expiring Soon
* Rejected Applications

### Features:

* Charts (monthly trends)
* Advanced filters:

  * Status
  * Date
  * Officer
* Export:

  * Excel
  * PDF

---

## 9. 🧱 Technical Architecture

### 🔹 Frontend

* **Next.js (React)**
* Tailwind CSS (UI)
* React Query (data fetching)
* Form handling: React Hook Form

---

### 🔹 Backend (Supabase)

* PostgreSQL database
* Supabase Auth (for internal users)
* Supabase Storage (documents)
* Row-Level Security (VERY IMPORTANT)

---

### 🔹 Optional Enhancements

* Edge Functions (Supabase) for:

  * Email scheduling
  * Business logic

---

### 🔹 Email Service

* Recommended:

  * Resend
  * SendGrid

---

## 10. 🗄️ Database Schema (Core Tables)

### 🔹 users

* id
* name
* email
* role (admin, officer, director, general_director)

---

### 🔹 agencies

* id
* name (UNIQUE)
* created_at

---

### 🔹 licenses

* id
* agency_id
* type (new / renewal)
* status
* expiry_date
* created_by (officer)
* created_at

---

### 🔹 branches

* id
* license_id
* name
* address
* city
* status

---

### 🔹 documents

* id
* license_id
* file_url
* file_type
* uploaded_by
* created_at

---

### 🔹 status_logs (VERY IMPORTANT)

* id
* license_id
* old_status
* new_status
* changed_by
* comment
* created_at

👉 This gives full audit trail.

---

### 🔹 notifications

* id
* license_id
* type (email reminder)
* sent_at
* status

---

## 11. 🔐 Security

* Role-Based Access Control (RBAC)
* Supabase Row-Level Security (RLS)
* File access restrictions
* Audit logs (non-editable)

---

## 12. ⚙️ Key Features (Advanced)

### ✅ Smart Validation

* Prevent duplicate agency names
* Required documents enforcement

### ✅ Audit Trail

* Every status change logged

### ✅ Revision System

* Officer can request fixes without restarting process

### ✅ Scalable Design

* Ready for:

  * SMS
  * Public portal (future)

---

## 13. 🚀 Suggested Development Phases

### Phase 1 (MVP)

* Auth system
* License creation
* Workflow (Officer → Director → GD)
* Document upload
* Status tracking

### Phase 2

* Dashboard + reports
* Email reminders
* Branch management

### Phase 3

* SMS integration
* Advanced analytics
* Performance optimization

---

## ⚠️ Important Advice

Two things will make or break this system:

1. **Status logic (workflow enforcement)**
2. **Database design (especially status_logs)**

If done wrong → system becomes messy fast.
