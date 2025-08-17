/**
 * @fileoverview Spanish language translations for AR roof measurement app
 * Enterprise-grade internationalization with accessibility support
 * @version 1.0.0
 * @language es-ES
 */

export const es = {
  // Common/General
  common: {
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Finalizar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    retry: 'Reintentar',
    reset: 'Restablecer',
    export: 'Exportar',
    import: 'Importar',
    sync: 'Sincronizar',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    close: 'Cerrar',
    continue: 'Continuar',
    done: 'Hecho',
    yes: 'Sí',
    no: 'No',
  },

  // Navigation
  navigation: {
    home: 'Inicio',
    measureRoof: 'Medir Techo',
    measurements: 'Mediciones',
    reports: 'Informes',
    profile: 'Perfil',
    settings: 'Configuración',
    help: 'Ayuda',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    signup: 'Registrarse',
  },

  // AR Camera Screen
  arCamera: {
    title: 'Medición AR del Techo',
    subtitle: 'Apunte la cámara a la superficie del techo',
    instructions: {
      initializing: 'Inicializando sistema AR...',
      detecting: 'Apunte la cámara a la superficie del techo y toque para marcar esquinas',
      measuring: 'Toque las esquinas para delinear secciones del techo',
      complete: '¡Medición completa! Revise sus resultados.',
      permission: 'Se requiere permiso de cámara para medición AR',
      noAR: 'AR no compatible con este dispositivo',
      lowLight: 'Se necesita mejor iluminación para medición precisa',
      moveSlowly: 'Mueva el dispositivo lentamente para mejor seguimiento',
      holdSteady: 'Mantenga el dispositivo estable mientras mide',
      tapToMark: 'Toque la pantalla para marcar puntos de medición',
      goodTracking: 'Buen seguimiento AR - continúe midiendo',
      poorTracking: 'Seguimiento AR deficiente - ajuste la iluminación o muévase más lento',
    },
    status: {
      initializing: 'Inicializando',
      detecting: 'Detectando',
      measuring: 'Midiendo',
      complete: 'Completo',
      error: 'Error',
    },
    controls: {
      capture: 'Capturar',
      capturing: 'Capturando...',
      reset: 'Restablecer',
      complete: 'Completar',
      calibrate: 'Calibrar',
      settings: 'Configuración',
    },
    feedback: {
      planeDetected: '{{count}} superficie del techo detectada',
      planeDetected_plural: '{{count}} superficies del techo detectadas',
      pointCaptured: 'Punto capturado. {{count}} puntos en total.',
      measurementReset: 'Medición restablecida. Listo para comenzar nueva medición.',
      measurementComplete: 'Medición completa. Navegando a pantalla de revisión.',
      arInitialized: 'Medición AR inicializada. Apunte la cámara a la superficie del techo.',
      sensorError: 'No se puede obtener la orientación del dispositivo. Asegúrese de que el dispositivo esté estable.',
      captureError: 'Falló la captura del punto de medición.',
      noPlanes: 'No se detectaron superficies del techo. Intente ajustar el ángulo de la cámara.',
      goodQuality: 'Excelente calidad de medición',
      fairQuality: 'Buena calidad de medición',
      poorQuality: 'Calidad de medición deficiente - considere volver a medir',
    },
    accessibility: {
      cameraView: 'Vista de cámara AR para medición del techo',
      captureButton: 'Capturar punto de medición',
      resetButton: 'Restablecer todas las mediciones y comenzar de nuevo',
      completeButton: 'Completar medición y revisar resultados',
      statusDisplay: 'Estado e información de medición actual',
      qualityIndicator: 'Indicador de calidad de medición',
      planeOverlay: 'Contorno de superficie del techo detectada',
      instructionsPanel: 'Instrucciones y orientación de medición',
    },
  },

  // Measurement Review Screen
  measurementReview: {
    title: 'Informe de Medición del Techo',
    subtitle: 'Medido el {{date}}',
    summary: {
      title: 'Resumen de Medición',
      totalArea: 'Área Total',
      projectedArea: 'Área Proyectada',
      roofPlanes: 'Planos del Techo',
      accuracy: 'Precisión',
      duration: 'Duración',
      quality: 'Calidad',
    },
    planes: {
      title: 'Superficies del Techo',
      surface: 'Superficie {{number}}',
      area: 'Área',
      pitch: 'Inclinación',
      material: 'Material',
      confidence: 'Confianza',
      type: {
        primary: 'Primario',
        secondary: 'Secundario',
        dormer: 'Buhardilla',
        chimney: 'Chimenea',
        other: 'Otro',
      },
    },
    materials: {
      title: 'Requisitos de Material',
      baseArea: 'Área Base',
      withWaste: 'Con Factor de Desperdicio',
      shingleBundles: 'Paquetes de Tejas',
      metalSheets: 'Láminas Metálicas',
      tiles: 'Tejas',
      costEstimate: 'Estimación de Costo',
      materialCost: 'Costo de Material',
      laborCost: 'Costo de Mano de Obra',
      totalCost: 'Costo Total',
    },
    quality: {
      title: 'Métricas de Calidad',
      overallScore: 'Puntuación General',
      trackingStability: 'Estabilidad de Seguimiento',
      pointDensity: 'Densidad de Puntos',
      lightingQuality: 'Calidad de Iluminación',
      movementSmoothness: 'Suavidad de Movimiento',
      trackingInterruptions: 'Interrupciones de Seguimiento',
    },
    compliance: {
      title: 'Estado de Cumplimiento',
      status: 'Estado',
      compliant: 'CUMPLE',
      nonCompliant: 'NO CUMPLE',
      pending: 'PENDIENTE',
      unknown: 'DESCONOCIDO',
      standards: 'Estándares Cumplidos',
      certifications: 'Certificaciones',
      lastCheck: 'Última Verificación',
      nextCheck: 'Próxima Verificación',
    },
    sync: {
      title: 'Sincronización en la Nube',
      status: 'Estado',
      syncing: 'Sincronizando...',
      success: 'Éxito',
      error: 'Error',
      lastSync: 'Última sincronización',
      progress: 'Progreso',
    },
    export: {
      title: 'Exportar Medición',
      formats: {
        pdf: 'Informe PDF',
        csv: 'Datos CSV',
        json: 'Datos JSON',
        image: 'Imagen',
        cad: 'Archivo CAD',
      },
      options: {
        includeRawData: 'Incluir Datos Brutos',
        includeQualityMetrics: 'Incluir Métricas de Calidad',
        includeAuditTrail: 'Incluir Registro de Auditoría',
        includeCompliance: 'Incluir Datos de Cumplimiento',
      },
      success: 'Medición exportada como {{format}}',
      error: 'Falló la exportación: {{error}}',
    },
    actions: {
      export: 'Exportar',
      sync: 'Sincronizar en la Nube',
      compliance: 'Cumplimiento',
      share: 'Compartir',
      edit: 'Editar',
      duplicate: 'Duplicar',
      delete: 'Eliminar',
    },
    alerts: {
      noData: 'No hay datos de medición disponibles',
      syncComplete: 'La medición ha sido respaldada en la nube.',
      syncFailed: 'No se pudo sincronizar la medición en la nube.',
      exportComplete: 'Exportación completa',
      exportFailed: 'No se pudieron exportar los datos de medición.',
      reportGenerated: 'Se ha generado el informe de cumplimiento y se puede compartir.',
      reportFailed: 'No se pudo generar el informe de cumplimiento.',
      deleteConfirm: '¿Está seguro de que desea eliminar esta medición?',
      dataLoss: 'Esta acción no se puede deshacer.',
    },
  },

  // Pitch Sensor
  pitchSensor: {
    calibration: {
      title: 'Calibración del Sensor',
      instruction: 'Mantenga el dispositivo nivelado y estable durante {{seconds}} segundos',
      progress: 'Calibrando... {{progress}}%',
      complete: 'Calibración completa',
      failed: 'La calibración falló - intente de nuevo',
      quality: {
        excellent: 'Excelente calidad de calibración',
        good: 'Buena calidad de calibración',
        fair: 'Calidad de calibración aceptable',
        poor: 'Calidad de calibración deficiente - se recomienda recalibrar',
      },
    },
    measurement: {
      pitch: 'Inclinación',
      roll: 'Balanceo',
      yaw: 'Rumbo',
      accuracy: 'Precisión',
      confidence: 'Confianza',
      stability: 'Estabilidad',
    },
    errors: {
      notAvailable: 'Los sensores de movimiento del dispositivo no están disponibles',
      measurementFailed: 'La medición falló',
      calibrationTimeout: 'Tiempo de calibración agotado',
      lowAccuracy: 'Se detectó baja precisión del sensor',
    },
  },

  // API and Sync
  api: {
    errors: {
      networkError: 'Error de conexión de red',
      authenticationFailed: 'Falló la autenticación',
      serverError: 'Ocurrió un error del servidor',
      timeout: 'Tiempo de solicitud agotado',
      unauthorized: 'Acceso no autorizado',
      forbidden: 'Acceso prohibido',
      notFound: 'Recurso no encontrado',
      validationError: 'Error de validación de datos',
      rateLimit: 'Límite de velocidad excedido',
    },
    sync: {
      inProgress: 'Sincronizando datos...',
      complete: 'Sincronización completa',
      failed: 'La sincronización falló',
      offline: 'Sin conexión - los datos se sincronizarán cuando esté conectado',
      queueSize: '{{count}} operaciones en cola',
    },
    upload: {
      inProgress: 'Subiendo medición...',
      complete: 'Subida completa',
      failed: 'La subida falló',
      retrying: 'Reintentando subida...',
    },
  },

  // Permissions
  permissions: {
    camera: {
      title: 'Se Requiere Permiso de Cámara',
      message: 'Esta aplicación necesita acceso a la cámara para medir techos usando tecnología AR.',
      denied: 'Permiso de cámara denegado. Habilite en configuración.',
      instructions: 'Vaya a Configuración > Privacidad > Cámara y habilite el acceso para esta aplicación.',
    },
    location: {
      title: 'Se Requiere Permiso de Ubicación',
      message: 'El acceso a la ubicación ayuda a mejorar la precisión de medición y los informes de cumplimiento.',
      denied: 'Permiso de ubicación denegado.',
    },
    storage: {
      title: 'Se Requiere Permiso de Almacenamiento',
      message: 'Se necesita acceso al almacenamiento para guardar y exportar datos de medición.',
      denied: 'Permiso de almacenamiento denegado.',
    },
  },

  // Validation and Errors
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Ingrese una dirección de correo electrónico válida',
    invalidPhone: 'Ingrese un número de teléfono válido',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres',
    passwordsDoNotMatch: 'Las contraseñas no coinciden',
    invalidMeasurement: 'Datos de medición inválidos',
    insufficientData: 'Datos de medición insuficientes para el cálculo',
    qualityTooLow: 'Calidad de medición demasiado baja - vuelva a medir',
    planesTooSmall: 'Los planos detectados son demasiado pequeños para una medición precisa',
    geometryInvalid: 'Geometría del techo inválida detectada',
  },

  // Units and Formatting
  units: {
    area: {
      squareMeters: 'm²',
      squareFeet: 'pie²',
      squareYards: 'yarda²',
    },
    length: {
      meters: 'm',
      feet: 'pie',
      inches: 'pulg',
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
      appStarted: 'Aplicación de medición de techos iniciada',
      navigationChanged: 'Navegó a {{screen}}',
      measurementStarted: 'Sesión de medición iniciada',
      measurementCompleted: 'Sesión de medición completada',
      planeDetected: 'Nueva superficie del techo detectada',
      errorOccurred: 'Ocurrió un error: {{error}}',
      loadingComplete: 'Carga completa',
    },
    hints: {
      tapToActivate: 'Toque para activar',
      swipeToNavigate: 'Deslice para navegar',
      doubleTapToConfirm: 'Doble toque para confirmar',
      longPressForOptions: 'Presión larga para opciones',
    },
    labels: {
      menuButton: 'Abrir menú de navegación',
      backButton: 'Regresar a la pantalla anterior',
      closeButton: 'Cerrar diálogo actual',
      moreOptions: 'Más opciones disponibles',
    },
  },

  // Enterprise Features
  enterprise: {
    audit: {
      title: 'Registro de Auditoría',
      action: 'Acción',
      timestamp: 'Marca de Tiempo',
      user: 'Usuario',
      description: 'Descripción',
      dataHash: 'Hash de Datos',
    },
    compliance: {
      standards: {
        iso25178: 'ISO 25178 - Textura de Superficie',
        astmE2738: 'ASTM E2738 - Fotogrametría',
        nrcaStandards: 'Estándares NRCA',
      },
      certifications: {
        enterprise: 'Certificación Empresarial',
        professional: 'Certificación Profesional',
        basic: 'Certificación Básica',
      },
    },
    erp: {
      title: 'Integración ERP',
      systems: {
        sap: 'SAP',
        oracle: 'Oracle',
        microsoft: 'Microsoft Dynamics',
        salesforce: 'Salesforce',
        custom: 'Sistema Personalizado',
      },
      sync: {
        realtime: 'Tiempo Real',
        hourly: 'Cada Hora',
        daily: 'Diario',
        weekly: 'Semanal',
      },
    },
    security: {
      encryption: 'Cifrado de Datos',
      privacy: 'Controles de Privacidad',
      audit: 'Registro de Auditoría',
      compliance: 'Monitoreo de Cumplimiento',
    },
  },

  // Voice Guidance
  voice: {
    enabled: 'Guía de voz habilitada',
    disabled: 'Guía de voz deshabilitada',
    guidance: {
      welcome: 'Bienvenido a la medición de techos. Apunte su cámara al techo para comenzar.',
      arReady: 'Sistema AR listo. Toque la pantalla para marcar puntos de medición.',
      planeDetected: 'Superficie del techo detectada. Continúe marcando puntos.',
      measurementComplete: 'Medición completa. Revise sus resultados.',
      lowQuality: 'Baja calidad de medición. Acérquese más o mejore la iluminación.',
      calibrationNeeded: 'Se recomienda calibración del sensor para mejor precisión.',
      saveReminder: 'Recuerde guardar sus datos de medición.',
    },
  },
};

export default es;