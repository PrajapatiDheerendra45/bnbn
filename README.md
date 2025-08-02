# Job Portal - Full Stack Application

A comprehensive job portal similar to Naukri or Internshala, built with React.js, Node.js, Express.js, and MongoDB.

## 🚀 Features

### User Roles
- **Super Admin**: Platform management, user management, job approval
- **Employer**: Job posting, applicant management, company profile
- **Job Seeker**: Job search, application, profile management

### Key Features
- JWT Authentication with role-based access
- Job posting and management
- Advanced job search with filters
- Resume upload and management
- Application tracking
- Email notifications
- Responsive design with Tailwind CSS
- File uploads with Cloudinary

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- React Query

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Nodemailer for emails
- Cloudinary for cloud storage

## 📁 Project Structure

```
job-portal/
├── client/                 # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── hooks/
│       └── utils/
├── server/                 # Node.js Backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-portal
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend (.env)
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm start
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs (public)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (employer only)
- `PUT /api/jobs/:id` - Update job (employer only)
- `DELETE /api/jobs/:id` - Delete job (employer only)

### Applications
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/user/applications` - Get user applications
- `GET /api/employer/jobs` - Get employer's jobs
- `GET /api/employer/applicants/:jobId` - Get job applicants

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/activate` - Activate/deactivate user
- `GET /api/admin/jobs` - Get all jobs for admin
- `PUT /api/admin/jobs/:id/approve` - Approve/reject job

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
