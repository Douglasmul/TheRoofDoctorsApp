import 'react-native-gesture-handler/jestSetup';
// Silence the warning: Animated: `useNativeDriver` is not supported in the web.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');