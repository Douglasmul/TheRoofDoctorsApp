/**
 * @fileoverview Navigation types for React Navigation
 * @version 1.0.0
 */

import { RoofMeasurement } from '../types/measurement';

export type RootStackParamList = {
  // Main App Screens
  Home: undefined;
  OpenApp: undefined;
  
  // Core Functionality Screens
  MeasureRoof: undefined;
  RoofARCamera: undefined;
  MeasurementReview: { measurement: RoofMeasurement };
  Quote: undefined;
  
  // Authentication Screens
  Login: undefined;
  Signup: undefined;
  
  // User Account Screens
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  
  // Reports and Data Screens
  Reports: undefined;
  
  // Support and Information Screens
  Help: undefined;
  Legal: undefined;
  
  // Admin and Error Screens
  Admin: undefined;
  Error: undefined;
};

  declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}