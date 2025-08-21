# Animation Fixes for React Native New Architecture

## Issues Fixed

### 1. Deprecated `setLayoutAnimationEnabledExperimental` Warning
**Problem**: React Native New Architecture (Fabric) deprecated the `UIManager.setLayoutAnimationEnabledExperimental` API, causing warnings.

**Solution**: Removed the deprecated API call and replaced `LayoutAnimation` with the `Animated` API for better compatibility.

**Files Changed**:
- `src/components/menu/MenuSection.tsx`

### 2. Animation Driver Conflicts
**Problem**: Mixed usage of `useNativeDriver: true` and `useNativeDriver: false` in animation sequences could cause runtime errors.

**Solution**: Implemented proper separation strategy:
- **Transform animations** (rotate, scale): Use `useNativeDriver: true`
- **Layout/Color animations** (height, opacity, backgroundColor): Use `useNativeDriver: false`

**Files Changed**:
- `src/components/menu/MenuSection.tsx`
- `src/components/menu/MenuItem.tsx`

## Technical Details

### MenuSection Component
- **Before**: Used `LayoutAnimation.configureNext()` for expand/collapse
- **After**: Uses `Animated.parallel()` with separate `heightAnim` and `rotateAnim`
- **Benefit**: Full compatibility with New Architecture, no deprecated APIs

### MenuItem Component  
- **Before**: Mixed animation drivers without clear documentation
- **After**: Clearly separated `scaleAnim` (native) and `pressAnim` (JS) with documentation
- **Benefit**: Prevents animation conflicts, clearer code intent

## Animation Driver Guidelines

### Use `useNativeDriver: true` for:
- Transform properties: `transform`, `opacity` 
- Properties that don't affect layout: `scale`, `rotate`, `translateX/Y`

### Use `useNativeDriver: false` for:
- Layout properties: `width`, `height`, `margin`, `padding`
- Color properties: `backgroundColor`, `borderColor`
- Properties that require layout calculations

## Verification

The changes ensure:
1. ✅ No deprecated API warnings in New Architecture
2. ✅ No animation conflicts between native and JS drivers  
3. ✅ Smooth animations with proper performance
4. ✅ Clear documentation for future maintenance