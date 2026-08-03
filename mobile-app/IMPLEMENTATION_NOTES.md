# Implementation Notes for LMS Mobile App

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: React Native with Expo SDK 51
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Tabs)
- **State Management**: React Query + React Context
- **UI Library**: React Native Paper (Material Design)
- **Authentication**: Clerk
- **Video Player**: Expo Video (works with Mux playback URLs)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod (ready for implementation)

### Project Structure

```
/app/mobile-app/
├── App.tsx                    # Root component with providers
├── app.json                   # Expo configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── babel.config.js           # Babel configuration
│
├── assets/                   # App assets (icons, images)
│
└── src/
    ├── navigation/          # Navigation structure
    │   ├── AppNavigator.tsx        # Root navigator
    │   ├── AuthNavigator.tsx       # Auth flow
    │   ├── StudentNavigator.tsx    # Student app flow
    │   └── TeacherNavigator.tsx    # Teacher app flow
    │
    ├── screens/             # All app screens
    │   ├── auth/           # Login, signup screens
    │   ├── shared/         # Role selection
    │   ├── student/        # Student screens
    │   └── teacher/        # Teacher screens
    │
    ├── components/          # Reusable UI components
    │   ├── common/         # Shared components
    │   ├── student/        # Student-specific components
    │   └── teacher/        # Teacher-specific components
    │
    ├── services/           # API services
    │   ├── api.ts                 # Base API service
    │   ├── courseService.ts       # Course APIs
    │   ├── testService.ts         # Test/quiz APIs
    │   ├── submissionService.ts   # Submission APIs
    │   └── goalService.ts         # Goal APIs
    │
    ├── contexts/           # React contexts
    │   └── UserContext.tsx        # User role management
    │
    ├── hooks/              # Custom React hooks
    ├── utils/              # Utility functions
    │   ├── date.ts               # Date formatting
    │   ├── format.ts             # Currency, percentage
    │   └── helpers.ts            # General helpers
    │
    └── types/              # TypeScript definitions
        └── index.ts              # All type definitions
```

---

## 🎯 Key Design Decisions

### 1. Dual App in One
- Single codebase for both Student and Teacher apps
- Role selection after authentication
- Separate navigation flows based on role
- Easy to switch roles without re-login

### 2. API Integration
- All API calls go through service layer
- Automatic token injection via Axios interceptors
- React Query for caching and state management
- Error handling centralized

### 3. Video Playback
- Using Expo Video for simplicity
- Compatible with Mux playback URLs
- Supports both HLS streams and direct video URLs
- Fallback options available

### 4. Authentication Flow
1. User opens app → Clerk login
2. User authenticated → Role selection
3. Role saved → Navigate to appropriate app
4. Token stored → All API calls authenticated

---

## ✅ Fully Implemented Features

### Core Infrastructure
- ✅ Complete navigation structure
- ✅ API service layer with interceptors
- ✅ User role management with persistence
- ✅ Type-safe TypeScript throughout (`npx tsc --noEmit` is clean)
- ✅ Material Design UI components
- ✅ Loading and empty states
- ✅ Error handling with toasts
- ✅ Pull-to-refresh on lists
- ✅ Clerk Google OAuth sign-in

### Student App
- ✅ Course browsing with categories and search
- ✅ Course detail view with paywall
- ✅ Chapter list with progress indicators
- ✅ Video player for chapters
- ✅ Mark chapters complete/incomplete
- ✅ View purchased courses
- ✅ View assigned goals
- ✅ Test series browsing and detail
- ✅ Photo submission for test chapters (UploadThing)
- ✅ Resources library with category/type/subject filters
- ✅ Razorpay checkout for courses and test series
- ✅ Profile with role switching

### Teacher App
- ✅ Dashboard with enrolment, revenue and submission stats
- ✅ Course CRUD and chapter management
- ✅ Test series CRUD and test chapter management
- ✅ Objective test creation (`CreateTestScreen`)
- ✅ Test list with publish toggle (`ManageTestsScreen`)
- ✅ Question bank editor with options and answer keys (`ManageQuestionsScreen`)
- ✅ Student roster and per-student progress reports
- ✅ Goal assignment tied to a course or test series
- ✅ Test submission review with annotated file upload

---

## 🚧 Features Still Outstanding

### Student objective test-taking
**Locations**: `src/screens/student/TakeTestScreen.tsx`, `src/screens/student/TestResultScreen.tsx`

Both are still `EmptyState` placeholders. Teachers can now build objective tests
(questions, options, marks, negative marking) via the question bank, and
`GET /api/tests/:testId/questions` already strips the answer key for non-owners,
so the student-facing half is the remaining work:

- Timer + question navigator UI
- Answer selection per question type (single, multiple, numerical, true/false)
- Submit-and-score flow

The `TestAttempt` and `Answer` Prisma models exist, but **no API routes back them
yet**. Taking a test end to end needs:

- `POST /api/tests/:testId/attempt` — start (or resume) an attempt
- `PATCH /api/attempts/:attemptId/answers` — save an answer
- `POST /api/attempts/:attemptId/complete` — grade and close the attempt
- `GET /api/attempts/:attemptId` — attempt with results for `TestResultScreen`

### Chapter (course) assignment submissions
`submissionService.submitChapterAssignment` and the supporting routes exist, but
no screen navigates to `SubmitAssignment` with a `courseId`/`chapterId` pair yet
— only the test-chapter flow is wired up.

### Email/password sign-up
`SignUpScreen.tsx` is still a shell. Google OAuth covers sign-up today, so this
only matters if you want a non-Google option.

---

## 🔌 Backend Routes Added For Mobile

These were added to the Next.js app so the mobile services resolve. All are
additive — no existing web route or page was changed.

| Route | Methods | Purpose |
|---|---|---|
| `/api/resources` | `GET` (added) | Resources library listing with filters |
| `/api/student/profile` | `GET` (added) | Read own student profile |
| `/api/goals` | `POST` | Create a goal for a course or test series |
| `/api/goals/teacher` | `GET` | Goals the teacher has assigned |
| `/api/submissions/chapters` | `GET` | Student's own chapter submissions |
| `/api/submissions/chapters/all` | `GET` | Teacher's inbox of chapter submissions |
| `/api/submissions/chapters/:submissionId/review` | `PATCH` | Review without course/chapter ids in path |
| `/api/students` | `GET` | Teacher's enrolled-student roster (Clerk-resolved) |
| `/api/students/:studentId/progress` | `GET` | Per-student progress report |
| `/api/tests` | `GET`, `POST` | List/create tests in a test chapter |
| `/api/tests/:testId` | `GET`, `PATCH`, `DELETE` | Test CRUD, publish via `isPublished` |
| `/api/tests/:testId/questions` | `GET`, `POST` | Question bank (answer key stripped for non-owners) |
| `/api/questions/:questionId` | `PATCH`, `DELETE` | Edit/delete a question and its options |
| `/api/teacher/stats` | `GET` | Dashboard aggregates |
| `/api/payments/link` | `POST` | Create a Razorpay Payment Link |
| `/api/payments/verify` | `POST` | Confirm payment with Razorpay, grant access |
| `/api/payments/entitlements` | `GET` | What the user has already paid for |

**Ownership rules**: every teacher route resolves ownership through the parent
record (`test → testChapter → testSeries.userId`, `chapterSubmission → chapter →
course.userId`) rather than trusting an id from the client.

---

## 💳 How Mobile Payments Work

The app does **not** bundle `react-native-razorpay`. That is a native module and
would break Expo Go for the whole team. Instead it uses Razorpay **Payment
Links**:

1. `POST /api/payments/link` creates a link server-side (price read from the DB,
   never from the client) and stores `{ userId, type, itemId }` in the link's notes.
2. The app opens `link.short_url` with `WebBrowser.openBrowserAsync`.
3. When the browser closes, `POST /api/payments/verify` fetches the link from
   Razorpay, checks `status === 'paid'` **and** that `notes.userId` matches the
   caller, then creates the `Purchase` / `TestSeriesPurchase` idempotently.

Because the paid status is read from Razorpay rather than sent by the client, a
user dismissing the browser early just sees "payment not completed".

**Required env vars** (not currently in `.env`):

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

Without them `/api/payments/*` returns `503 Payments are not configured`.

The shared flow lives in `src/hooks/usePurchase.ts` — use it rather than calling
`paymentService` directly, so entitlement caches invalidate consistently.

---

## 🔧 Technical Implementation Guide

### Adding a New Feature

**Step 1: Define Types**
```typescript
// src/types/index.ts
export interface NewFeature {
  id: string;
  name: string;
  // ... other fields
}
```

**Step 2: Create API Service**
```typescript
// src/services/newFeatureService.ts
import apiService from './api';
import { NewFeature } from '../types';

export const newFeatureService = {
  getAll: async (): Promise<NewFeature[]> => {
    return apiService.get('/api/newfeature');
  },
  
  create: async (data: Partial<NewFeature>): Promise<NewFeature> => {
    return apiService.post('/api/newfeature', data);
  },
};
```

**Step 3: Create Screen Component**
```typescript
// src/screens/.../NewFeatureScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { newFeatureService } from '../../services/newFeatureService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const NewFeatureScreen: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['newFeature'],
    queryFn: newFeatureService.getAll,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      {/* Your UI here */}
    </View>
  );
};

export default NewFeatureScreen;
```

**Step 4: Add to Navigation**
```typescript
// Update appropriate Navigator file
<Stack.Screen
  name="NewFeature"
  component={NewFeatureScreen}
  options={{ title: 'New Feature' }}
/>
```

### Working with Forms

Use React Hook Form + Zod for validation:

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const MyFormScreen: React.FC = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // Handle form submission
  };

  return (
    <View>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            error={!!errors.title}
          />
        )}
      />
      <Button onPress={handleSubmit(onSubmit)}>Submit</Button>
    </View>
  );
};
```

### Image/File Upload

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Pick image
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    // Upload to server
    await apiService.uploadFile('/api/upload', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    });
  }
};

// Pick document
const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
  });

  if (result.type === 'success') {
    // Upload document
  }
};
```

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Objective test-taking**: teachers can author tests, students cannot yet sit them (see above)
2. **Video Upload**: Teachers can't upload videos from mobile - use web app
3. **PDF Annotation**: reviewers upload an annotated file rather than annotating in-app
4. **Offline Mode**: Not implemented - requires network connection
5. **Push Notifications**: Structure exists but not fully integrated
6. **Payments**: needs `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set on the server
7. **Large uploads**: `uploadThingService` rejects files needing multipart (>16MB)

### Performance Considerations

1. **Large Lists**: Consider implementing virtualization for long lists
2. **Image Loading**: Use proper image caching library for better performance
3. **Video Buffering**: Might need optimization for slower networks
4. **API Calls**: React Query handles caching, but might need adjustment

---

## 📱 Testing Strategy

### Manual Testing Checklist

**Student Flow:**
- [ ] Sign in with Clerk
- [ ] Select student role
- [ ] Browse courses
- [ ] Search courses
- [ ] View course details
- [ ] View chapter
- [ ] Play video
- [ ] Mark chapter complete
- [ ] View goals
- [ ] Switch to teacher role
- [ ] Sign out

**Teacher Flow:**
- [ ] Sign in
- [ ] Select teacher role
- [ ] View dashboard placeholders
- [ ] Check all navigation tabs
- [ ] Switch to student role
- [ ] Sign out

### Device Testing

Test on:
- [ ] iOS device (iPhone)
- [ ] Android device
- [ ] Different screen sizes
- [ ] Different OS versions

---

## 🚀 Deployment Checklist

Before production release:

### Configuration
- [ ] Update API_BASE_URL to production
- [ ] Add production Clerk keys
- [ ] Configure proper app name and slug
- [ ] Set correct bundle identifier/package name
- [ ] Update app version

### Assets
- [ ] Replace placeholder icon (1024x1024)
- [ ] Replace splash screen (1284x2778)
- [ ] Add adaptive icon for Android
- [ ] Test all assets on device

### Functionality
- [ ] Test all core features
- [ ] Verify API connectivity
- [ ] Check authentication flow
- [ ] Test payment integration
- [ ] Verify video playback
- [ ] Test on both iOS and Android

### App Store Preparation
- [ ] Prepare app screenshots
- [ ] Write app description
- [ ] Create privacy policy
- [ ] Set up app store listing
- [ ] Configure in-app purchases (if any)

---

## 🎨 Customization Guide

### Changing Theme Colors

Edit colors in component styles or create a theme:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366f1',    // Indigo
  secondary: '#16a34a',  // Green
  error: '#dc2626',      // Red
  background: '#f9fafb', // Light gray
  surface: '#ffffff',    // White
  text: '#1f2937',       // Dark gray
};
```

### Changing Fonts

1. Add font files to `assets/fonts/`
2. Load in App.tsx:
```typescript
import { useFonts } from 'expo-font';

useFonts({
  'CustomFont-Regular': require('./assets/fonts/CustomFont-Regular.ttf'),
});
```

### Branding

Update in `app.json`:
```json
{
  "expo": {
    "name": "Your LMS Name",
    "slug": "your-lms-slug",
    "primaryColor": "#6366f1"
  }
}
```

---

## 📞 Support & Resources

### Documentation Links
- **Expo**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/docs/getting-started
- **React Native Paper**: https://reactnativepaper.com/
- **React Query**: https://tanstack.com/query/latest/docs/react/overview
- **Clerk**: https://clerk.com/docs/quickstarts/expo

### Common Expo Commands
```bash
# Start development server
expo start

# Start with clear cache
expo start -c

# Run on specific platform
expo start --ios
expo start --android

# Check for issues
expo doctor

# Update dependencies
expo upgrade
```

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic navigation
- ✅ Course browsing
- ✅ Video playback
- ✅ Chapter progress

### Phase 2 (Next)
- ⏳ Complete authentication
- ⏳ Payment integration
- ⏳ Test taking
- ⏳ Assignment submission

### Phase 3 (Future)
- ⏳ Teacher course creation
- ⏳ Submission review
- ⏳ Analytics dashboard
- ⏳ Push notifications

### Phase 4 (Advanced)
- ⏳ Offline mode
- ⏳ Advanced analytics
- ⏳ Live classes
- ⏳ Chat/messaging

---

Good luck with your mobile app development! 🚀
