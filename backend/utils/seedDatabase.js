const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Job = require('../models/Job');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@jobportal.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    isVerified: true
  },
  {
    name: 'TechCorp',
    email: 'hr@techcorp.com',
    password: 'employer123',
    role: 'employer',
    companyName: 'TechCorp Solutions',
    companyDescription: 'Leading technology solutions provider specializing in web development and cloud services.',
    companyWebsite: 'https://techcorp.com',
    companySize: '51-200',
    industry: 'Technology',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    isActive: true,
    isVerified: true
  },
  {
    name: 'FinanceHub',
    email: 'recruitment@financehub.com',
    password: 'employer123',
    role: 'employer',
    companyName: 'FinanceHub Ltd',
    companyDescription: 'Premier financial services company offering banking and investment solutions.',
    companyWebsite: 'https://financehub.com',
    companySize: '201-1000',
    industry: 'Finance',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    isActive: true,
    isVerified: true
  },
  {
    name: 'HealthCare Plus',
    email: 'careers@healthcareplus.com',
    password: 'employer123',
    role: 'employer',
    companyName: 'HealthCare Plus',
    companyDescription: 'Modern healthcare solutions with focus on digital health and patient care.',
    companyWebsite: 'https://healthcareplus.com',
    companySize: '11-50',
    industry: 'Healthcare',
    location: {
      city: 'Delhi',
      state: 'Delhi',
      country: 'India'
    },
    isActive: true,
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'jobseeker123',
    role: 'jobseeker',
    phone: '+91-9876543210',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
    experience: {
      years: 3,
      description: 'Full-stack developer with 3 years of experience in MERN stack development.'
    },
    education: [
      {
        degree: 'Bachelor of Technology',
        institution: 'IIT Delhi',
        year: 2020,
        score: '8.5 CGPA'
      }
    ],
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe'
    },
    isActive: true,
    isVerified: true
  },
  {
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    password: 'jobseeker123',
    role: 'jobseeker',
    phone: '+91-8765432109',
    skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
    experience: {
      years: 5,
      description: 'Senior Python developer with expertise in backend development and cloud deployment.'
    },
    education: [
      {
        degree: 'Master of Computer Applications',
        institution: 'University of Mumbai',
        year: 2018,
        score: '9.2 CGPA'
      }
    ],
    location: {
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahsmith',
      github: 'https://github.com/sarahsmith'
    },
    isActive: true,
    isVerified: true
  },
  {
    name: 'Michael Johnson',
    email: 'michael@example.com',
    password: 'jobseeker123',
    role: 'jobseeker',
    phone: '+91-7654321098',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Jenkins'],
    experience: {
      years: 7,
      description: 'Senior Java developer with expertise in enterprise applications and DevOps.'
    },
    education: [
      {
        degree: 'Bachelor of Engineering',
        institution: 'BITS Pilani',
        year: 2016,
        score: '8.8 CGPA'
      }
    ],
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/michaeljohnson',
      github: 'https://github.com/michaeljohnson'
    },
    isActive: true,
    isVerified: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log('Created users:', createdUsers.length);

    // Get employer IDs
    const employers = createdUsers.filter(user => user.role === 'employer');

    // Sample jobs
    const jobs = [
      {
        title: 'Full Stack Developer',
        description: `We are looking for a talented Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.

Key Responsibilities:
- Develop user-facing features using React.js
- Build robust APIs using Node.js and Express
- Work with MongoDB databases
- Collaborate with cross-functional teams
- Participate in code reviews and technical discussions

Requirements:
- 2+ years of experience in full-stack development
- Proficiency in JavaScript, React, Node.js
- Experience with MongoDB or similar NoSQL databases
- Knowledge of Git version control
- Strong problem-solving skills`,
        company: employers[0]._id,
        location: 'Mumbai, Maharashtra',
        salaryRange: {
          min: 600000,
          max: 1200000,
          currency: 'INR',
          period: 'annual'
        },
        experience: {
          min: 2,
          max: 5
        },
        jobType: 'Full-time',
        workMode: 'Hybrid',
        category: 'Technology',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          '2+ years of full-stack development experience',
          'Experience with MERN stack',
          'Knowledge of RESTful APIs',
          'Good communication skills'
        ],
        responsibilities: [
          'Develop and maintain web applications',
          'Write clean, maintainable code',
          'Collaborate with design and product teams',
          'Participate in agile development processes',
          'Mentor junior developers'
        ],
        benefits: [
          'Competitive salary',
          'Health insurance',
          'Flexible working hours',
          'Professional development opportunities',
          'Work from home options'
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        companySize: '51-200',
        educationLevel: 'Bachelor\'s'
      },
      {
        title: 'Senior Python Developer',
        description: `Join our team as a Senior Python Developer and work on cutting-edge projects in the fintech domain. You'll be working with a talented team to build scalable backend systems.

Key Responsibilities:
- Design and develop backend services using Python/Django
- Build and maintain APIs for mobile and web applications
- Optimize database queries and improve system performance
- Implement security best practices
- Lead technical discussions and mentor junior developers

Requirements:
- 4+ years of Python development experience
- Strong experience with Django/Flask frameworks
- Knowledge of PostgreSQL and Redis
- Experience with AWS cloud services
- Understanding of microservices architecture`,
        company: employers[1]._id,
        location: 'Bangalore, Karnataka',
        salaryRange: {
          min: 1200000,
          max: 2000000,
          currency: 'INR',
          period: 'annual'
        },
        experience: {
          min: 4,
          max: 8
        },
        jobType: 'Full-time',
        workMode: 'On-site',
        category: 'Technology',
        skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Redis'],
        requirements: [
          'Bachelor\'s/Master\'s degree in Computer Science',
          '4+ years of Python development experience',
          'Strong knowledge of Django framework',
          'Experience with cloud platforms',
          'Leadership skills'
        ],
        responsibilities: [
          'Lead backend development projects',
          'Design scalable system architectures',
          'Mentor junior team members',
          'Conduct code reviews',
          'Collaborate with product and DevOps teams'
        ],
        benefits: [
          'Competitive salary package',
          'Stock options',
          'Premium health insurance',
          'Learning and development budget',
          'Gym membership'
        ],
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'active',
        companySize: '201-1000',
        educationLevel: 'Bachelor\'s'
      },
      {
        title: 'Frontend Developer - React',
        description: `We're seeking a passionate Frontend Developer to create amazing user experiences for our healthcare platform. You'll work with modern React ecosystem and contribute to improving patient care through technology.

Key Responsibilities:
- Develop responsive web applications using React
- Implement pixel-perfect designs
- Optimize applications for performance
- Write comprehensive tests
- Work closely with UX/UI designers

Requirements:
- 3+ years of React development experience
- Strong knowledge of JavaScript ES6+
- Experience with state management (Redux/Zustand)
- Knowledge of CSS preprocessors
- Understanding of web accessibility standards`,
        company: employers[2]._id,
        location: 'Delhi, Delhi',
        salaryRange: {
          min: 800000,
          max: 1400000,
          currency: 'INR',
          period: 'annual'
        },
        experience: {
          min: 3,
          max: 6
        },
        jobType: 'Full-time',
        workMode: 'Remote',
        category: 'Technology',
        skills: ['React', 'JavaScript', 'CSS', 'Redux', 'TypeScript'],
        requirements: [
          'Bachelor\'s degree in relevant field',
          '3+ years of React development',
          'Strong CSS and JavaScript skills',
          'Experience with testing frameworks',
          'Portfolio of previous work'
        ],
        responsibilities: [
          'Build user interfaces using React',
          'Ensure cross-browser compatibility',
          'Optimize performance and accessibility',
          'Collaborate with design team',
          'Maintain code quality and documentation'
        ],
        benefits: [
          'Remote work flexibility',
          'Health and wellness programs',
          'Professional development support',
          'Flexible hours',
          'Annual team retreats'
        ],
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'active',
        companySize: '11-50',
        educationLevel: 'Bachelor\'s'
      },
      {
        title: 'Java Backend Developer',
        description: `Looking for an experienced Java Backend Developer to join our enterprise solutions team. You'll be working on large-scale applications serving millions of users.

Key Responsibilities:
- Develop backend services using Java and Spring Boot
- Design and implement microservices architecture
- Work with containerization technologies
- Ensure high availability and scalability
- Participate in system design discussions

Requirements:
- 5+ years of Java development experience
- Strong knowledge of Spring framework
- Experience with microservices and Docker
- Knowledge of message queues and caching
- Understanding of DevOps practices`,
        company: employers[0]._id,
        location: 'Hyderabad, Telangana',
        salaryRange: {
          min: 1000000,
          max: 1800000,
          currency: 'INR',
          period: 'annual'
        },
        experience: {
          min: 5,
          max: 10
        },
        jobType: 'Full-time',
        workMode: 'Hybrid',
        category: 'Technology',
        skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes'],
        requirements: [
          'Bachelor\'s/Master\'s in Computer Science',
          '5+ years of Java enterprise development',
          'Experience with Spring ecosystem',
          'Knowledge of cloud platforms',
          'Strong problem-solving abilities'
        ],
        responsibilities: [
          'Design and develop backend services',
          'Implement microservices patterns',
          'Ensure system reliability and performance',
          'Collaborate with DevOps team',
          'Mentor junior developers'
        ],
        benefits: [
          'Competitive compensation',
          'Performance bonuses',
          'Comprehensive insurance',
          'Skill development programs',
          'Flexible work arrangements'
        ],
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        status: 'active',
        companySize: '51-200',
        educationLevel: 'Bachelor\'s'
      },
      {
        title: 'DevOps Engineer',
        description: `We're looking for a skilled DevOps Engineer to streamline our deployment processes and maintain our cloud infrastructure. You'll work with cutting-edge tools and technologies.

Key Responsibilities:
- Manage AWS cloud infrastructure
- Implement CI/CD pipelines
- Monitor system performance and reliability
- Automate deployment processes
- Ensure security best practices

Requirements:
- 4+ years of DevOps experience
- Strong knowledge of AWS services
- Experience with Docker and Kubernetes
- Proficiency in scripting languages
- Knowledge of monitoring tools`,
        company: employers[1]._id,
        location: 'Chennai, Tamil Nadu',
        salaryRange: {
          min: 1100000,
          max: 1900000,
          currency: 'INR',
          period: 'annual'
        },
        experience: {
          min: 4,
          max: 8
        },
        jobType: 'Full-time',
        workMode: 'On-site',
        category: 'Technology',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'],
        requirements: [
          'Bachelor\'s degree in Engineering',
          '4+ years of DevOps experience',
          'AWS certification preferred',
          'Experience with infrastructure as code',
          'Strong automation skills'
        ],
        responsibilities: [
          'Manage cloud infrastructure',
          'Build and maintain CI/CD pipelines',
          'Monitor system health and performance',
          'Implement security measures',
          'Support development teams'
        ],
        benefits: [
          'Competitive salary',
          'Certification reimbursements',
          'Health benefits',
          'Learning opportunities',
          'Team building activities'
        ],
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'active',
        companySize: '201-1000',
        educationLevel: 'Bachelor\'s'
      }
    ];

    // Create jobs
    const createdJobs = await Job.create(jobs);
    console.log('Created jobs:', createdJobs.length);

    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@jobportal.com / admin123');
    console.log('Employer: hr@techcorp.com / employer123');
    console.log('Job Seeker: john@example.com / jobseeker123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;