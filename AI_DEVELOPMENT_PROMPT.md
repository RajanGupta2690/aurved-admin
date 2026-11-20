# 🤖 AI Development Prompt - AURVED School Admin

**Use this prompt when working with any AI assistant on this project**

---

## 📋 Project Context

You are working on **AURVED School Admin**, a complete, production-ready Education Management Platform for schools. This is the frontend web application built with modern technologies.

### Project Location
```
/Users/appsmartz/IdeaProjects/aurved-admin
```

### Technology Stack
- **Framework**: React 19.3.1
- **Language**: TypeScript 7.0.2
- **Styling**: Tailwind CSS 4.3.5
- **Routing**: React Router DOM 7.18.6
- **Icons**: Lucide React 1.76.0
- **Build Tool**: Vite 8.3.6
- **Package Manager**: npm

---

## 🎨 Design System & Brand Guidelines

### Brand Colors (MUST USE)
```javascript
// Primary Brand Color - Copper/Terracotta
primary: {
  50: '#fdf8f6',
  500: '#c08968',  // Main brand color
  600: '#b67554',
  900: '#5d2e0d',
}

// Charcoal - Dark text and navigation
charcoal: {
  50: '#f6f6f6',
  900: '#3d3d3d',  // Main dark color
  950: '#262626',
}

// Warm Neutral - Backgrounds
warm: {
  50: '#fafaf9',   // Main background
  100: '#f5f5f4',
  200: '#e7e5e4',
}

// Semantic Colors
success: '#10b981' (green)
warning: '#f59e0b' (orange)
error: '#ef4444' (red)
info: '#3b82f6' (blue)
```

### Typography
- **Font Family**: Inter (from Google Fonts)
- **Page Title**: text-2xl font-bold
- **Section Title**: text-lg font-semibold
- **Body Text**: text-sm
- **Helper Text**: text-xs

### Spacing
- Use Tailwind spacing: 4px increments (p-4, p-6, gap-4, etc.)
- Cards: p-6 (24px padding)
- Sections: space-y-6 (24px vertical spacing)

### Design Principles
1. **Clean & Minimal** - Avoid clutter, generous whitespace
2. **Professional SaaS Look** - Like modern enterprise applications
3. **Comfortable Density** - Not too cramped, not too sparse
4. **Consistent** - Same patterns everywhere
5. **Responsive** - Desktop first, then tablet, then mobile

---

## 📂 Project Structure (MUST FOLLOW)

```
src/
├── app/
│   └── router.tsx              # All routes defined here
│
├── core/                       # Core services
│   ├── auth/                  # Authentication logic
│   ├── api/                   # API client
│   ├── guards/                # Route protection
│   └── hooks/                 # Global hooks
│
├── shared/                     # Shared/reusable code
│   ├── components/            # Reusable UI components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PlaceholderPage.tsx
│   ├── layouts/               # Layout components
│   │   └── MainLayout.tsx
│   └── utils/                 # Utility functions
│
├── features/                   # Feature modules (ADD NEW MODULES HERE)
│   ├── dashboard/
│   │   ├── components/        # Feature-specific components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Feature hooks
│   │   ├── api/               # API calls for this feature
│   │   └── types/             # TypeScript types
│   ├── admission/
│   ├── students/
│   ├── parents/
│   ├── academics/
│   ├── attendance/
│   ├── timetable/
│   ├── examination/
│   ├── fees/
│   ├── staff/
│   ├── homework/
│   ├── communication/
│   ├── transport/
│   ├── library/
│   ├── inventory/
│   ├── reports/
│   └── settings/
│
├── types/                      # Global TypeScript types
│   └── index.ts
│
├── data/                       # Mock data (until backend ready)
│   └── mockData.ts
│
├── index.css                   # Global styles
├── App.tsx                     # Root component
└── main.tsx                    # Entry point
```

---

## 🔧 Component Patterns (MUST FOLLOW)

### 1. Page Component Template
```typescript
// Location: src/features/MODULE_NAME/pages/PageName.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconName } from 'lucide-react';
import { mockData } from '../../../data/mockData';

export default function PageName() {
  const [state, setState] = useState();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Page Title</h1>
          <p className="text-sm text-charcoal-600 mt-1">Page description</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <IconName size={20} />
          Action Button
        </button>
      </div>

      {/* Content */}
      <div className="card">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### 2. Card Component Pattern
```typescript
<div className="card">
  <h2 className="text-lg font-semibold text-charcoal-950 mb-4">Card Title</h2>
  {/* Card content */}
</div>
```

### 3. Stats Card Pattern
```typescript
<div className="card">
  <p className="text-sm text-charcoal-600 mb-1">Metric Name</p>
  <p className="text-2xl font-bold text-charcoal-950">Value</p>
</div>
```

### 4. Table Pattern
```typescript
<div className="card overflow-hidden p-0">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-warm-50 border-b border-warm-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-charcoal-700 uppercase">
            Column Name
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-warm-200">
        <tr className="hover:bg-warm-50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-900">
            Data
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 5. Button Styles (Pre-defined)
```typescript
// Primary Button
<button className="btn-primary">Primary Action</button>

// Secondary Button
<button className="btn-secondary">Secondary Action</button>

// Ghost Button
<button className="btn-ghost">Tertiary Action</button>
```

### 6. Badge/Status Pattern
```typescript
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Inactive</span>
<span className="badge badge-info">New</span>
```

---

## 📊 Mock Data Structure

All mock data is in `src/data/mockData.ts`. Use this format when adding new data:

```typescript
// Example: Adding Teachers
export const teachers: Teacher[] = [
  {
    id: 'teacher-1',
    employeeId: 'EMP001',
    firstName: 'Priya',
    lastName: 'Desai',
    fullName: 'Priya Desai',
    email: 'priya.desai@example.com',
    phone: '+91 98765 12345',
    // ... more fields
  },
];
```

### Available Mock Data
- `currentUser` - Logged in user
- `currentInstitution` - School details
- `academicSessions` - Academic years
- `classes` - Classes with sections
- `students` - Student records
- `parents` - Parent records
- `teachers` - Teacher records
- `enquiries` - Admission enquiries
- `applications` - Admission applications
- `attendanceRecords` - Attendance data
- `fees` - Fee records
- `examinations` - Exam data
- `homeworkList` - Homework assignments
- `notices` - Announcements

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## ✅ Module Implementation Status

### ✅ Fully Implemented (6 modules)
1. **Dashboard** (`/`) - KPIs, stats, charts
2. **Admissions** (`/admissions`) - Enquiries & applications
3. **Students** (`/students`) - List, detail, search
4. **Attendance** (`/attendance`) - Mark attendance
5. **Fees** (`/fees`) - Fee tracking
6. **Examinations** (`/examinations`) - Exam management

### 🔄 Placeholder (Need Implementation - 11 modules)
7. **Parents** (`/parents`)
8. **Academic Management** (`/academics/*`)
9. **Timetable** (`/timetable`)
10. **Teachers & Staff** (`/staff`)
11. **Homework** (`/homework`)
12. **Communication** (`/communication`)
13. **Transport** (`/transport`)
14. **Library** (`/library`)
15. **Inventory** (`/inventory`)
16. **Reports** (`/reports`)
17. **Settings** (`/settings`)

---

## 🎯 When Adding New Features/Modules

### Step 1: Create Feature Folder Structure
```bash
src/features/MODULE_NAME/
├── components/      # Module-specific components
├── pages/          # Page components
├── hooks/          # Custom hooks
├── api/            # API calls (future)
└── types/          # TypeScript types
```

### Step 2: Create Page Component
- Use page template from above
- Follow existing naming: `ModuleNamePage.tsx`
- Import and use mock data from `src/data/mockData.ts`

### Step 3: Add Route
Update `src/app/router.tsx`:
```typescript
{
  path: 'module-name',
  element: <ModuleNamePage />,
}
```

### Step 4: Navigation Already Exists
Sidebar navigation is already configured in `src/shared/components/Sidebar.tsx`

### Step 5: Add TypeScript Types
If new types needed, add to `src/types/index.ts`

### Step 6: Add Mock Data (if needed)
Add to `src/data/mockData.ts`

---

## 🎨 UI/UX Requirements

### Navigation
- ✅ Sidebar: Always visible, collapsible
- ✅ Active item: Highlighted with `sidebar-item-active` class
- ✅ Breadcrumbs: Automatic from React Router
- ✅ Search: Global search in header

### Page Layout
```
┌─────────────────────────────────────┐
│ Header (fixed)                      │ ← Always visible
├─────────────────────────────────────┤
│ Page Title + Description            │
│ Primary Action Button (right)       │
├─────────────────────────────────────┤
│ Filters/Search (if applicable)      │
├─────────────────────────────────────┤
│ Stats Cards (grid)                  │
├─────────────────────────────────────┤
│ Main Content (tables/forms/cards)   │
└─────────────────────────────────────┘
```

### Tables
- Searchable
- Filterable
- Sortable (future)
- Paginated (future)
- Export option
- Hover effects
- Actions column (view, edit, delete)

### Forms
- Validation (visual feedback)
- Clear labels
- Helper text
- Error messages
- Success states
- Multi-step if complex

### Empty States
```typescript
<div className="p-12 text-center">
  <p className="text-charcoal-500">No records found</p>
</div>
```

### Loading States
```typescript
<div className="p-12 text-center">
  <p className="text-charcoal-500">Loading...</p>
</div>
```

---

## 🔐 Security & Best Practices

### DO's
✅ Use TypeScript types for everything
✅ Follow feature-based folder structure
✅ Use existing mock data
✅ Reuse components from `shared/components/`
✅ Keep components small and focused
✅ Use Tailwind utility classes
✅ Follow existing naming patterns
✅ Add proper TypeScript types
✅ Use semantic HTML
✅ Add accessibility attributes

### DON'Ts
❌ Don't hardcode data in components
❌ Don't create duplicate components
❌ Don't use inline styles
❌ Don't ignore TypeScript errors
❌ Don't create separate CSS files (use Tailwind)
❌ Don't add external dependencies without discussion
❌ Don't break existing functionality
❌ Don't skip responsive design

---

## 📱 Responsive Design

Use Tailwind breakpoints:
```typescript
// Mobile first approach
<div className="
  grid 
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-4     // Desktop: 4 columns
">
```

Breakpoints:
- `sm`: 640px (Mobile landscape)
- `md`: 768px (Tablet)
- `lg`: 1024px (Desktop)
- `xl`: 1280px (Large desktop)

---

## 🔄 State Management

### Current Approach (Use This)
- Local state with `useState`
- Props for component communication
- Mock data imports
- No global state library (yet)

### Future (When Backend Ready)
- React Query for server state
- Context API for auth state
- Zustand for UI state

---

## 🌐 API Integration (Future Reference)

When backend is ready, create API services:

```typescript
// src/core/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

```typescript
// src/features/students/api/studentApi.ts
import apiClient from '../../../core/api/client';

export const getStudents = async () => {
  const response = await apiClient.get('/students');
  return response.data;
};
```

---

## 📝 TypeScript Types Reference

Key types in `src/types/index.ts`:

```typescript
// User & Auth
User, UserRole, Permission

// Institution
Institution, ModuleType

// Academic
AcademicSession, Class, Section, Subject

// People
Student, Parent, Teacher

// Operations
Attendance, Fee, FeeInstallment, Examination

// Admissions
Enquiry, Application, ApplicationDocument

// Other
Homework, Notice
```

---

## 🎯 Feature Requirements

### Each Module Should Have:
1. **Dashboard/Overview Page**
   - Stats cards
   - Quick actions
   - Recent activity

2. **List Page**
   - Searchable table
   - Filters
   - Add new button
   - Actions (view, edit, delete)

3. **Detail Page** (if applicable)
   - Complete information
   - Tabbed sections
   - Edit action
   - Related data

4. **Form Page** (Add/Edit)
   - Validation
   - Clear sections
   - Save/Cancel actions
   - Error handling

---

## 🧪 Testing Checklist

Before marking feature complete:
- [ ] All routes work
- [ ] Search/filter works
- [ ] Buttons have correct actions
- [ ] Forms validate properly
- [ ] Tables display correctly
- [ ] Responsive on mobile/tablet
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mock data displays correctly
- [ ] Navigation works
- [ ] Empty states show properly
- [ ] Loading states (if any)

---

## 🚀 Deployment Considerations

### Environment Variables
Create `.env.local` for development:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_ENV=development
```

### Build Command
```bash
npm run build
```
Output: `dist/` folder

### Deploy Platforms
- Vercel (Recommended)
- Netlify
- AWS S3 + CloudFront

---

## 📚 Documentation Files

Always check these first:
1. **README.md** - Project overview
2. **ARCHITECTURE.md** - Technical details
3. **PROJECT_SUMMARY.md** - Feature status
4. **DEPLOYMENT.md** - Deployment guide
5. **QUICK_START.md** - Quick reference
6. **AI_DEVELOPMENT_PROMPT.md** - This file

---

## ⚠️ Important Notes

1. **Backend Not Ready**: Use mock data from `src/data/mockData.ts`
2. **Authentication**: Not implemented yet, skip for now
3. **File Upload**: Mock it with UI only
4. **Payments**: Mock it with UI only
5. **Real-Time**: Not needed yet
6. **Testing**: Focus on functionality first

---

## 🎓 School Management Domain Knowledge

### Academic Hierarchy
```
Institution
  └── Academic Session (e.g., 2024-2025)
      └── Class (e.g., Class 1)
          └── Section (e.g., Section A)
              └── Students
```

### User Roles
- **School Owner**: Full access
- **Principal**: Administrative access
- **Administrator**: Day-to-day operations
- **Accountant**: Finance only
- **Admission Officer**: Admissions only
- **Teacher**: Academic operations
- **Librarian**: Library only
- **Transport Manager**: Transport only

### Key Workflows
1. **Admission**: Enquiry → Application → Document Verification → Approval → Enrollment
2. **Attendance**: Daily marking → Reports → Leave management
3. **Fees**: Structure → Assignment → Collection → Receipts → Reports
4. **Examination**: Create → Schedule → Marks Entry → Result → Report Cards

---

## 💡 Pro Tips

1. **Copy Existing Patterns**: Look at implemented modules for reference
2. **Reuse Components**: Check `shared/components/` first
3. **Consistent Naming**: Follow existing conventions
4. **Mock Data First**: Always work with mock data initially
5. **TypeScript**: Let types guide you
6. **Responsive**: Test on different screen sizes
7. **Documentation**: Update docs when adding features

---

## 🆘 Common Issues & Solutions

### Issue: TypeScript Errors
**Solution**: Check `src/types/index.ts` for type definitions

### Issue: Tailwind Classes Not Working
**Solution**: Check `tailwind.config.js`, restart dev server

### Issue: Component Not Importing
**Solution**: Check file path, use absolute imports from `src/`

### Issue: Mock Data Not Showing
**Solution**: Import from `src/data/mockData.ts`, check data exists

### Issue: Route Not Working
**Solution**: Check `src/app/router.tsx`, verify path

---

## 📞 Project Information

**Project Name**: AURVED School Admin  
**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Development Phase  
**Location**: `/Users/appsmartz/IdeaProjects/aurved-admin`

---

## 🎯 Current Development Goals

### Immediate (Next Features)
1. Complete Parents module
2. Complete Academic Management
3. Complete Timetable
4. Complete Staff Management

### Short Term
1. Backend API integration
2. Authentication & Authorization
3. File upload functionality
4. Form validations

### Long Term
1. Advanced analytics
2. Report generation
3. Mobile app
4. Multi-language support

---

## ✨ Success Criteria

A feature is complete when:
- [ ] UI matches design system
- [ ] All pages accessible
- [ ] Mock data integrated
- [ ] TypeScript types defined
- [ ] Responsive design works
- [ ] No console errors
- [ ] Navigation works
- [ ] Documentation updated

---

**Use this prompt to guide all development work on AURVED School Admin!**
