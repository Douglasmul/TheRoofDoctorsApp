import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COMPANY_INFO } from '../constants/company';

// Import all screens from src/screens directory
import HomeScreen from '../screens/HomeScreen';
import OpenAppScreen from '../screens/OpenApp';
import MeasureRoofScreen from '../screens/MeasureRoofScreen';
import RoofARCameraScreen from '../screens/RoofARCameraScreen';
import ManualMeasurementScreen from '../screens/ManualMeasurementScreen';
import ManualPointSelectionCamera from '../screens/ManualPointSelectionCamera';
import EnhancedManualPointSelectionCamera from '../screens/EnhancedManualPointSelectionCamera';
import CalibrationScreen from '../screens/CalibrationScreen';
import ProfessionalFeaturesSummary from '../screens/ProfessionalFeaturesSummary';
import MeasurementReviewScreen from '../screens/MeasurementReviewScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import QuoteScreen from '../screens/QuoteScreen';
import AdminScreen from '../screens/AdminScreen';
import ErrorScreen from '../screens/ErrorScreen';
import HelpScreen from '../screens/HelpScreen';
import LegalScreen from '../screens/LegalScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AppointmentBookingScreen from '../screens/AppointmentBookingScreen';
import AppointmentManagementScreen from '../screens/AppointmentManagementScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Main App Screens */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: COMPANY_INFO.app.displayName }}
        />
        <Stack.Screen 
          name="OpenApp" 
          component={OpenAppScreen} 
          options={{ title: 'Welcome' }}
        />
        
        {/* Core Functionality Screens */}
        <Stack.Screen 
          name="MeasureRoof" 
          component={MeasureRoofScreen} 
          options={{ title: 'Measure Roof' }}
        />
        <Stack.Screen 
          name="RoofARCamera" 
          component={RoofARCameraScreen} 
          options={{ 
            title: 'AR Measurement',
            headerShown: false, // Hide header for immersive AR experience
          }}
        />
        <Stack.Screen 
          name="ManualMeasurement" 
          component={ManualMeasurementScreen} 
          options={{ title: 'Manual Measurement' }}
        />
        <Stack.Screen 
          name="ManualPointSelection" 
          component={ManualPointSelectionCamera} 
          options={{ 
            title: 'Select Points',
            headerShown: false, // Hide header for full camera view
          }}
        />
        <Stack.Screen 
          name="EnhancedManualPointSelection" 
          component={EnhancedManualPointSelectionCamera} 
          options={{ 
            title: 'Enhanced Point Selection',
            headerShown: false, // Hide header for full camera view
          }}
        />
        <Stack.Screen 
          name="Calibration" 
          component={CalibrationScreen} 
          options={{ 
            title: 'Measurement Calibration',
            headerShown: false, // Hide header for full camera view
          }}
        />
        <Stack.Screen 
          name="ProfessionalFeatures" 
          component={ProfessionalFeaturesSummary} 
          options={{ 
            title: 'Professional Features',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="MeasurementReview" 
          component={MeasurementReviewScreen} 
          options={{ title: 'Measurement Review' }}
        />
        <Stack.Screen 
          name="Quote" 
          component={QuoteScreen} 
          options={{ title: 'Get a Quote' }}
        />
        
        {/* Authentication Screens */}
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ title: 'Reset Password' }}
        />
        <Stack.Screen 
          name="EmailVerification" 
          component={EmailVerificationScreen} 
          options={{ title: 'Verify Email' }}
        />

        {/* User Account Screens */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Profile' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="SecuritySettings" 
          component={SecuritySettingsScreen} 
          options={{ title: 'Security Settings' }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ title: 'Notifications' }}
        />

        {/* Appointment Screens */}
        <Stack.Screen 
          name="AppointmentBooking" 
          component={AppointmentBookingScreen} 
          options={{ title: 'Book Appointment' }}
        />
        <Stack.Screen 
          name="AppointmentManagement" 
          component={AppointmentManagementScreen} 
          options={{ title: 'My Appointments' }}
        />

        {/* Reports and Data Screens */}
        <Stack.Screen 
          name="Reports" 
          component={ReportsScreen} 
          options={{ title: 'Reports' }}
        />

        {/* Support and Information Screens */}
        <Stack.Screen 
          name="Help" 
          component={HelpScreen} 
          options={{ title: 'Help & Support' }}
        />
        <Stack.Screen 
          name="Legal" 
          component={LegalScreen} 
          options={{ title: 'Legal Information' }}
        />

        {/* Admin and Error Screens */}
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{ title: 'Admin Panel' }}
        />
        <Stack.Screen 
          name="Error" 
          component={ErrorScreen} 
          options={{ title: 'Error' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}