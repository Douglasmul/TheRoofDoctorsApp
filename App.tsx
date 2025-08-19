/**
 * @fileoverview Main App component with authentication provider
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </I18nextProvider>
  );
}
