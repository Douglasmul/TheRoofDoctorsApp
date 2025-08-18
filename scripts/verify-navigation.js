#!/usr/bin/env node
/**
 * @fileoverview Navigation verification script
 * Verifies that all screens are properly imported and can be found
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Navigation Configuration...\n');

// Read the AppNavigator file
const navigatorPath = path.join(__dirname, '..', 'src', 'navigation', 'AppNavigator.tsx');
const navigatorContent = fs.readFileSync(navigatorPath, 'utf8');

// Read the navigation types file
const typesPath = path.join(__dirname, '..', 'src', 'types', 'navigation.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

// List all screen files
const screensDir = path.join(__dirname, '..', 'src', 'screens');
const screenFiles = fs.readdirSync(screensDir)
  .filter(file => file.endsWith('.tsx'))
  .map(file => file.replace('.tsx', ''));

console.log(`📁 Found ${screenFiles.length} screen files:`);
screenFiles.forEach(screen => console.log(`   ✓ ${screen}.tsx`));
console.log('');

// Check imports in AppNavigator
console.log('📥 Checking imports in AppNavigator...');
let missingImports = [];
screenFiles.forEach(screen => {
  const importPattern = new RegExp(`import.*${screen}.*from.*screens\/${screen}`, 'i');
  if (!importPattern.test(navigatorContent)) {
    missingImports.push(screen);
  } else {
    console.log(`   ✓ ${screen} imported`);
  }
});

if (missingImports.length > 0) {
  console.log('   ❌ Missing imports:', missingImports.join(', '));
} else {
  console.log('   ✅ All screens imported correctly');
}
console.log('');

// Check Stack.Screen registrations
console.log('📝 Checking screen registrations...');
let missingRegistrations = [];
screenFiles.forEach(screen => {
  // Look for screen name in Stack.Screen components, handling different naming patterns
  const possibleNames = [
    screen,
    screen.replace('Screen', ''),
    screen.replace('App', '')
  ];
  
  const isRegistered = possibleNames.some(name => {
    const registrationPattern = new RegExp(`<Stack\\.Screen[^>]*name=["']${name}["']`, 'i');
    return registrationPattern.test(navigatorContent);
  });
  
  if (!isRegistered) {
    missingRegistrations.push(screen);
  } else {
    console.log(`   ✓ ${screen} registered`);
  }
});

if (missingRegistrations.length > 0) {
  console.log('   ❌ Missing registrations:', missingRegistrations.join(', '));
} else {
  console.log('   ✅ All screens registered correctly');
}
console.log('');

// Check navigation types
console.log('🔢 Checking navigation types...');
const typeMatches = typesContent.match(/(\w+):\s*(undefined|{[^}]*})/g) || [];
const definedTypes = typeMatches.map(match => match.split(':')[0].trim());

console.log(`   Found ${definedTypes.length} type definitions:`);
definedTypes.forEach(type => console.log(`   ✓ ${type}`));

// Summary
console.log('\n📊 Summary:');
console.log(`   Screens found: ${screenFiles.length}`);
console.log(`   Missing imports: ${missingImports.length}`);
console.log(`   Missing registrations: ${missingRegistrations.length}`);
console.log(`   Type definitions: ${definedTypes.length}`);

if (missingImports.length === 0 && missingRegistrations.length === 0) {
  console.log('\n✅ Navigation configuration looks good!');
  process.exit(0);
} else {
  console.log('\n❌ Navigation configuration needs attention.');
  process.exit(1);
}