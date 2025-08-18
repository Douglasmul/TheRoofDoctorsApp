/**
 * @fileoverview Navigation configuration tests
 * Ensures all screens are properly registered and accessible
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import the navigation types to verify they compile
import type { RootStackParamList } from '../types/navigation';

// Import all screens to verify they exist and can be imported
import HomeScreen from '../screens/HomeScreen';
import OpenAppScreen from '../screens/OpenApp';
import MeasureRoofScreen from '../screens/MeasureRoofScreen';
import RoofARCameraScreen from '../screens/RoofARCameraScreen';
import MeasurementReviewScreen from '../screens/MeasurementReviewScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import QuoteScreen from '../screens/QuoteScreen';
import AdminScreen from '../screens/AdminScreen';
import ErrorScreen from '../screens/ErrorScreen';
import HelpScreen from '../screens/HelpScreen';
import LegalScreen from '../screens/LegalScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

describe('Navigation Configuration', () => {
  it('should import all screens without errors', () => {
    // All screens should be importable
    expect(HomeScreen).toBeDefined();
    expect(OpenAppScreen).toBeDefined();
    expect(MeasureRoofScreen).toBeDefined();
    expect(RoofARCameraScreen).toBeDefined();
    expect(MeasurementReviewScreen).toBeDefined();
    expect(SignupScreen).toBeDefined();
    expect(LoginScreen).toBeDefined();
    expect(QuoteScreen).toBeDefined();
    expect(AdminScreen).toBeDefined();
    expect(ErrorScreen).toBeDefined();
    expect(HelpScreen).toBeDefined();
    expect(LegalScreen).toBeDefined();
    expect(NotificationsScreen).toBeDefined();
    expect(ProfileScreen).toBeDefined();
    expect(ReportsScreen).toBeDefined();
    expect(SettingsScreen).toBeDefined();
  });

  it('should render navigation stack without crashing', () => {
    const TestNavigator = () => (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="OpenApp" component={OpenAppScreen} />
          <Stack.Screen name="MeasureRoof" component={MeasureRoofScreen} />
          <Stack.Screen name="RoofARCamera" component={RoofARCameraScreen} />
          <Stack.Screen name="Quote" component={QuoteScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Error" component={ErrorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    expect(() => render(<TestNavigator />)).not.toThrow();
  });

  it('should have all required screen types defined', () => {
    // Type checking - this test passes if the types compile correctly
    const screenNames: Array<keyof RootStackParamList> = [
      'Home',
      'OpenApp', 
      'MeasureRoof',
      'RoofARCamera',
      'MeasurementReview',
      'Quote',
      'Login',
      'Signup',
      'Profile',
      'Settings',
      'Notifications',
      'Reports',
      'Help',
      'Legal',
      'Admin',
      'Error'
    ];

    expect(screenNames).toHaveLength(16);
  });

  it('should render HomeScreen with testing menu', () => {
    const { getByText } = render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    // Check main content
    expect(getByText(/Welcome to your enterprise roofing assistant/)).toBeTruthy();
    expect(getByText('Measure Roof')).toBeTruthy();
    expect(getByText('Get a Quote')).toBeTruthy();
    
    // Check testing menu toggle
    expect(getByText('▶ Show Testing Menu')).toBeTruthy();
  });
});