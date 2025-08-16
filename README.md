# TheRoofDoctorsApp

A React Native application for roof measurement and estimation services.

## Features

- Roof measurement using camera
- Quote generation
- Secure data storage
- Professional navigation interface

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Douglasmul/TheRoofDoctorsApp.git
   cd TheRoofDoctorsApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

## Running the Application

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

### Development Server
To start the Metro bundler:
```bash
npm start
```

## Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── theme/          # Theme and styling
└── utils/          # Utility functions
```

## Technologies Used

- React Native
- TypeScript
- React Navigation
- Expo Camera
- Expo Secure Store
- Jest (Testing)

## License

Private - All rights reserved