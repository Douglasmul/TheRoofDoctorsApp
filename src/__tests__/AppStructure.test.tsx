/**
 * @fileoverview Test App.tsx wrapper structure and imports
 */

import fs from 'fs';
import path from 'path';

describe('App.tsx Structure', () => {
  const appFilePath = path.join(__dirname, '../../App.tsx');
  let appFileContent: string;

  beforeAll(() => {
    appFileContent = fs.readFileSync(appFilePath, 'utf8');
  });

  it('should import all required components for proper wrapper order', () => {
    // Check that all necessary imports are present
    expect(appFileContent).toMatch(/import.*GestureHandlerRootView.*from.*react-native-gesture-handler/);
    expect(appFileContent).toMatch(/import.*SafeAreaProvider.*from.*react-native-safe-area-context/);
    expect(appFileContent).toMatch(/import.*NavigationContainer.*from.*@react-navigation\/native/);
    expect(appFileContent).toMatch(/import.*ErrorBoundary.*from.*\.\/src\/components\/ErrorBoundary/);
    expect(appFileContent).toMatch(/import.*AuthProvider.*from.*\.\/src\/contexts\/AuthContext/);
    expect(appFileContent).toMatch(/import.*AppNavigator.*from.*\.\/src\/navigation\/AppNavigator/);
  });

  it('should implement proper wrapper hierarchy', () => {
    // Check the component nesting order
    const lines = appFileContent.split('\n').map(line => line.trim());
    
    // Find the wrapper components in order
    const gestureHandlerIndex = lines.findIndex(line => line.includes('<GestureHandlerRootView'));
    const safeAreaIndex = lines.findIndex(line => line.includes('<SafeAreaProvider'));
    const errorBoundaryIndex = lines.findIndex(line => line.includes('<ErrorBoundary'));
    const authProviderIndex = lines.findIndex(line => line.includes('<AuthProvider'));
    const navigationContainerIndex = lines.findIndex(line => line.includes('<NavigationContainer'));
    const appNavigatorIndex = lines.findIndex(line => line.includes('<AppNavigator'));

    // Verify proper nesting order
    expect(gestureHandlerIndex).toBeGreaterThan(-1);
    expect(safeAreaIndex).toBeGreaterThan(gestureHandlerIndex);
    expect(errorBoundaryIndex).toBeGreaterThan(safeAreaIndex);
    expect(authProviderIndex).toBeGreaterThan(errorBoundaryIndex);
    expect(navigationContainerIndex).toBeGreaterThan(authProviderIndex);
    expect(appNavigatorIndex).toBeGreaterThan(navigationContainerIndex);
  });

  it('should include GestureHandlerRootView with flex style', () => {
    expect(appFileContent).toMatch(/<GestureHandlerRootView\s+style=\{\{\s*flex:\s*1\s*\}\}/);
  });

  it('should not contain any TODO or FIXME comments', () => {
    expect(appFileContent.toLowerCase()).not.toMatch(/todo|fixme/);
  });
});

describe('AppNavigator.tsx Structure', () => {
  const navigatorFilePath = path.join(__dirname, '../navigation/AppNavigator.tsx');
  let navigatorFileContent: string;

  beforeAll(() => {
    navigatorFileContent = fs.readFileSync(navigatorFilePath, 'utf8');
  });

  it('should not import NavigationContainer', () => {
    expect(navigatorFileContent).not.toMatch(/import.*NavigationContainer.*from.*@react-navigation\/native/);
  });

  it('should not wrap Stack.Navigator with NavigationContainer', () => {
    expect(navigatorFileContent).not.toMatch(/<NavigationContainer>/);
    expect(navigatorFileContent).not.toMatch(/<\/NavigationContainer>/);
  });

  it('should return Stack.Navigator directly', () => {
    // Check that the return statement contains Stack.Navigator as the root element
    expect(navigatorFileContent).toMatch(/return\s*\(\s*<Stack\.Navigator/);
  });
});