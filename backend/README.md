# CanovaCRM Backend API

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with MongoDB Atlas credentials:
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin creation)

### Users/Employees
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/search?q=name` - Search users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/bulk-delete` - Bulk delete users (admin only)

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/my-leads` - Get user's assigned leads
- `GET /api/leads/scheduled?filter=Today` - Get scheduled leads
- `POST /api/leads` - Create single lead (admin only)
- `POST /api/leads/upload-csv` - Upload CSV (admin only)
- `PUT /api/leads/:id` - Update lead

### Dashboard
- `GET /api/dashboard/metrics` - Get KPI metrics
- `GET /api/dashboard/sales-graph` - Get graph data
- `GET /api/dashboard/active-sales` - Get active sales people

### Activities
- `GET /api/activities/recent` - Get recent 7 activities
- `GET /api/activities/my-activities` - Get user activities

### Timings
- `POST /api/timings/check-in` - Check-in
- `POST /api/timings/check-out` - Check-out
- `POST /api/timings/break-start` - Start break
- `POST /api/timings/break-end` - End break
- `GET /api/timings/today` - Get today's timing
- `GET /api/timings/break-logs` - Get past 4 days break logs

## Tech Stack
- Node.js + Express.js
- MongoDB (Native Driver)
- Native crypto for password hashing
- No 3rd party libraries (except framework essentials)
