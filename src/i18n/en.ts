/**
 * @fileoverview English language translations for AR roof measurement app
 * Enterprise-grade internationalization with accessibility support
 * @version 1.0.0
 * @language en-US
 */

export const en = {
  // Common/General
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    retry: 'Retry',
    reset: 'Reset',
    export: 'Export',
    import: 'Import',
    sync: 'Sync',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    close: 'Close',
    continue: 'Continue',
    done: 'Done',
    yes: 'Yes',
    no: 'No',
  },

  // Navigation
  navigation: {
    home: 'Home',
    measureRoof: 'Measure Roof',
    measurements: 'Measurements',
    reports: 'Reports',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
  },

  // AR Camera Screen
  arCamera: {
    title: 'AR Roof Measurement',
    subtitle: 'Point camera at roof surface',
    instructions: {
      initializing: 'Initializing AR system...',
      detecting: 'Point camera at roof surface and tap to mark corners',
      measuring: 'Tap corners to outline roof sections',
      complete: 'Measurement complete! Review your results.',
      permission: 'Camera permission required for AR measurement',
      noAR: 'AR not supported on this device',
      lowLight: 'Better lighting needed for accurate measurement',
      moveSlowly: 'Move device slowly for better tracking',
      holdSteady: 'Hold device steady while measuring',
      tapToMark: 'Tap screen to mark measurement points',
      goodTracking: 'Good AR tracking - continue measuring',
      poorTracking: 'Poor AR tracking - adjust lighting or move slower',
    },
    status: {
      initializing: 'Initializing',
      detecting: 'Detecting',
      measuring: 'Measuring',
      complete: 'Complete',
      error: 'Error',
    },
    controls: {
      capture: 'Capture',
      capturing: 'Capturing...',
      reset: 'Reset',
      complete: 'Complete',
      calibrate: 'Calibrate',
      settings: 'Settings',
    },
    feedback: {
      planeDetected: '{{count}} roof surface detected',
      planeDetected_plural: '{{count}} roof surfaces detected',
      pointCaptured: 'Point captured. {{count}} points total.',
      measurementReset: 'Measurement reset. Ready to start new measurement.',
      measurementComplete: 'Measurement complete. Navigating to review screen.',
      arInitialized: 'AR measurement initialized. Point camera at roof surface.',
      sensorError: 'Unable to get device orientation. Please ensure device is stable.',
      captureError: 'Failed to capture measurement point.',
      noPlanes: 'No roof surfaces detected. Try adjusting camera angle.',
      goodQuality: 'Excellent measurement quality',
      fairQuality: 'Good measurement quality',
      poorQuality: 'Poor measurement quality - consider remeasuring',
    },
    accessibility: {
      cameraView: 'AR camera view for roof measurement',
      captureButton: 'Capture measurement point',
      resetButton: 'Reset all measurements and start over',
      completeButton: 'Complete measurement and review results',
      statusDisplay: 'Current measurement status and information',
      qualityIndicator: 'Measurement quality indicator',
      planeOverlay: 'Detected roof surface outline',
      instructionsPanel: 'Measurement instructions and guidance',
    },
  },

  // Measurement Review Screen
  measurementReview: {
    title: 'Roof Measurement Report',
    subtitle: 'Measured on {{date}}',
    summary: {
      title: 'Measurement Summary',
      totalArea: 'Total Area',
      projectedArea: 'Projected Area',
      roofPlanes: 'Roof Planes',
      accuracy: 'Accuracy',
      duration: 'Duration',
      quality: 'Quality',
    },
    planes: {
      title: 'Roof Surfaces',
      surface: 'Surface {{number}}',
      area: 'Area',
      pitch: 'Pitch',
      material: 'Material',
      confidence: 'Confidence',
      type: {
        primary: 'Primary',
        secondary: 'Secondary',
        dormer: 'Dormer',
        chimney: 'Chimney',
        other: 'Other',
      },
    },
    materials: {
      title: 'Material Requirements',
      baseArea: 'Base Area',
      withWaste: 'With Waste Factor',
      shingleBundles: 'Shingle Bundles',
      metalSheets: 'Metal Sheets',
      tiles: 'Tiles',
      costEstimate: 'Cost Estimate',
      materialCost: 'Material Cost',
      laborCost: 'Labor Cost',
      totalCost: 'Total Cost',
    },
    quality: {
      title: 'Quality Metrics',
      overallScore: 'Overall Score',
      trackingStability: 'Tracking Stability',
      pointDensity: 'Point Density',
      lightingQuality: 'Lighting Quality',
      movementSmoothness: 'Movement Smoothness',
      trackingInterruptions: 'Tracking Interruptions',
    },
    compliance: {
      title: 'Compliance Status',
      status: 'Status',
      compliant: 'COMPLIANT',
      nonCompliant: 'NON-COMPLIANT',
      pending: 'PENDING',
      unknown: 'UNKNOWN',
      standards: 'Standards Met',
      certifications: 'Certifications',
      lastCheck: 'Last Check',
      nextCheck: 'Next Check',
    },
    sync: {
      title: 'Cloud Sync',
      status: 'Status',
      syncing: 'Syncing...',
      success: 'Success',
      error: 'Error',
      lastSync: 'Last sync',
      progress: 'Progress',
    },
    export: {
      title: 'Export Measurement',
      formats: {
        pdf: 'PDF Report',
        csv: 'CSV Data',
        json: 'JSON Data',
        image: 'Image',
        cad: 'CAD File',
      },
      options: {
        includeRawData: 'Include Raw Data',
        includeQualityMetrics: 'Include Quality Metrics',
        includeAuditTrail: 'Include Audit Trail',
        includeCompliance: 'Include Compliance Data',
      },
      success: 'Measurement exported as {{format}}',
      error: 'Export failed: {{error}}',
    },
    actions: {
      export: 'Export',
      sync: 'Cloud Sync',
      compliance: 'Compliance',
      share: 'Share',
      edit: 'Edit',
      duplicate: 'Duplicate',
      delete: 'Delete',
    },
    alerts: {
      noData: 'No measurement data available',
      syncComplete: 'Measurement has been backed up to the cloud.',
      syncFailed: 'Unable to sync measurement to cloud.',
      exportComplete: 'Export complete',
      exportFailed: 'Unable to export measurement data.',
      reportGenerated: 'Compliance report has been generated and can be shared.',
      reportFailed: 'Unable to generate compliance report.',
      deleteConfirm: 'Are you sure you want to delete this measurement?',
      dataLoss: 'This action cannot be undone.',
    },
  },

  // Pitch Sensor
  pitchSensor: {
    calibration: {
      title: 'Sensor Calibration',
      instruction: 'Hold device level and steady for {{seconds}} seconds',
      progress: 'Calibrating... {{progress}}%',
      complete: 'Calibration complete',
      failed: 'Calibration failed - please try again',
      quality: {
        excellent: 'Excellent calibration quality',
        good: 'Good calibration quality',
        fair: 'Fair calibration quality',
        poor: 'Poor calibration quality - recalibration recommended',
      },
    },
    measurement: {
      pitch: 'Pitch',
      roll: 'Roll', 
      yaw: 'Heading',
      accuracy: 'Accuracy',
      confidence: 'Confidence',
      stability: 'Stability',
    },
    errors: {
      notAvailable: 'Device motion sensors are not available',
      measurementFailed: 'Measurement failed',
      calibrationTimeout: 'Calibration timeout',
      lowAccuracy: 'Low sensor accuracy detected',
    },
  },

  // API and Sync
  api: {
    errors: {
      networkError: 'Network connection error',
      authenticationFailed: 'Authentication failed',
      serverError: 'Server error occurred',
      timeout: 'Request timeout',
      unauthorized: 'Unauthorized access',
      forbidden: 'Access forbidden',
      notFound: 'Resource not found',
      validationError: 'Data validation error',
      rateLimit: 'Rate limit exceeded',
    },
    sync: {
      inProgress: 'Syncing data...',
      complete: 'Sync complete',
      failed: 'Sync failed',
      offline: 'Offline - data will sync when connected',
      queueSize: '{{count}} operations queued',
    },
    upload: {
      inProgress: 'Uploading measurement...',
      complete: 'Upload complete',
      failed: 'Upload failed',
      retrying: 'Retrying upload...',
    },
  },

  // Permissions
  permissions: {
    camera: {
      title: 'Camera Permission Required',
      message: 'This app needs camera access to measure roofs using AR technology.',
      denied: 'Camera permission denied. Please enable in settings.',
      instructions: 'Go to Settings > Privacy > Camera and enable access for this app.',
    },
    location: {
      title: 'Location Permission Required',
      message: 'Location access helps improve measurement accuracy and compliance reporting.',
      denied: 'Location permission denied.',
    },
    storage: {
      title: 'Storage Permission Required',
      message: 'Storage access is needed to save and export measurement data.',
      denied: 'Storage permission denied.',
    },
  },

  // Validation and Errors
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsDoNotMatch: 'Passwords do not match',
    invalidMeasurement: 'Invalid measurement data',
    insufficientData: 'Insufficient measurement data for calculation',
    qualityTooLow: 'Measurement quality too low - please remeasure',
    planesTooSmall: 'Detected planes are too small for accurate measurement',
    geometryInvalid: 'Invalid roof geometry detected',
  },

  // Units and Formatting
  units: {
    area: {
      squareMeters: 'm²',
      squareFeet: 'ft²',
      squareYards: 'yd²',
    },
    length: {
      meters: 'm',
      feet: 'ft',
      inches: 'in',
    },
    angle: {
      degrees: '°',
      radians: 'rad',
    },
    currency: {
      usd: '$',
      eur: '€',
      gbp: '£',
    },
  },

  // Accessibility
  accessibility: {
    announcements: {
      appStarted: 'Roof measurement app started',
      navigationChanged: 'Navigated to {{screen}}',
      measurementStarted: 'Measurement session started',
      measurementCompleted: 'Measurement session completed',
      planeDetected: 'New roof surface detected',
      errorOccurred: 'Error occurred: {{error}}',
      loadingComplete: 'Loading complete',
    },
    hints: {
      tapToActivate: 'Tap to activate',
      swipeToNavigate: 'Swipe to navigate',
      doubleTapToConfirm: 'Double tap to confirm',
      longPressForOptions: 'Long press for options',
    },
    labels: {
      menuButton: 'Open navigation menu',
      backButton: 'Go back to previous screen',
      closeButton: 'Close current dialog',
      moreOptions: 'More options available',
    },
  },

  // Enterprise Features
  enterprise: {
    audit: {
      title: 'Audit Trail',
      action: 'Action',
      timestamp: 'Timestamp',
      user: 'User',
      description: 'Description',
      dataHash: 'Data Hash',
    },
    compliance: {
      standards: {
        iso25178: 'ISO 25178 - Surface Texture',
        astmE2738: 'ASTM E2738 - Photogrammetry',
        nrcaStandards: 'NRCA Standards',
      },
      certifications: {
        enterprise: 'Enterprise Certification',
        professional: 'Professional Certification',
        basic: 'Basic Certification',
      },
    },
    erp: {
      title: 'ERP Integration',
      systems: {
        sap: 'SAP',
        oracle: 'Oracle',
        microsoft: 'Microsoft Dynamics',
        salesforce: 'Salesforce',
        custom: 'Custom System',
      },
      sync: {
        realtime: 'Real-time',
        hourly: 'Hourly',
        daily: 'Daily',
        weekly: 'Weekly',
      },
    },
    security: {
      encryption: 'Data Encryption',
      privacy: 'Privacy Controls',
      audit: 'Audit Logging',
      compliance: 'Compliance Monitoring',
    },
  },

  // Voice Guidance
  voice: {
    enabled: 'Voice guidance enabled',
    disabled: 'Voice guidance disabled',
    guidance: {
      welcome: 'Welcome to roof measurement. Point your camera at the roof to begin.',
      arReady: 'AR system ready. Tap screen to mark measurement points.',
      planeDetected: 'Roof surface detected. Continue marking points.',
      measurementComplete: 'Measurement complete. Review your results.',
      lowQuality: 'Low measurement quality. Move closer or improve lighting.',
      calibrationNeeded: 'Sensor calibration recommended for better accuracy.',
      saveReminder: 'Remember to save your measurement data.',
    },
  },
};

export default en;