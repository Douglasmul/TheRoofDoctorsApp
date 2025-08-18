# Testing Navigation Guide

This guide explains how to access all screens in The Roof Doctors App for testing purposes.

## Quick Access via Testing Menu

**Location:** Home Screen → "Show Testing Menu" button

The testing menu provides organized access to all screens:

### 🔐 Authentication Screens
- **Login**: User authentication and sign-in
- **Sign Up**: New user registration

### 👤 User Account Screens  
- **Profile**: User profile management and information
- **Settings**: App configuration and user preferences
- **Notifications**: Push notifications and alerts management

### 🏗️ Core Features
- **AR Camera**: Roof measurement using augmented reality
- **Welcome**: App introduction and onboarding flow

### 📊 Business Screens
- **Reports**: Analytics, data reports, and measurement history
- **Admin Panel**: Administrative controls and user management

### 💬 Support Screens
- **Help & Support**: User assistance, FAQs, and documentation
- **Legal Info**: Terms of service, privacy policy, and legal information  
- **Error Screen**: Error handling and user feedback

## Navigation Flow Chart

```
Home Screen (Initial)
├── Measure Roof → RoofARCamera → MeasurementReview
├── Get a Quote → Quote Screen
└── Testing Menu
    ├── Authentication (Login, Signup)
    ├── User Account (Profile, Settings, Notifications)
    ├── Core Features (AR Camera, Welcome)
    ├── Business (Reports, Admin Panel)
    └── Support (Help, Legal, Error)
```

## Standard Navigation Paths

### Primary User Flows
1. **Roof Measurement**: Home → Measure Roof → AR Camera → Measurement Review
2. **Get Quote**: Home → Get a Quote → Quote Screen
3. **User Management**: Home → Testing Menu → Profile/Settings

### Authentication Flow
1. **Sign Up**: Home → Testing Menu → Sign Up
2. **Login**: Home → Testing Menu → Login

### Administrative Access
1. **Admin Panel**: Home → Testing Menu → Admin Panel
2. **Reports**: Home → Testing Menu → Reports

## Testing Checklist

### Screen Accessibility ✅
- [ ] All 16 screens are accessible via navigation
- [ ] Testing menu shows/hides correctly
- [ ] Navigation types are properly defined
- [ ] No broken navigation links

### Screen Functionality
- [ ] Each screen loads without crashes
- [ ] Navigation back button works correctly
- [ ] Screen-specific features function as expected
- [ ] UI renders properly on different screen sizes

### Production Readiness
- [ ] Testing menu can be easily hidden/removed for production
- [ ] Main user flows work without testing menu
- [ ] Performance is acceptable with additional navigation options

## Notes for Developers

### Remove Testing Menu for Production
To hide the testing menu in production builds, it's already configured to only show in development mode by default:

```typescript
const [showTestingMenu, setShowTestingMenu] = useState(__DEV__ || false); // Only show in development
```

For complete removal in production builds:
1. **Option 1 (Recommended):** The menu automatically hides in production builds
2. **Option 2:** Set to `useState(false)` to completely disable
3. **Option 3:** Remove the testing menu section entirely before production deployment

### Adding New Screens
1. Add screen to `src/navigation/AppNavigator.tsx`
2. Update `src/types/navigation.ts` with new screen type
3. Add to testing menu in `HomeScreen.tsx` if needed for testing
4. Update this documentation

### Navigation Stack Structure
The app uses React Navigation Stack Navigator with all screens registered at the root level. This allows direct navigation to any screen from anywhere in the app.