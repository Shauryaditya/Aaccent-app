# 📱 LMS Mobile App - Complete Setup Guide

## 🎯 Overview

This mobile app is built for your Next.js LMS platform and provides:
- **Student App**: Browse courses, watch videos, take tests, submit assignments
- **Teacher App**: Create courses, manage tests, review submissions, track progress

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Yarn** (recommended) or npm
   - Install: `npm install -g yarn`
   - Verify: `yarn --version`

3. **Expo Go App** on your mobile device
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### Required Accounts
1. **Clerk Account** (for authentication)
   - Sign up at: https://clerk.com/
   - Create a new application
   - Get your publishable key

2. **Your Next.js Backend** must be running and accessible
   - Should be deployed or accessible via ngrok/similar for testing

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd /app/mobile-app
yarn install
# or
npm install
```

### Step 2: Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your values:**
   ```env
   API_BASE_URL=https://your-nextjs-backend.com
   CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
   RAZORPAY_KEY_ID=rzp_test_your_razorpay_key
   ```

   **How to get these values:**
   - `API_BASE_URL`: Your Next.js app URL (production or ngrok for local testing)
   - `CLERK_PUBLISHABLE_KEY`: From Clerk Dashboard → API Keys
   - `RAZORPAY_KEY_ID`: From Razorpay Dashboard (if using payments)

### Step 3: Update app.json

Open `/app/mobile-app/app.json` and update:

```json
{
  "expo": {
    "extra": {
      "clerkPublishableKey": "YOUR_CLERK_KEY_HERE",
      "apiBaseUrl": "https://your-backend-url.com"
    }
  }
}
```

### Step 4: Configure Clerk for React Native

1. **Go to Clerk Dashboard** → Your App → Configure
2. **Add redirect URLs:**
   - Development: `exp://localhost:8081/*`
   - Production: `your-app-scheme://*`
3. **Enable OAuth providers** (Google, etc.) if needed

### Step 5: Setup Assets (Optional)

Replace placeholder assets in `/app/mobile-app/assets/`:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon

---

## ▶️ Running the App

### Start the Development Server

```bash
cd /app/mobile-app
yarn start
# or
npm start
```

This will:
1. Start the Metro bundler
2. Show a QR code in your terminal
3. Display options to run on iOS/Android

### Test on Your Device

1. **Open Expo Go** on your phone
2. **Scan the QR code** from terminal
3. **Wait for the app to load** (first time might take 1-2 minutes)

### Troubleshooting Connection Issues

If app won't load:

1. **Ensure same WiFi**: Phone and computer must be on the same network
2. **Check firewall**: Allow connections on port 8081
3. **Use tunnel mode**: Press `s` in terminal to switch to tunnel mode
4. **Check API URL**: Ensure backend URL is accessible from your phone

---

## 🔑 Authentication Setup

### Clerk Integration

The app uses Clerk for authentication. Here's how it works:

1. **User signs in** → Clerk handles OAuth flow
2. **Token stored** → Securely saved in device storage
3. **API calls** → Token automatically added to all requests

### Testing Authentication

1. **Create a test user** in Clerk Dashboard
2. **Or sign up** through the mobile app
3. **Select role** (Student or Teacher)
4. **Start using the app**

**Note**: Current implementation shows a simplified login screen. Full Clerk OAuth flow needs to be implemented. See Clerk's React Native documentation: https://clerk.com/docs/quickstarts/expo

---

## 🎨 Features Implementation Status

### ✅ Implemented (Working)

**Core Infrastructure:**
- ✅ Navigation (Auth, Student, Teacher flows)
- ✅ API service layer with authentication
- ✅ React Query integration
- ✅ Material Design UI with React Native Paper
- ✅ Type-safe TypeScript throughout

**Student Features:**
- ✅ Browse courses by category
- ✅ Search courses
- ✅ View course details
- ✅ Watch video lessons (Mux/expo-video)
- ✅ Mark chapters complete/incomplete
- ✅ View assigned goals
- ✅ View purchased courses
- ✅ Profile management

**Teacher Features:**
- ✅ Profile management
- ✅ Role switching

### 🚧 To Be Implemented

**Student Features:**
- ⏳ Course purchase flow (Razorpay integration)
- ⏳ Take tests (objective)
- ⏳ View test results
- ⏳ Submit assignments (image upload)
- ⏳ View submission feedback
- ⏳ Resources library
- ⏳ Certificates

**Teacher Features:**
- ⏳ Create/edit courses
- ⏳ Manage chapters
- ⏳ Create test series
- ⏳ Create questions
- ⏳ Review submissions
- ⏳ Grade assignments
- ⏳ Assign goals to students
- ⏳ View analytics dashboard
- ⏳ Track student progress

---

## 🛠️ Development Guidelines

### Adding New Features

1. **Create API service method** in `src/services/`
2. **Create/update types** in `src/types/index.ts`
3. **Build UI screen** in `src/screens/`
4. **Add reusable components** in `src/components/`
5. **Use React Query** for data fetching
6. **Test on device** before committing

### Code Structure

```
mobile-app/
├── src/
│   ├── navigation/      # Screen navigation
│   ├── screens/         # All app screens
│   ├── components/      # Reusable UI components
│   ├── services/        # API calls
│   ├── contexts/        # React context (state)
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript types
├── assets/             # Images, fonts
└── App.tsx            # Root component
```

### Best Practices

1. **Always use TypeScript types**
2. **Use React Query for API calls** (automatic caching, refetching)
3. **Show loading states** (LoadingSpinner component)
4. **Handle empty states** (EmptyState component)
5. **Show error toasts** (showToast utility)
6. **Test on both iOS and Android**

---

## 🐛 Common Issues & Solutions

### Issue: "Network request failed"

**Solution:**
- Ensure backend URL is correct and accessible
- Check if backend allows CORS from mobile app
- Try using ngrok for local backend: `ngrok http 3000`
- Update API_BASE_URL to ngrok URL

### Issue: "Unable to resolve module"

**Solution:**
```bash
# Clear cache
rm -rf node_modules
yarn install
yarn start --clear
```

### Issue: Clerk authentication not working

**Solution:**
- Verify Clerk key in both `.env` and `app.json`
- Check Clerk dashboard for redirect URL configuration
- Ensure Clerk app has correct OAuth settings

### Issue: Video not playing

**Solution:**
- Check if Mux playback ID is valid
- Ensure video URL is accessible
- Try with a direct video URL first
- Check device supports the video format

### Issue: App crashes on launch

**Solution:**
```bash
# Clear Expo cache
expo start -c

# Or reinstall
rm -rf node_modules
yarn install
```

---

## 📦 Building for Production

### Using EAS (Expo Application Services)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure build:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android
   ```

5. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

### Requirements for Production

- Update environment variables with production values
- Replace placeholder assets (icon, splash screen)
- Configure proper bundle identifier/package name
- Test thoroughly on both platforms
- Submit to App Store / Play Store

---

## 📚 Additional Resources

### Documentation
- **Expo**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **React Native Paper**: https://reactnativepaper.com/
- **React Query**: https://tanstack.com/query/latest
- **Clerk**: https://clerk.com/docs

### Your Backend APIs

The mobile app expects these API endpoints (from your Next.js app):

```
GET  /api/courses                    # List courses
GET  /api/courses/:id                # Course details
GET  /api/courses/:id/chapters       # Course chapters
POST /api/courses/:id/checkout       # Purchase course
GET  /api/testseries                 # List test series
GET  /api/goals/student              # Student goals
POST /api/submissions/chapters/:id   # Submit assignment
... (and more)
```

Make sure all these endpoints:
1. Are accessible from mobile app
2. Accept authentication tokens
3. Return proper JSON responses
4. Handle CORS correctly

---

## 🤝 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review error messages** in terminal and device
3. **Check Expo documentation** for platform-specific issues
4. **Verify backend APIs** are working (test with Postman)
5. **Check Clerk setup** if auth issues persist

---

## ✨ Next Steps

1. **Test the app** on your device
2. **Configure Clerk** properly for auth
3. **Implement remaining features** as needed
4. **Customize UI** to match your brand
5. **Add more functionality** based on requirements

Good luck! 🚀
