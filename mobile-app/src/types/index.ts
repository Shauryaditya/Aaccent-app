// Core entity types matching your Prisma schema

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  isPublished: boolean;
  categoryId?: string;
  category?: Category;
  chapters?: Chapter[];
  attachments?: Attachment[];
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  muxData?: MuxData;
  userProgress?: UserProgress[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface MuxData {
  id: string;
  assetId: string;
  playbackId?: string;
  chapterId: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  courseId?: string;
  chapterId?: string;
  testChapterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface TestSeries {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  isPublished: boolean;
  categoryId: string;
  category?: Category;
  testChapters?: TestChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface TestChapter {
  id: string;
  title: string;
  description?: string;
  position: number;
  isPublished: boolean;
  testSeriesId: string;
  testSeries?: TestSeries;
  tests?: Test[];
  attachments?: Attachment[];
  submissions?: TestSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  testMode: 'OBJECTIVE' | 'DESCRIPTIVE';
  testChapterId: string;
  questions?: Question[];
  _count?: { questions: number };
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERICAL' | 'TRUE_FALSE';
  marks: number;
  negativeMarks: number;
  position: number;
  explanation?: string;
  imageUrl?: string;
  testId: string;
  options?: QuestionOption[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
  questionId: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  score?: number | null;
  totalMarks: number;
  percentage?: number | null;
  isPassed?: boolean | null;
  isCompleted: boolean;
  startedAt: string;
  completedAt?: string | null;
  test?: Pick<Test, 'id' | 'title' | 'duration' | 'totalMarks' | 'passingMarks'>;
  answers?: Answer[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  testAttemptId: string;
  questionId: string;
  question?: Question;
}

export interface ChapterSubmission {
  id: string;
  userId: string;
  chapterId: string;
  chapter?: Chapter;
  images: string[];
  annotatedImages: string[];
  status: 'SUBMITTED' | 'REVIEWED' | 'NEEDS_REVISION';
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSubmission {
  id: string;
  userId: string;
  testChapterId: string;
  testChapter?: TestChapter;
  pdfUrl: string;
  fileName?: string;
  fileSize?: number;
  attemptNo: number;
  marksAwarded?: number;
  feedback?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  annotatedPdfUrl?: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'NEEDS_REVISION';
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  studentId: string;
  teacherId: string;
  courseId?: string;
  course?: Course;
  testSeriesId?: string;
  testSeries?: TestSeries;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  category: 'BOARD' | 'JEE_MAINS' | 'JEE_ADVANCED' | 'NEET' | 'OTHER';
  type: 'PAST_PAPER' | 'SAMPLE_PAPER' | 'NOTES';
  subject: string;
  grade?: string;
  year?: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name?: string;
  grade?: string;
  board?: string;
  subjects: string[];
  targetExam?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Entitlements {
  courseIds: string[];
  testSeriesIds: string[];
}

export interface PaymentLink {
  paymentLinkId: string;
  url: string;
  amount: number;
  title: string;
}

export interface PaymentVerification {
  paid: boolean;
  status: string;
  type?: 'course' | 'testSeries';
  itemId?: string;
}

// Teacher-facing roster entry, resolved from Clerk on the backend
export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  grade?: string | null;
}

export interface StudentCourseProgress {
  courseId: string;
  title: string;
  imageUrl?: string | null;
  totalChapters: number;
  completedChapters: number;
  percentage: number;
}

export interface StudentProgressReport {
  student: StudentSummary;
  courses: StudentCourseProgress[];
  goals: Goal[];
  testSubmissions: TestSubmission[];
  chapterSubmissions: ChapterSubmission[];
  stats: {
    coursesEnrolled: number;
    testSeriesEnrolled: number;
    goalsCompleted: number;
    goalsTotal: number;
    submissionsPending: number;
  };
}

export interface TeacherStats {
  totals: {
    courses: number;
    publishedCourses: number;
    testSeries: number;
    publishedTestSeries: number;
    students: number;
    pendingSubmissions: number;
    openGoals: number;
  };
  revenue: {
    coursePurchases: number;
    testSeriesPurchases: number;
    estimatedTotal: number;
  };
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
  }>;
  recentSubmissions: TestSubmission[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type StudentTabParamList = {
  Home: undefined;
  MyCourses: undefined;
  Tests: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type TeacherTabParamList = {
  Dashboard: undefined;
  Courses: undefined;
  TestSeries: undefined;
  Submissions: undefined;
  Profile: undefined;
};

export type StudentStackParamList = {
  StudentTabs: undefined;
  CourseDetail: { courseId: string };
  ChapterView: { chapterId: string; courseId: string };
  TestDetail: { testSeriesId: string };
  TakeTest: { testId: string };
  TestResult: { attemptId: string };
  SubmitAssignment: { testSeriesId?: string; testChapterId?: string; courseId?: string; chapterId?: string };
  Resources: undefined;
};

export type TeacherStackParamList = {
  TeacherTabs: undefined;
  CreateCourse: undefined;
  EditCourse: { courseId: string };
  ManageChapters: { courseId: string };
  CreateTestSeries: undefined;
  EditTestSeries: { testSeriesId: string };
  ManageTests: { testSeriesId: string };
  CreateTest: { testChapterId: string };
  ManageQuestions: { testId: string };
  ReviewSubmission: { submissionId: string; type: 'chapter' | 'test' };
  Students: undefined;
  StudentProgress: { studentId: string };
  AssignGoal: { studentId?: string };
};







