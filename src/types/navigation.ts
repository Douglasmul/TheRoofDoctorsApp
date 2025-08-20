/**
 * @fileoverview Navigation types for React Navigation
 * @version 1.0.0
 */

import { RoofMeasurement } from '../types/measurement';
import { Quote } from '../types/quote';

export type RootStackParamList = {
  // Main App Screens
  Home: undefined;
  OpenApp: undefined;
  
  // Core Functionality Screens
  MeasureRoof: undefined;
  RoofARCamera: undefined;
  ManualMeasurement: { 
    quoteId?: string; 
    propertyInfo?: any; 
    returnScreen?: string; 
    mode?: string; 
    pointsSelected?: any[];
    surfaceType?: string;
  };
  ManualPointSelection: {
    sessionId: string;
    surfaceType?: string;
    existingPoints?: any[];
    pointsSelected?: any[];
  };
  MeasurementReview: { 
    measurement: RoofMeasurement; 
    isManual?: boolean; 
    validationResult?: any; 
  };
  Quote: { 
    measurement?: RoofMeasurement; 
    quoteId?: string; 
    savedFromMeasurement?: boolean; 
  };
  
  // Authentication Screens
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email?: string; token?: string };
  
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