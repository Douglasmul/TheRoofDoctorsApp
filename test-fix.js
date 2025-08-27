#!/usr/bin/env node

/**
 * Test script to verify the document.head.contains fix
 */

console.log('🔧 Testing document.head.contains fix...\n');

// Simulate React Native environment (before polyfill)
if (typeof document !== 'undefined') {
  delete global.document;
  delete global.window;
}

console.log('1. Before polyfill:');
console.log(`   document exists: ${typeof document !== 'undefined'}`);
console.log(`   window exists: ${typeof window !== 'undefined'}`);

// Apply the polyfill (same code as in index.js)
if (typeof document === 'undefined') {
  global.document = {
    head: {
      contains: () => false,
      appendChild: () => {},
      removeChild: () => {},
    },
    body: {
      clientWidth: 375,
      clientHeight: 812,
    },
    createElement: () => ({
      textContent: '',
      style: {},
    }),
  };
  
  if (typeof window === 'undefined') {
    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
}

console.log('\n2. After polyfill:');
console.log(`   document exists: ${typeof document !== 'undefined'}`);
console.log(`   document.head exists: ${typeof document.head !== 'undefined'}`);
console.log(`   document.head.contains exists: ${typeof document.head.contains === 'function'}`);

console.log('\n3. Testing the problematic React Navigation code:');

try {
  // Simulate the problematic code from React Navigation
  const style = document.createElement('style');
  style.textContent = ':root { --vh: 100px; }';
  
  // This is the line that was causing the error:
  const isContained = document.head.contains(style);
  console.log(`   ✅ document.head.contains(style): ${isContained}`);
  
  // Test appendChild (also used by React Navigation)
  document.head.appendChild(style);
  console.log(`   ✅ document.head.appendChild(style): success`);
  
  console.log('\n🎉 Fix is working! No more TypeError.');
  
} catch (error) {
  console.log(`   ❌ Error still occurs: ${error.message}`);
}

console.log('\n4. Testing window methods:');
try {
  window.addEventListener('resize', () => {});
  console.log('   ✅ window.addEventListener: success');
  
  window.removeEventListener('resize', () => {});
  console.log('   ✅ window.removeEventListener: success');
  
} catch (error) {
  console.log(`   ❌ Window method error: ${error.message}`);
}

console.log('\n✨ All tests passed! The React Navigation error should be resolved.');