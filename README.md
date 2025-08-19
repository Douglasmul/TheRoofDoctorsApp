# TheRoofDoctorsApp

Enterprise roofing assistant app with AR measurement capabilities and comprehensive screen navigation.

## Navigation & Testing

All enterprise screens are accessible for testing via an integrated testing menu. See [TESTING_NAVIGATION.md](TESTING_NAVIGATION.md) for complete navigation guide.

### Available Screens
- **Core Features**: Home, Measure Roof, AR Camera, Quote Generation
- **Authentication**: Login, Sign Up  
- **User Account**: Profile, Settings, Notifications
- **Business**: Reports, Admin Panel
- **Support**: Help, Legal Information, Error Handling

The testing menu automatically appears in development mode and is hidden in production builds.

## Required Dependencies

### Expo Packages

This app requires specific Expo SDK packages for full functionality:

#### Core Expo Packages
- `expo` - Expo SDK framework (^53.0.20)
- `expo-status-bar` - Status bar component for cross-platform status bar styling (^2.2.3)

#### Hardware & System Access
- `expo-camera` - Camera access for AR measurement features (~16.1.11)
- `expo-sensors` - Device sensors for AR capabilities (~14.1.0)

#### Storage & Security
- `expo-crypto` - Cryptographic functions (~14.1.5)
- `expo-secure-store` - Secure key-value storage (~14.2.3)
- `expo-file-system` - File system access (~18.1.11)

#### User Experience
- `expo-document-picker` - Document selection functionality (~13.1.6)
- `expo-sharing` - Native sharing capabilities (~13.1.5)
- `expo-localization` - Internationalization support (~16.1.6)

### Installation

To install all dependencies, use yarn (recommended):

```bash
yarn install
```

To check dependency compatibility with Expo SDK 53:

```bash
npx expo install --check
```

## Merge Conflict Resolution

This repository includes automated tools for resolving merge conflicts in package management files. See [docs/MERGE_CONFLICTS.md](docs/MERGE_CONFLICTS.md) for detailed guidance.

### Quick Commands
- `npm run resolve-conflicts` - Detect and resolve merge conflicts
- `npm run test-conflicts` - Create test conflicts for development
- `npm run restore-conflicts` - Restore original files from test conflicts