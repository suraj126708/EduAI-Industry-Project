# Teacher Management System - Frontend

A modern React-based frontend application for the Teacher Management System, built with Vite, Material-UI, and Firebase Authentication.

## 🚀 Features

### Core Functionality

- **User Authentication**: Firebase-based authentication with email/password and Google OAuth
- **Role-Based Access Control**: Admin, Teacher, and Student roles with appropriate permissions
- **Question Paper Generation**: Create and manage question papers with various question types
- **File Upload System**: Upload answer sheets and exam materials
- **Admin Dashboard**: Comprehensive admin panel for system management
- **Responsive Design**: Mobile-first design using Tailwind CSS and Material-UI

### Key Modules

- **Authentication System**: Login, registration, and profile management
- **Question Paper Management**: Create, edit, and manage question papers
- **File Management**: Upload and process answer sheets and documents
- **Admin Panel**: User management, system statistics, and administrative functions
- **Dashboard**: Role-specific dashboards with relevant information

## 🛠️ Technology Stack

### Frontend Framework

- **React 19.1.1**: Modern React with latest features
- **Vite 7.1.5**: Fast build tool and development server
- **React Router DOM 7.7.1**: Client-side routing

### UI & Styling

- **Material-UI (MUI) 7.2.0**: Comprehensive React component library
- **Tailwind CSS 4.1.11**: Utility-first CSS framework
- **Lucide React 0.536.0**: Beautiful icon library
- **React Icons 5.5.0**: Additional icon components

### Authentication & Backend Integration

- **Firebase 12.0.0**: Authentication and real-time features
- **Axios 1.11.0**: HTTP client for API requests

### File Handling

- **XLSX 0.18.5**: Excel file processing
- **File-saver 2.0.5**: File download functionality

### Development Tools

- **ESLint 9.30.1**: Code linting and formatting
- **PostCSS 8.5.6**: CSS processing
- **Autoprefixer 10.4.21**: CSS vendor prefixing

## 📁 Project Structure

```
frontend/
├── public/                     # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── question/         # Question-related components
│   │   │   ├── DurationPickerModal.jsx
│   │   │   ├── PaperDetailsForm.jsx
│   │   │   ├── QuestionRow.jsx
│   │   │   ├── QuestionsTable.jsx
│   │   │   ├── QuestionTypeInput.jsx
│   │   │   ├── SuccessModal.jsx
│   │   │   ├── TopicsDropdown.jsx
│   │   │   └── TopicsSelector.jsx
│   │   ├── Button.jsx
│   │   ├── CustomDropdown.jsx
│   │   ├── Dropdown.jsx
│   │   ├── ErrorMessage.jsx
│   │   ├── Modal.jsx
│   │   ├── PageNotFound.jsx
│   │   └── Unauthorized.jsx
│   ├── contexts/             # React Context providers
│   │   └── AuthContext.jsx   # Authentication context
│   ├── firebase/             # Firebase configuration
│   │   └── firebase.js       # Firebase services and auth
│   ├── Pages/                # Page components
│   │   ├── Admin/            # Admin-specific pages
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Papers.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── Students.jsx
│   │   │   └── Users.jsx
│   │   ├── AnswerSheetUpload.jsx
│   │   ├── ExamPlatformUpload.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── PaperFormat.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── QuestionPaperGeneration.jsx
│   │   └── Register.jsx
│   ├── utils/                # Utility functions
│   │   └── api.js           # API configuration and helpers
│   ├── assets/              # Static assets
│   │   ├── QuestionType.json
│   │   └── react.svg
│   ├── App.jsx             # Main application component
│   ├── App.css             # Global styles
│   ├── index.css           # Tailwind CSS imports
│   └── main.jsx            # Application entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── eslint.config.js        # ESLint configuration
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Firebase project setup
- Backend API running (see backend documentation)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd IndustryProject/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:

   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # API Configuration
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Alias for dev command
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🔐 Authentication Flow

### User Roles

- **Admin**: Full system access, user management, system statistics
- **Teacher**: Question paper creation, file uploads, student management
- **Student**: View papers, submit answers (future feature)

### Authentication Methods

1. **Email/Password**: Traditional authentication
2. **Google OAuth**: Social login integration
3. **Firebase Token**: JWT-based API authentication

### Protected Routes

- All routes except `/login` and `/register` require authentication
- Admin routes (`/admin/*`) require admin role
- Role-based component rendering throughout the application

## 🎨 UI Components

### Core Components

- **Button**: Customizable button component with variants
- **Modal**: Reusable modal dialog component
- **Dropdown**: Custom dropdown with search functionality
- **ErrorMessage**: Standardized error display component

### Question Management Components

- **QuestionsTable**: Display and manage question lists
- **QuestionRow**: Individual question row with edit/delete actions
- **QuestionTypeInput**: Input component for different question types
- **TopicsSelector**: Multi-select component for question topics
- **DurationPickerModal**: Time duration selection modal
- **PaperDetailsForm**: Form for paper metadata

### Admin Components

- **AdminLayout**: Layout wrapper for admin pages
- **Dashboard**: Admin dashboard with statistics
- **User Management**: Teacher and student management interfaces

## 🔌 API Integration

### Backend Communication

- **Base URL**: Configurable via environment variables
- **Authentication**: Automatic Firebase token injection
- **Error Handling**: Centralized error handling and user feedback
- **Request/Response Logging**: Development debugging support

### Key API Endpoints

- `/auth/*` - Authentication and user management
- `/teachers/*` - Teacher-related operations
- `/admin/*` - Administrative functions
- `/books/*` - Book and resource management

## 🎯 Key Features

### Question Paper Generation

- **Multiple Question Types**: MCQ, Short Answer, Long Answer, etc.
- **Topic Selection**: Organize questions by subjects and topics
- **Duration Management**: Set time limits for papers
- **Export Functionality**: Generate PDF and Excel formats

### File Management

- **Answer Sheet Upload**: Process student answer sheets
- **Document Processing**: Handle various file formats
- **Batch Operations**: Bulk file processing capabilities

### Admin Dashboard

- **System Statistics**: User counts, activity metrics
- **User Management**: Create, edit, and manage user accounts
- **Role Management**: Assign and modify user roles
- **System Monitoring**: Track system health and performance

## 🔧 Configuration

### Vite Configuration

- **Tailwind CSS**: Integrated via Vite plugin
- **React Plugin**: Fast refresh and HMR support
- **Build Optimization**: Production-ready builds

### ESLint Configuration

- **React Rules**: React-specific linting rules
- **Hooks Rules**: React Hooks linting
- **Code Quality**: Consistent code formatting

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

```env
VITE_API_BASE_URL=https://your-production-api.com/api
VITE_FIREBASE_API_KEY=your_production_firebase_key
# ... other production Firebase config
```

### Deployment Options

- **Vercel**: Recommended for React applications
- **Netlify**: Static site hosting
- **CloudFront**: Scalable static hosting
- **Firebase Hosting**: Integrated with Firebase services

## 🤝 Contributing

### Development Guidelines

1. Follow ESLint configuration
2. Use functional components with hooks
3. Implement proper error handling
4. Write reusable components
5. Follow Material-UI design patterns

### Code Style

- Use camelCase for variables and functions
- Use PascalCase for components
- Use descriptive variable names
- Add comments for complex logic

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Router Documentation](https://reactrouter.com/)

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Configuration**: Ensure all environment variables are set
2. **API Connection**: Verify backend server is running
3. **Authentication**: Check Firebase project configuration
4. **Build Issues**: Clear node_modules and reinstall dependencies

### Development Tips

- Use browser dev tools for debugging
- Check console for API request/response logs
- Verify Firebase authentication state
- Test with different user roles

## 📄 License

This project is part of the Teacher Management System. See the main project documentation for licensing information.
