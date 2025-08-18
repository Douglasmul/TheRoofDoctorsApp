/**
 * @fileoverview Navigation types for React Navigation
 * @version 1.0.0
 */

import { RoofMeasurement } from '../types/measurement';

export type RootStackParamList = {
  Home: undefined;
  OpenApp: undefined;
  MeasureRoof: undefined;
  RoofARCamera: undefined;
  MeasurementReview: { measurement: RoofMeasurement };
  Quote: undefined;
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Reports: undefined;
  Help: undefined;
  Legal: undefined;
  Admin: undefined;
  Error: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}