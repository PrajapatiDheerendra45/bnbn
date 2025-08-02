# Job Portal Deployment Guide

This guide covers deployment options for the Job Portal application.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- MongoDB Atlas account (recommended for production)
- Cloudinary account for file storage
- Email service (Gmail with App Password recommended)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd job-portal
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` file with your actual values:
```bash
# Database (use MongoDB Atlas for production)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password_here
MONGO_DATABASE=jobportal

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# URLs
FRONTEND_URL=https://your-domain.com
REACT_APP_API_URL=https://api.your-domain.com/api
```

### 3. Run with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Seed Database (Optional)
```bash
# Seed with sample data
docker-compose exec backend npm run seed
```

## 🌐 Production Deployment

### Option 1: Vercel + Render + MongoDB Atlas

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL=https://your-api-domain.onrender.com/api`
4. Deploy automatically

#### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=...
   EMAIL_PASS=...
   FRONTEND_URL=https://your-app.vercel.app
   ```

#### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update `MONGODB_URI` in backend environment

### Option 2: AWS Deployment

#### Frontend (S3 + CloudFront)
```bash
# Build the app
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Backend (EC2 + Application Load Balancer)
1. Launch EC2 instance
2. Install Node.js and PM2
3. Clone repository
4. Install dependencies
5. Set environment variables
6. Start with PM2:
   ```bash
   cd backend
   npm install
   pm2 start server.js --name job-portal-api
   pm2 startup
   pm2 save
   ```

#### Database (MongoDB Atlas or EC2)
Use MongoDB Atlas for managed service or set up MongoDB on separate EC2 instance.

### Option 3: Google Cloud Platform

#### Frontend (Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

#### Backend (Cloud Run)
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/job-portal-backend backend/

# Deploy to Cloud Run
gcloud run deploy job-portal-backend \
  --image gcr.io/PROJECT-ID/job-portal-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Environment Setup Guide

### 1. MongoDB Atlas Setup
1. Create account at mongodb.com
2. Create new cluster (M0 free tier for development)
3. Create database user
4. Network Access: Add your IP or 0.0.0.0/0 for all IPs
5. Get connection string from "Connect" → "Connect your application"

### 2. Cloudinary Setup
1. Create account at cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Configure upload presets if needed

### 3. Email Setup (Gmail)
1. Enable 2-factor authentication on your Google account
2. Go to Google Account settings
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Use your Gmail address and app password

### 4. JWT Secret Generation
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/health`
- Database connectivity check
- File upload service check

### Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2 logs
pm2 logs job-portal-api
```

### Backup Strategy
1. MongoDB Atlas automatic backups
2. Regular database exports
3. Code repository backups
4. Environment configuration backups

### Performance Optimization
1. Enable gzip compression
2. Use CDN for static assets
3. Implement Redis caching
4. Database indexing optimization
5. Image optimization

## 🔒 Security Considerations

### Production Checklist
- [ ] Use HTTPS everywhere
- [ ] Secure JWT secret (minimum 32 characters)
- [ ] Environment variables not in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation and sanitization
- [ ] File upload restrictions
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Backup and recovery plan

### SSL/TLS Certificate
- Use Let's Encrypt for free certificates
- Configure automatic renewal
- Implement HSTS headers
- Use secure headers middleware

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL in backend environment
   - Verify CORS configuration in server.js

2. **Database Connection**
   - Verify MongoDB URI format
   - Check network access in MongoDB Atlas
   - Ensure database user has proper permissions

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper multer configuration

4. **Email Not Sending**
   - Verify email credentials
   - Check Gmail app password setup
   - Test SMTP connection

### Debug Commands
```bash
# Check environment variables
docker-compose exec backend env

# Test API endpoints
curl https://your-api-domain.com/api/health

# Database connection test
docker-compose exec backend node -e "require('./config/database')"
```

## 📝 Maintenance Tasks

### Regular Updates
- Update dependencies monthly
- Security patches immediately
- Monitor for vulnerabilities
- Update Node.js version quarterly

### Database Maintenance
- Monitor database size and performance
- Regular index optimization
- Clean up old data if needed
- Performance monitoring

### Backup Verification
- Test restore procedures monthly
- Verify backup integrity
- Document recovery processes
- Update disaster recovery plan

For more specific deployment scenarios or issues, refer to the platform-specific documentation or contact the development team.