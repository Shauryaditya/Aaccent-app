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
- ✅ Type-safe TypeScript throughout
- ✅ Material Design UI components
- ✅ Loading and empty states
- ✅ Error handling with toasts
- ✅ Pull-to-refresh on lists

### Student App
- ✅ Course browsing with categories
- ✅ Course search
- ✅ Course detail view
- ✅ Chapter list with progress indicators
- ✅ Video player for chapters
- ✅ Mark chapters complete/incomplete
- ✅ View purchased courses
- ✅ View assigned goals
- ✅ Profile with role switching

### Teacher App
- ✅ Basic profile screen
- ✅ Role switching capability
- ✅ Navigation structure ready

---

## 🚧 Features Requiring Implementation

### High Priority (Core Functionality)

#### 1. Complete Clerk Authentication
**Current State**: Placeholder login screen
**Needed**: 
- Full Clerk OAuth integration
- Social login (Google, etc.)
- Email/password flow
- Token refresh handling

**Implementation Guide**:
```typescript
// In LoginScreen.tsx
import { useOAuth } from '@clerk/clerk-expo';

const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

const handleGoogleSignIn = async () => {
  const { createdSessionId } = await startOAuthFlow();
  // Handle successful authentication
};
```

#### 2. Razorpay Payment Integration
**Location**: `src/screens/student/CourseDetailScreen.tsx`
**Needed**:
- Razorpay SDK integration
- Payment flow UI
- Order creation API call
- Payment verification
- Purchase confirmation

**Implementation Guide**:
```typescript
import RazorpayCheckout from 'react-native-razorpay';

const handlePayment = async (courseId: string, amount: number) => {
  // 1. Create order on backend
  const order = await apiService.post('/api/razorpay/order', {
    courseId,
    amount
  });

  // 2. Show Razorpay checkout
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    order_id: order.id,
    name: 'LMS Platform',
    // ... other options
  };

  const data = await RazorpayCheckout.open(options);
  
  // 3. Verify payment on backend
  await apiService.post('/api/razorpay/verify', {
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature
  });
};
```

#### 3. Test Taking Interface
**Location**: `src/screens/student/TakeTestScreen.tsx`
**Needed**:
- Question display with options
- Answer selection
- Timer functionality
- Progress indicator
- Submit test flow
- Handle different question types (single, multiple, numerical)

#### 4. Assignment Submission
**Location**: `src/screens/student/SubmitAssignmentScreen.tsx`
**Needed**:
- Image picker integration
- Multiple image upload
- Preview selected images
- Upload progress indicator
- Submit to backend

**Implementation Guide**:
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImages = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    // Upload images
    const uploadPromises = result.assets.map(asset =>
      submissionService.uploadImage(asset.uri)
    );
    const urls = await Promise.all(uploadPromises);
    
    // Submit assignment
    await submissionService.submitChapterAssignment(chapterId, urls);
  }
};
```

### Medium Priority (Teacher Features)

#### 5. Course Management (Teacher)
**Locations**: 
- `src/screens/teacher/CreateCourseScreen.tsx`
- `src/screens/teacher/EditCourseScreen.tsx`
- `src/screens/teacher/ManageChaptersScreen.tsx`

**Needed**:
- Form for course creation
- Image upload for course cover
- Chapter CRUD operations
- Drag-and-drop chapter reordering
- Video upload/link for chapters

#### 6. Test Series Management (Teacher)
**Locations**:
- `src/screens/teacher/CreateTestSeriesScreen.tsx`
- `src/screens/teacher/ManageQuestionsScreen.tsx`

**Needed**:
- Test series creation form
- Test creation with settings
- Question bank interface
- Add/edit/delete questions
- Support for different question types

#### 7. Submission Review (Teacher)
**Location**: `src/screens/teacher/ReviewSubmissionScreen.tsx`
**Needed**:
- View student submissions
- Image annotation tools (for chapter submissions)
- PDF annotation (for test submissions)
- Grading interface
- Feedback text input
- Mark as reviewed/needs revision

### Low Priority (Nice to Have)

#### 8. Resources Library
**Location**: `src/screens/student/ResourcesScreen.tsx`
**Needed**:
- Browse resources by category
- Filter by subject, grade, year
- Download/view resources
- PDF viewer for documents

#### 9. Analytics Dashboard (Teacher)
**Location**: `src/screens/teacher/TeacherDashboardScreen.tsx`
**Needed**:
- Charts for course enrollment
- Student progress overview
- Test performance metrics
- Recent activity feed

#### 10. Goal Management (Teacher)
**Location**: `src/screens/teacher/AssignGoalScreen.tsx`
**Needed**:
- Student selection
- Course/test series selection
- Due date picker
- Goal description input
- Submit goal assignment

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

1. **Authentication**: Simplified Clerk implementation - needs full OAuth flow
2. **Video Upload**: Teachers can't upload videos from mobile - use web app
3. **PDF Annotation**: Complex annotation features better suited for web
4. **Offline Mode**: Not implemented - requires network connection
5. **Push Notifications**: Structure exists but not fully integrated

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
