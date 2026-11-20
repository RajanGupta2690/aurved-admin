// Common Types
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string;
  permissions: Permission[];
  avatar?: string;
}

export type UserRole = 
  | 'school_owner' 
  | 'principal' 
  | 'administrator' 
  | 'accountant'
  | 'admission_officer'
  | 'teacher'
  | 'academic_coordinator'
  | 'receptionist'
  | 'librarian'
  | 'transport_manager';

export type Permission = string;

export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'college' | 'university' | 'institute';
  logo?: string;
  address: string;
  contact: string;
  email: string;
  enabledModules: ModuleType[];
}

export type ModuleType = 
  | 'dashboard'
  | 'admission'
  | 'students'
  | 'parents'
  | 'academics'
  | 'attendance'
  | 'timetable'
  | 'examination'
  | 'fees'
  | 'staff'
  | 'homework'
  | 'communication'
  | 'transport'
  | 'library'
  | 'inventory'
  | 'reports'
  | 'settings';

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Class {
  id: string;
  name: string;
  academicSessionId: string;
  sections: Section[];
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity: number;
  classTeacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email?: string;
  phone?: string;
  admissionDate: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  parentId: string;
  photo?: string;
}

export interface Parent {
  id: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  address: string;
  studentIds: string[];
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  joiningDate: string;
  qualification: string;
  experience: number;
  departmentId: string;
  designationId: string;
  subjects: string[];
  address: string;
  status: 'active' | 'inactive' | 'on_leave';
  photo?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday';
  remarks?: string;
  markedBy: string;
  markedAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  academicSessionId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  installments: FeeInstallment[];
}

export interface FeeInstallment {
  id: string;
  feeId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Examination {
  id: string;
  name: string;
  academicSessionId: string;
  examType: 'unit_test' | 'midterm' | 'final' | 'practical';
  startDate: string;
  endDate: string;
  classIds: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Enquiry {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  classId: string;
  enquiryDate: string;
  status: 'new' | 'contacted' | 'visited' | 'converted' | 'closed';
  followUpDate?: string;
  remarks?: string;
}

export interface Application {
  id: string;
  enquiryId?: string;
  applicationNumber: string;
  studentName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  classId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  applicationDate: string;
  status: 'submitted' | 'under_review' | 'documents_pending' | 'approved' | 'rejected';
  documents: ApplicationDocument[];
  approvedBy?: string;
  approvedDate?: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  assignedDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'expired';
  attachments?: string[];
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  publishDate: string;
  expiryDate?: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  classIds?: string[];
  priority: 'low' | 'medium' | 'high';
  publishedBy: string;
  status: 'draft' | 'published' | 'expired';
}
