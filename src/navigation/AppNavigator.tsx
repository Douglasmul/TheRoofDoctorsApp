import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import MeasureRoofScreen from '../screens/MeasureRoofScreen';
import QuoteScreen from '../screens/QuoteScreen';

export type RootStackParamList = {
  Home: undefined;
  MeasureRoof: undefined;
  Quote: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'The Roof Doctors' }} />
        <Stack.Screen name="MeasureRoof" component={MeasureRoofScreen} options={{ title: 'Measure Roof' }} />
        <Stack.Screen name="Quote" component={QuoteScreen} options={{ title: 'Quote' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}