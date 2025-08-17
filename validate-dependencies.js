/**
 * Validation script to check useEffect dependencies in RoofARCameraScreen.tsx
 * This verifies the fixes for infinite render loops
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/screens/RoofARCameraScreen.tsx');
const content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Validating useEffect dependencies in RoofARCameraScreen.tsx...\n');

// Test 1: Check that all useEffect hooks have dependency arrays (including empty arrays)
const useEffectsWithDeps = content.match(/useEffect\([\s\S]*?\}\s*,\s*\[[\s\S]*?\]\s*\);/g);
// Look for useEffect that ends with }); without a dependency array
const useEffectsWithoutDeps = content.match(/useEffect\([\s\S]*?\}\s*\);\s*(?!\s*\/\/)/g);

console.log('✅ Test 1: useEffect dependency arrays');
console.log(`  - useEffect hooks with dependencies: ${useEffectsWithDeps?.length || 0}`);
console.log(`  - useEffect hooks without dependencies: ${useEffectsWithoutDeps?.length || 0}`);

if (useEffectsWithoutDeps && useEffectsWithoutDeps.length > 0) {
  console.log('❌ ISSUE: Found useEffect without dependency array (potential infinite loop)');
  console.log('Details:', useEffectsWithoutDeps);
  process.exit(1);
} else {
  console.log('✅ All useEffect hooks have dependency arrays\n');
}

// Test 2: Check for problematic dependencies
console.log('✅ Test 2: Checking for problematic dependencies');

// Look specifically in dependency arrays for whole object references
const dependencyArrays = content.match(/\[[\s\S]*?\]/g) || [];
let hasProblematicDeps = false;

dependencyArrays.forEach((depArray, index) => {
  // Check if this is a useEffect or useCallback dependency array
  if (content.includes(depArray) && (content.indexOf(depArray) > content.indexOf('useEffect') || content.indexOf(depArray) > content.indexOf('useCallback'))) {
    // Check for whole object dependencies (not method calls)
    if (/(?:^|[,\s])arPlaneDetection(?![.\w])/.test(depArray)) {
      console.log(`❌ Found arPlaneDetection object dependency in: ${depArray.substring(0, 100)}...`);
      hasProblematicDeps = true;
    }
    if (/(?:^|[,\s])pitchSensor(?![.\w])/.test(depArray)) {
      console.log(`❌ Found pitchSensor object dependency in: ${depArray.substring(0, 100)}...`);
      hasProblematicDeps = true;
    }
  }
});

if (hasProblematicDeps) {
  console.log('❌ ISSUE: Found dependency on entire hook object instead of specific method');
  process.exit(1);
} else {
  console.log('✅ No dependencies on entire hook objects\n');
}

// Test 3: Check plane detection useEffect specifically
console.log('✅ Test 3: Plane detection useEffect circular dependency check');

const planeDetectionMatch = content.match(/Handle plane detection updates[\s\S]*?useEffect\([\s\S]*?\[[\s\S]*?\]\s*\);/);

if (planeDetectionMatch) {
  const depArray = planeDetectionMatch[0];
  if (depArray.includes('capturedPlanes.length')) {
    console.log('❌ ISSUE: Plane detection useEffect depends on capturedPlanes.length (circular dependency)');
    process.exit(1);
  } else {
    console.log('✅ Plane detection useEffect does not have circular dependency\n');
  }
} else {
  console.log('❌ Could not find plane detection useEffect');
  process.exit(1);
}

// Test 4: Check callback dependencies
console.log('✅ Test 4: Callback dependencies check');

const callbacks = [
  'initializeARSession',
  'completeMeasurement', 
  'resetMeasurement',
  'capturePoint',
  'requestPermissions'
];

let callbackIssues = 0;
callbacks.forEach(callback => {
  const callbackMatch = content.match(new RegExp(`const ${callback} = useCallback\\([\\s\\S]*?\\[([\\s\\S]*?)\\]\\s*\\);`));
  if (callbackMatch) {
    const deps = callbackMatch[1];
    // Check for specific method calls instead of object dependencies
    if (deps.includes('arPlaneDetection.') || deps.includes('pitchSensor.')) {
      console.log(`✅ ${callback}: Uses specific methods`);
    } else if (deps.includes('arPlaneDetection') || deps.includes('pitchSensor')) {
      console.log(`❌ ${callback}: Depends on entire hook object`);
      callbackIssues++;
    } else {
      console.log(`✅ ${callback}: No hook object dependencies`);
    }
  }
});

if (callbackIssues > 0) {
  console.log('\n❌ ISSUE: Found callbacks with problematic hook dependencies');
  process.exit(1);
}

console.log('\n🎉 All validation checks passed!');
console.log('✅ useEffect hooks have proper dependency arrays');
console.log('✅ No circular dependencies detected');  
console.log('✅ Callbacks use specific method references');
console.log('✅ Should prevent infinite render loops\n');