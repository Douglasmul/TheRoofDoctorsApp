import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OpenAppScreen from '../screens/OpenApp';
import MeasureRoofScreen from '../screens/MeasureRoofScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="OpenApp">
        <Stack.Screen name="OpenApp" component={OpenAppScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MeasureRoof" component={MeasureRoofScreen} options={{ title: 'Measure Roof' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}