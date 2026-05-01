# CanovaCRM 
Full-stack CRM platform using MERN to manage customer data, track interactions, and streamline sales workflows with an intuitive and user-friendly interface
## Deployment links: 
  Frontend - Vercel (Unified): https://canova-crm-project.vercel.app
  Backend - Render : https://canova-crm-project-backend.onrender.com (https://canova-crm-project-backend.onrender.com/api/health)

## ✅ ONE UNIFIED APPLICATION
Note to Evaluator:
"This project uses a Unified Micro-Frontend architecture. Please log in with the provided Admin credentials to see the Admin Interface, or Employee credentials to see the User Interface."
This is a single React application that shows different interfaces based on user role:
- **Admin** → Desktop dashboard (full screen)
- Email: admin@canovacrm.com
- Password: admin@canovacrm.com
- **Employee** → Mobile-optimized interface (max 430px width)
- Email: Use any created employee email (In admin interface choose any user email Id and logout using logout button in the bottom of sidebar)
- Password: same as email (default)
- → Shows mobile interface

## Project Structure

```
Final/
├── backend/                           # Node.js API Server
├── admin-frontend/                    # Unified React App (Admin Desktop + Employee Mobile)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Admin dashboard
│   │   │   ├── Employees.jsx         # Employee management
│   │   │   ├── Leads.jsx             # Leads management
│   │   │   ├── Settings.jsx          # Admin settings
│   │   │   └── employee/             # Employee mobile pages
│   │   │       ├── EmployeeLayout.jsx
│   │   │       ├── EmployeeHome.jsx
│   │   │       ├── EmployeeLeads.jsx
│   │   │       ├── EmployeeSchedule.jsx
│   │   │       └── EmployeeProfile.jsx
│   └── ...
└── test-leads.csv                     # Sample CSV for testing
```

## How It Works

### Login Flow
1. User enters email & password
2. System checks role from backend
3. **If Admin** → Redirects to `/dashboard` (desktop layout)
4. **If Employee** → Redirects to `/employee` (mobile layout)

### Employee Interface (Mobile-First)
- Max width: 430px, centered
- Blue header with user greeting
- Bottom navigation (Home, Leads, Schedule, Profile)
- All pages match reference images exactly

## How to Run

### 1. Start Backend
```bash
cd backend
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd admin-frontend
npm run dev
# Runs on http://localhost:5173
```

### 3. Access Application
- Open browser: http://localhost:5173

## Login Credentials

**Admin:**
- Email: admin@canovacrm.com
- Password: admin@canovacrm.com
- → Shows desktop dashboard

**Employee:**
- Use any created employee email
- Password: same as email (default)
- → Shows mobile interface

## Testing Employee Interface

1. Login as admin
2. Create an employee (Employees page → Add Employee)
3. Logout
4. Login with employee credentials
5. You'll see the mobile interface
6. To test properly: Press F12 → Device Toolbar → Select iPhone

## Employee Mobile Features

### Home Page
- ✅ Greeting with user name
- ✅ Check-in/Check-out with color indicators
  - Green = Checked in
  - Red = Checked out
- ✅ Current break status
- ✅ Past 4 days break logs
- ✅ Recent activity (scrollable)

### Leads Page
- ✅ All assigned leads
- ✅ Search functionality
- ✅ Status badges (Ongoing/Closed)
- ✅ Type indicators (Hot=Orange, Warm=Yellow, Cold=Blue borders)
- ✅ Actions: Schedule, Update Status, Mark Done

### Schedule Page
- ✅ Scheduled calls list
- ✅ Filter (Today/All)
- ✅ Active schedule highlighted

### Profile Page
- ✅ Edit name
- ✅ Change password
- ✅ Logout button

## CSV Upload (Admin)
Upload format:
```csv
name,email,source,date,location,language
John Doe,john@example.com,Referral,2025-12-25,Mumbai,English
```

## API Routes

**Authentication:**
- POST /api/auth/login

**Admin Only:**
- GET/POST /api/users
- POST /api/leads/upload-csv

**Employee:**
- GET /api/leads/my-leads
- GET /api/leads/scheduled
- PUT /api/leads/:id

Everything is ready! One app, two interfaces based on role. 🎉
