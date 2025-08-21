/**
 * @fileoverview App wrapper with all system integrations
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppointmentProvider } from '../contexts/AppointmentContext';
import { SecurityProvider } from '../contexts/SecurityContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides all necessary contexts for the app
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <SecurityProvider>
        <AppointmentProvider>
          {children}
        </AppointmentProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}

export default AppProviders;