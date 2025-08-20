/**
 * @fileoverview App wrapper with appointment system integration
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppointmentProvider } from '../contexts/AppointmentContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides all necessary contexts for the app
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <AppointmentProvider>
        {children}
      </AppointmentProvider>
    </AuthProvider>
  );
}

export default AppProviders;