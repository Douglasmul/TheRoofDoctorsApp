/**
 * @fileoverview Basic test for manual measurement workflow
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ManualMeasurementScreen from '../screens/ManualMeasurementScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockRoute = { params: {} };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => mockRoute,
}));

// Mock RoofMeasurementEngine
jest.mock('../services/RoofMeasurementEngine', () => ({
  RoofMeasurementEngine: jest.fn().mockImplementation(() => ({
    calculateRoofMeasurement: jest.fn().mockResolvedValue({
      id: 'test-measurement',
      planes: [],
      totalArea: 100,
    }),
    validatePlanes: jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      qualityScore: 90,
      recommendations: [],
    }),
  })),
}));

describe('ManualMeasurementScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ManualMeasurementScreen />);
    
    expect(getByText('Manual Roof Measurement')).toBeTruthy();
    expect(getByText('Measurement Progress')).toBeTruthy();
    expect(getByText('Measure New Surface')).toBeTruthy();
  });

  it('shows empty state when no surfaces measured', () => {
    const { getByText } = render(<ManualMeasurementScreen />);
    
    expect(getByText('No surfaces measured yet')).toBeTruthy();
    expect(getByText('Tap "Measure New Surface" to begin')).toBeTruthy();
  });
});