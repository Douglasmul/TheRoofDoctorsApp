import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../src/screens/HomeScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    renderWithNavigation(<HomeScreen />);
    
    expect(screen.getByText('The Roof Doctors')).toBeTruthy();
    expect(screen.getByText('Welcome to your enterprise roofing assistant.')).toBeTruthy();
    expect(screen.getByText('Measure Roof')).toBeTruthy();
    expect(screen.getByText('Get a Quote')).toBeTruthy();
  });

  it('has the correct header text', () => {
    renderWithNavigation(<HomeScreen />);
    
    const header = screen.getByText('The Roof Doctors');
    expect(header).toBeTruthy();
  });
});