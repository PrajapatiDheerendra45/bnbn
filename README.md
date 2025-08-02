# Job Portal - Production Ready

A comprehensive job portal application similar to Naukri/Internshala with three user roles: SuperAdmin, Employer, and Job Seeker.

## 🚀 Tech Stack

- **Frontend**: React.js + Tailwind CSS + React Router
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Role-based access control
- **File Storage**: Multer + Cloudinary
- **Email**: NodeMailer
- **Deployment**: Vercel (Frontend) + Render/Railway (Backend)

## 📁 Project Structure

```
job-portal/
├── frontend/          # React application
├── backend/           # Node.js API server
├── package.json       # Root package.json
└── README.md
```

## 🔧 Local Development Setup

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd job-portal
```

2. Install all dependencies
```bash
npm run install-all
```

3. Set up environment variables
```bash
# Backend (.env file in backend/)
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
PORT=5000

# Frontend (.env file in frontend/)
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start development servers
```bash
npm run dev
```

## 👥 User Roles & Features

### 🔑 SuperAdmin
- Dashboard with analytics
- Manage users (Job Seekers & Employers)
- Approve/reject job posts
- Manage categories and locations
- View platform statistics

### 💼 Employer
- Company profile management
- Post and manage job listings
- View and manage applicants
- Download resumes
- Dashboard with job statistics

### 🚀 Job Seeker
- Profile management with resume upload
- Search and filter jobs
- Apply to jobs
- Save/bookmark jobs
- View application history
- Dashboard with recommendations

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs (public)
- `POST /api/jobs` - Create job (employer only)
- `PUT /api/jobs/:id` - Update job (employer only)
- `DELETE /api/jobs/:id` - Delete job (employer only)

### Applications
- `POST /api/jobs/:id/apply` - Apply to job (job seeker only)
- `GET /api/applications` - Get user applications
- `GET /api/employer/applicants/:jobId` - Get job applicants (employer only)

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/jobs` - Get all jobs for approval
- `PUT /api/admin/jobs/:id/approve` - Approve/reject job

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set environment variables
3. Deploy with auto-deployment enabled

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Add connection string to environment variables
3. Configure network access and database users

## 📧 Email Configuration

For email notifications, configure your email provider:
- Gmail: Use App Passwords for authentication
- Other providers: Update SMTP settings in backend/.env

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting on APIs
- CORS configuration
- File upload restrictions

## 📱 Responsive Design

The application is fully responsive with Tailwind CSS, optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.
