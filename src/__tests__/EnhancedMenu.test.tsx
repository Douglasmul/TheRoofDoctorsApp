/**
 * @fileoverview Tests for enhanced menu components
 * @version 1.0.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainMenu } from '../../src/components/menu/MainMenu';
import { MenuSection } from '../../src/components/menu/MenuSection';
import { MenuItem } from '../../src/components/menu/MenuItem';

// Mock navigation
const Stack = createStackNavigator();
const MockApp = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Test">
        {() => children}
      </Stack.Screen>
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Enhanced Menu Components', () => {
  describe('MenuItem', () => {
    it('should render menu item with title and description', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <MockApp>
          <MenuItem
            title="Test Item"
            description="Test description"
            icon="🏠"
            onPress={mockOnPress}
            testID="test-menu-item"
          />
        </MockApp>
      );

      expect(getByText('Test Item')).toBeTruthy();
      expect(getByText('Test description')).toBeTruthy();
      expect(getByText('🏠')).toBeTruthy();
    });

    it('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <MockApp>
          <MenuItem
            title="Test Item"
            onPress={mockOnPress}
            testID="test-menu-item"
          />
        </MockApp>
      );

      const menuItem = getByTestId('test-menu-item');
      fireEvent.press(menuItem);
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should display badge when provided', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <MockApp>
          <MenuItem
            title="Test Item"
            onPress={mockOnPress}
            badge="5"
            testID="test-menu-item"
          />
        </MockApp>
      );

      expect(getByText('5')).toBeTruthy();
    });

    it('should not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <MockApp>
          <MenuItem
            title="Test Item"
            onPress={mockOnPress}
            disabled={true}
            testID="test-menu-item"
          />
        </MockApp>
      );

      const menuItem = getByTestId('test-menu-item');
      fireEvent.press(menuItem);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('MenuSection', () => {
    it('should render section title and children when expanded', () => {
      const { getByText } = render(
        <MockApp>
          <MenuSection
            title="Test Section"
            defaultExpanded={true}
            testID="test-section"
          >
            <MenuItem
              title="Child Item"
              onPress={() => {}}
            />
          </MenuSection>
        </MockApp>
      );

      expect(getByText('Test Section')).toBeTruthy();
      expect(getByText('Child Item')).toBeTruthy();
    });

    it('should toggle expanded state when header is pressed', () => {
      const { getByText, queryByText } = render(
        <MockApp>
          <MenuSection
            title="Test Section"
            defaultExpanded={false}
            testID="test-section"
          >
            <MenuItem
              title="Child Item"
              onPress={() => {}}
            />
          </MenuSection>
        </MockApp>
      );

      // Initially collapsed
      expect(getByText('Test Section')).toBeTruthy();
      expect(queryByText('Child Item')).toBeNull();

      // Expand by pressing header
      fireEvent.press(getByText('Test Section'));
      expect(getByText('Child Item')).toBeTruthy();
    });

    it('should render icon when provided', () => {
      const { getByText } = render(
        <MockApp>
          <MenuSection
            title="Test Section"
            icon="📱"
            defaultExpanded={true}
            testID="test-section"
          >
            <MenuItem
              title="Child Item"
              onPress={() => {}}
            />
          </MenuSection>
        </MockApp>
      );

      expect(getByText('📱')).toBeTruthy();
    });
  });

  describe('MainMenu', () => {
    it('should render all main sections', () => {
      const { getByText } = render(
        <MockApp>
          <MainMenu />
        </MockApp>
      );

      // Check for main sections
      expect(getByText('Core Features')).toBeTruthy();
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('Authentication')).toBeTruthy();
      expect(getByText('Support')).toBeTruthy();
    });

    it('should show dev tools section in development', () => {
      const { getByText } = render(
        <MockApp>
          <MainMenu showDevTools={true} />
        </MockApp>
      );

      expect(getByText('Developer Tools')).toBeTruthy();
    });

    it('should hide dev tools section in production', () => {
      const { queryByText } = render(
        <MockApp>
          <MainMenu showDevTools={false} />
        </MockApp>
      );

      expect(queryByText('Developer Tools')).toBeNull();
    });

    it('should show business section for admin users', () => {
      const { getByText } = render(
        <MockApp>
          <MainMenu userRole="admin" />
        </MockApp>
      );

      expect(getByText('Business')).toBeTruthy();
    });

    it('should call onNavigate when provided', () => {
      const mockOnNavigate = jest.fn();
      const { getByText } = render(
        <MockApp>
          <MainMenu onNavigate={mockOnNavigate} />
        </MockApp>
      );

      // Core Features should be expanded by default
      const measureRoofItem = getByText('Measure Roof');
      fireEvent.press(measureRoofItem);
      
      expect(mockOnNavigate).toHaveBeenCalledWith('MeasureRoof');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for menu items', () => {
      const mockOnPress = jest.fn();
      const { getByLabelText } = render(
        <MockApp>
          <MenuItem
            title="Test Item"
            description="Test description"
            onPress={mockOnPress}
            accessibilityLabel="Custom accessibility label"
            testID="test-menu-item"
          />
        </MockApp>
      );

      expect(getByLabelText('Custom accessibility label')).toBeTruthy();
    });

    it('should have proper accessibility states for sections', () => {
      const { getByRole } = render(
        <MockApp>
          <MenuSection
            title="Test Section"
            defaultExpanded={true}
            testID="test-section"
          >
            <MenuItem
              title="Child Item"
              onPress={() => {}}
            />
          </MenuSection>
        </MockApp>
      );

      const sectionButton = getByRole('button');
      expect(sectionButton).toBeTruthy();
    });
  });
});