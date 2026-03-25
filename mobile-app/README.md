# LMS Mobile App

Mobile application for the Learning Management System built with React Native and Expo.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Expo Go app installed on your mobile device
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

1. **Navigate to mobile app directory:**
   ```bash
   cd /app/mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update the following values:
     - `API_BASE_URL`: Your Next.js backend URL
     - `CLERK_PUBLISHABLE_KEY`: Get from Clerk Dashboard
     - `RAZORPAY_KEY_ID`: Get from Razorpay Dashboard

4. **Update app.json:**
   - Open `app.json`
   - Replace `YOUR_CLERK_PUBLISHABLE_KEY` in `extra.clerkPublishableKey`

5. **Start the development server:**
   ```bash
   npm start
   ```

6. **Test on your device:**
   - Open Expo Go app
   - Scan the QR code shown in terminal
   - App will load on your device

## 📱 Features

### Student Features
- ✅ Browse courses and test series by category
- ✅ Purchase courses with Razorpay
- ✅ Watch video lessons
- ✅ Take objective and descriptive tests
- ✅ Submit assignments with images
- ✅ Track learning progress
- ✅ View assigned goals
- ✅ Access resource library

### Teacher Features
- ✅ Create and manage courses
- ✅ Create test series with questions
- ✅ Review student submissions
- ✅ Provide feedback and grades
- ✅ Assign goals to students
- ✅ View analytics and student progress

## 🏗️ Project Structure

```
mobile-app/
├── src/
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   │   ├── auth/         # Login, signup screens
│   │   ├── student/      # Student app screens
│   │   ├── teacher/      # Teacher app screens
│   │   └── shared/       # Shared screens
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   ├── hooks/            # Custom hooks
│   ├── contexts/         # React contexts
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
├── assets/               # Images, fonts, etc.
├── App.tsx              # Root component
└── app.json             # Expo configuration
```

## 🔧 Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Authentication**: Clerk
- **API Calls**: Axios + React Query
- **UI Library**: React Native Paper
- **Forms**: React Hook Form + Zod
- **Video Player**: Expo AV
- **Payments**: Razorpay React Native

## 📝 Development Notes

- The app uses your existing Next.js API routes
- All authentication is handled by Clerk (same users as web)
- Video playback uses Mux playback URLs via expo-video
- File uploads use Expo ImagePicker and are sent to your UploadThing API

## 🐛 Troubleshooting

**App won't load:**
- Make sure your device and computer are on the same WiFi
- Check that API_BASE_URL is accessible from your device
- Verify Clerk keys are correct

**Video not playing:**
- Ensure Mux playback URL is accessible
- Check video format compatibility

**Authentication issues:**
- Verify Clerk publishable key in both `.env` and `app.json`
- Check Clerk dashboard for allowed domains

## 📦 Building for Production

```bash
# Build for iOS (requires Mac)
eas build --platform ios

# Build for Android
eas build --platform android
```

Note: You'll need to set up EAS (Expo Application Services) for production builds.
