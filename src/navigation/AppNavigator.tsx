import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import all screens
import HomeScreen from '../screens/HomeScreen';
import OpenAppScreen from '../screens/OpenApp';
import MeasureRoofScreen from '../screens/MeasureRoofScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import QuoteScreen from '../screens/QuoteScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'The Roof Doctors' }}
        />
        <Stack.Screen 
          name="OpenApp" 
          component={OpenAppScreen} 
          options={{ title: 'Welcome' }}
        />
        <Stack.Screen 
          name="MeasureRoof" 
          component={MeasureRoofScreen} 
          options={{ title: 'Measure Roof' }}
        />
        <Stack.Screen 
          name="Quote" 
          component={QuoteScreen} 
          options={{ title: 'Get a Quote' }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}