/**
 * @fileoverview Test for the main menu transformation
 * Verifies that the testing menu has been properly transformed into a production-ready main menu
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock company branding hook
jest.mock('../hooks/useCompanyBranding', () => ({
  useCompanyBranding: () => ({
    companyInfo: {
      name: 'The Roof Doctors',
      logoUri: null,
      hasCustomBranding: false,
    },
  }),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('Main Menu Transformation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Production Menu Structure', () => {
    it('should display the main app menu with correct title', () => {
      render(<HomeScreen />);
      
      // Should show "App Menu" instead of "Screen Testing Navigation"
      expect(screen.getByText('📱 App Menu')).toBeTruthy();
      expect(screen.getByText('Access all features and settings')).toBeTruthy();
      
      // Should not show old testing language
      expect(screen.queryByText('🧪 Screen Testing Navigation')).toBeNull();
      expect(screen.queryByText('Access all screens for testing purposes')).toBeNull();
    });

    it('should organize menu items into proper production categories', () => {
      render(<HomeScreen />);
      
      // Should have production-ready categories
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Tools')).toBeTruthy();
      expect(screen.getByText('Business')).toBeTruthy();
      expect(screen.getByText('Support')).toBeTruthy();
      expect(screen.getByText('Authentication')).toBeTruthy();
      
      // Should not have old category names
      expect(screen.queryByText('User Account')).toBeNull();
      expect(screen.queryByText('Core Features')).toBeNull();
    });

    it('should include production features like logout', () => {
      render(<HomeScreen />);
      
      // Should include logout functionality
      expect(screen.getByText('Logout')).toBeTruthy();
      
      // Should have enhanced business features
      expect(screen.getByText('Quote Generator')).toBeTruthy();
      expect(screen.getByText('Reports')).toBeTruthy();
    });

    it('should use proper menu toggle text', () => {
      render(<HomeScreen />);
      
      // Should show production-ready toggle text
      expect(screen.getByText('Hide Menu')).toBeTruthy();
      
      // Should not show old testing language
      expect(screen.queryByText('▼ Hide Testing Menu')).toBeNull();
      expect(screen.queryByText('▶ Show Testing Menu')).toBeNull();
    });
  });

  describe('Developer Tools Conditional Display', () => {
    it('should show developer tools in development mode', () => {
      // __DEV__ is true in test environment
      render(<HomeScreen />);
      
      expect(screen.getByText('Developer Tools')).toBeTruthy();
      expect(screen.getByText('Admin Panel')).toBeTruthy();
      expect(screen.getByText('Error Screen')).toBeTruthy();
      expect(screen.getByText('🧪 Developer tools are hidden in production builds')).toBeTruthy();
    });
  });

  describe('Menu Functionality', () => {
    it('should be shown by default for better UX', () => {
      render(<HomeScreen />);
      
      // Menu should be visible by default
      expect(screen.getByText('📱 App Menu')).toBeTruthy();
      expect(screen.getByText('Hide Menu')).toBeTruthy();
    });
  });
});