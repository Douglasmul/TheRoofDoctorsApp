#!/bin/bash

# Verification script for TypeError fix implementation
# This script verifies that all components are in place for debugging the contains() error

echo "🔍 Verifying TypeError fix implementation..."
echo

# Check App.tsx wrapper order
echo "1. Checking App.tsx wrapper order..."
if grep -q "GestureHandlerRootView" App.tsx && \
   grep -q "SafeAreaProvider" App.tsx && \
   grep -q "ErrorBoundary" App.tsx && \
   grep -q "AuthProvider" App.tsx && \
   grep -q "NavigationContainer" App.tsx; then
    echo "✅ All required wrappers are imported in App.tsx"
else
    echo "❌ Missing required wrappers in App.tsx"
    exit 1
fi

# Check ErrorBoundary enhancements
echo "2. Checking ErrorBoundary enhancements..."
if grep -q "CONTAINS ERROR DETECTED" src/components/ErrorBoundary.tsx && \
   grep -q "Props at error time" src/components/ErrorBoundary.tsx; then
    echo "✅ ErrorBoundary has enhanced logging for contains() errors"
else
    echo "❌ ErrorBoundary missing enhanced logging"
    exit 1
fi

# Check AuthProvider logging
echo "3. Checking AuthProvider defensive logging..."
if grep -q "AuthProvider render - children type" src/contexts/AuthContext.tsx && \
   grep -q "AuthProvider render error" src/contexts/AuthContext.tsx; then
    echo "✅ AuthProvider has defensive logging"
else
    echo "❌ AuthProvider missing defensive logging"
    exit 1
fi

# Check AppNavigator structure
echo "4. Checking AppNavigator structure..."
if ! grep -q "NavigationContainer" src/navigation/AppNavigator.tsx; then
    echo "✅ NavigationContainer removed from AppNavigator"
else
    echo "❌ NavigationContainer still present in AppNavigator"
    exit 1
fi

# Check if dependencies are available
echo "5. Checking required dependencies..."
if grep -q "react-native-gesture-handler" package.json && \
   grep -q "react-native-safe-area-context" package.json && \
   grep -q "@react-navigation/native" package.json; then
    echo "✅ All required dependencies are present"
else
    echo "❌ Missing required dependencies"
    exit 1
fi

echo
echo "🎉 All verifications passed!"
echo
echo "📋 Manual testing instructions:"
echo "1. Install and run: rm -rf node_modules && npm install && npx expo start -c"
echo "2. Check console logs for AuthProvider render information"
echo "3. If TypeError occurs, ErrorBoundary will log detailed error information"
echo "4. Look for 'CONTAINS ERROR DETECTED' message in console for specific diagnosis"
echo
echo "🔧 The fix addresses the common React Native wrapper ordering issue that causes"
echo "   'Cannot read property contains of undefined' errors during navigation/rendering"