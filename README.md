# TheRoofDoctorsApp

Enterprise roofing assistant app with AR measurement capabilities and comprehensive screen navigation.

## Navigation & Testing

All enterprise screens are accessible for testing via an integrated testing menu. See [TESTING_NAVIGATION.md](TESTING_NAVIGATION.md) for complete navigation guide.

### Available Screens
- **Core Features**: Home, Measure Roof, AR Camera, Quote Generation
- **Authentication**: Login, Sign Up  
- **User Account**: Profile, Settings, Notifications
- **Business**: Reports, Admin Panel
- **Support**: Help, Legal Information, Error Handling

The testing menu automatically appears in development mode and is hidden in production builds.

## Merge Conflict Resolution

This repository includes automated tools for resolving merge conflicts in package management files. See [docs/MERGE_CONFLICTS.md](docs/MERGE_CONFLICTS.md) for detailed guidance.

### Quick Commands
- `npm run resolve-conflicts` - Detect and resolve merge conflicts
- `npm run test-conflicts` - Create test conflicts for development
- `npm run restore-conflicts` - Restore original files from test conflicts