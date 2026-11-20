# AURVED - School Admin Web Application

A complete, premium-quality, enterprise-grade School Administration Web Application built with React, TypeScript, and Tailwind CSS.

## 🎯 Overview

AURVED is a unified Education Management Platform designed to streamline school administration, student management, and daily operations. This is the first institution-specific implementation, with architecture designed for future expansion to colleges, universities, and institutes.

## ✨ Features

### Core Modules (Implemented)

1. **Dashboard** - Comprehensive overview with KPIs, attendance, fees, and notifications
2. **Admissions** - Enquiry and application management with document verification
3. **Students** - Complete student lifecycle management with detailed profiles
4. **Attendance** - Daily attendance marking with bulk actions and reports
5. **Fees & Accounts** - Fee collection, payment tracking, and financial overview
6. **Examinations** - Exam scheduling, marks entry, and result processing

### Additional Modules (Placeholder)

7. **Parents** - Parent-student relationships and communication
8. **Academic Management** - Sessions, classes, sections, and subjects
9. **Timetable** - Class and teacher schedule management
10. **Teachers & Staff** - Employee management and allocation
11. **Homework** - Assignment management and submissions
12. **Communication** - Notices and announcements
13. **Transport** - Vehicle and route management
14. **Library** - Book inventory and issue/return
15. **Inventory** - Asset and stock management
16. **Reports & Analytics** - Comprehensive reporting system
17. **Settings** - Institution and system configuration

## 🛠️ Technology Stack

- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Router v7** - Client-side routing
- **Lucide Icons** - Beautiful icon system
- **Vite** - Fast build tool

## 🎨 Design System

### Brand Colors
- **Primary (Copper/Terracotta)**: `#c08968` - Main brand accent
- **Charcoal**: `#3d3d3d` - Dark text and navigation
- **Warm Neutrals**: Background and secondary surfaces
- **White**: Main content surfaces

### Design Principles
- Clean, minimal, and premium appearance
- Comfortable information density
- Generous whitespace
- Consistent spacing (4px increments)
- Professional dashboards and data tables
- Fully responsive (desktop, tablet, mobile)

## 📁 Project Structure

```
aurved-admin/
├── src/
│   ├── app/                    # Application setup
│   │   └── router.tsx         # Route configuration
│   ├── core/                   # Core services
│   │   ├── auth/              # Authentication (future)
│   │   ├── api/               # API client (future)
│   │   └── guards/            # Route protection (future)
│   ├── shared/                 # Shared components
│   │   ├── components/        # Reusable UI components
│   │   └── layouts/           # Layout components
│   ├── features/              # Feature modules
│   │   ├── dashboard/
│   │   ├── admission/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── fees/
│   │   ├── examination/
│   │   └── ...               # Other modules
│   ├── types/                 # TypeScript types
│   ├── data/                  # Mock data
│   └── main.tsx              # Application entry
├── public/                    # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd aurved-admin

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## 🔐 Security & Architecture

### Multi-Tenant Ready
- Institution context management
- Role-based access control (RBAC)
- Permission-based UI rendering
- Module visibility based on entitlements

### Security Principles
- Frontend never treated as security boundary
- Backend authorization required for all operations
- Protected routes and route guards
- Encrypted sensitive data storage
- Audit logs for financial transactions

### API Integration Ready
- Centralized API client structure
- Environment-based configuration
- Request/response interceptors
- Error handling and retry logic

## 📊 Mock Data

The application includes realistic mock data for:
- Institution profile
- Academic sessions
- Classes and sections
- Students (4 sample students)
- Parents
- Teachers
- Attendance records
- Fee records
- Examinations
- Enquiries and applications

## 🎯 Development Roadmap

### Phase 1 - Foundation ✅
- Application shell
- Design system
- Dashboard
- Core navigation

### Phase 2 - Core Modules ✅
- Admissions
- Students
- Attendance
- Fees
- Examinations

### Phase 3 - Operations (Next)
- Parents
- Academic Management
- Timetable
- Staff Management

### Phase 4 - Additional Features
- Homework
- Communication
- Transport
- Library
- Inventory
- Reports

### Phase 5 - Backend Integration
- API integration
- Authentication
- Real-time updates
- File uploads
- Payment gateway

### Phase 6 - Production
- Performance optimization
- Testing
- Security hardening
- Deployment
- Documentation

## 🧪 Key Features Implemented

### Dashboard
- KPI cards (students, teachers, attendance, fees)
- Attendance overview with charts
- Fee collection summary
- Upcoming examinations
- Recent notices
- Quick actions

### Students
- Searchable student list
- Advanced filtering
- Detailed student profiles
- Tabbed information display
- Parent information
- Academic history
- Fee records
- Attendance tracking

### Attendance
- Date and class selection
- Bulk attendance marking
- Visual attendance status
- Real-time statistics
- Attendance percentage
- Export functionality

### Fees
- Fee dashboard with stats
- Student-wise fee records
- Payment status tracking
- Collection analytics
- Overdue management

### Examinations
- Exam scheduling
- Multiple exam types
- Status tracking
- Class-wise organization
- Result management

## 🎨 UI Components

### Reusable Components
- Navigation (Sidebar, Header, Breadcrumbs)
- Data Tables (sortable, paginated, searchable)
- Forms (validated, multi-step)
- Cards and KPI widgets
- Badges and status indicators
- Buttons and actions
- Loading and empty states

### Page Templates
- Dashboard template
- List/Table template
- Detail view template
- Form template
- Reports template

## 📱 Responsive Design

- **Desktop**: Full sidebar, multi-column layouts
- **Tablet**: Collapsible sidebar, adaptive grids
- **Mobile**: Compact navigation, single-column forms

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is proprietary and confidential.

## 👥 Team

Built for AURVED Education Platform

---

**Note**: This is a frontend implementation with mock data. Backend API integration, authentication, and production deployment are planned for future phases.
