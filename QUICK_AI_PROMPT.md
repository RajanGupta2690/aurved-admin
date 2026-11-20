# 🚀 Quick AI Prompt - AURVED Admin

**Copy-paste this to any AI assistant to start working:**

---

## 📋 Project Brief

I'm working on **AURVED School Admin** - a complete education management platform frontend built with React + TypeScript + Tailwind CSS.

**Project Location**: `/Users/appsmartz/IdeaProjects/aurved-admin`

**Key Info**:
- React 19 + TypeScript + Tailwind CSS + Vite
- Feature-based architecture
- Mock data in `src/data/mockData.ts`
- Routes in `src/app/router.tsx`
- 6 modules complete, 11 need implementation

---

## 🎨 Brand Colors (MUST USE)

```javascript
Primary (Copper): #c08968
Charcoal (Dark): #3d3d3d
Warm Background: #fafaf9
Success: #10b981
Warning: #f59e0b
Error: #ef4444
```

---

## 📂 Structure Pattern

```
src/features/MODULE_NAME/
├── pages/          # Page components
├── components/     # Feature components
├── hooks/          # Custom hooks
└── types/          # Types (optional)
```

---

## 🎯 Page Template

```typescript
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { mockData } from '../../../data/mockData';

export default function PageName() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950">Title</h1>
          <p className="text-sm text-charcoal-600 mt-1">Description</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add New
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-charcoal-600 mb-1">Metric</p>
          <p className="text-2xl font-bold text-charcoal-950">Value</p>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        {/* Your content */}
      </div>
    </div>
  );
}
```

---

## ✅ Implemented Modules

1. Dashboard (`/`)
2. Admissions (`/admissions`)
3. Students (`/students`)
4. Attendance (`/attendance`)
5. Fees (`/fees`)
6. Examinations (`/examinations`)

---

## 🔄 Need Implementation

7. Parents (`/parents`)
8. Academics (`/academics/*`)
9. Timetable (`/timetable`)
10. Staff (`/staff`)
11. Homework (`/homework`)
12. Communication (`/communication`)
13. Transport (`/transport`)
14. Library (`/library`)
15. Inventory (`/inventory`)
16. Reports (`/reports`)
17. Settings (`/settings`)

---

## 📝 When Adding Features

1. Create folder: `src/features/MODULE_NAME/pages/`
2. Create page: `ModuleNamePage.tsx`
3. Add route in `src/app/router.tsx`
4. Use mock data from `src/data/mockData.ts`
5. Follow design system colors
6. Use existing components from `src/shared/components/`

---

## 🎨 Pre-built Classes

```css
.btn-primary     /* Primary button */
.btn-secondary   /* Secondary button */
.btn-ghost       /* Ghost button */
.card            /* Card container */
.badge           /* Status badge */
.badge-success   /* Green badge */
.badge-warning   /* Orange badge */
.badge-error     /* Red badge */
.input           /* Form input */
.sidebar-item    /* Sidebar navigation */
```

---

## 🛠️ Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview build
```

---

## 📚 Full Documentation

Check these files in project root:
- `AI_DEVELOPMENT_PROMPT.md` - Complete guide
- `README.md` - Project overview
- `ARCHITECTURE.md` - Technical details
- `PROJECT_SUMMARY.md` - Feature status

---

## 🎯 Task Examples

**"Add Parents module with list and detail pages"**
**"Create Timetable page with weekly view"**
**"Implement Library module with book listing"**
**"Add Reports dashboard with charts"**

---

**Ready to work! 🚀**
