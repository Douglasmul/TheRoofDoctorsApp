/**
 * @fileoverview Internationalization Service
 * Provides multi-language support and localization features
 * @version 1.0.0
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export interface LocalizedStrings {
  // Common
  common: {
    ok: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    done: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    retry: string;
    skip: string;
    yes: string;
    no: string;
  };

  // Navigation
  navigation: {
    home: string;
    measure: string;
    calibration: string;
    projects: string;
    settings: string;
    help: string;
    profile: string;
  };

  // Measurement
  measurement: {
    title: string;
    selectMode: string;
    tapToPoint: string;
    freehandDrawing: string;
    edgeDetection: string;
    snapToGrid: string;
    calibrateFirst: string;
    pointsSelected: string;
    area: string;
    perimeter: string;
    accuracy: string;
    confidence: string;
    undo: string;
    redo: string;
    clearAll: string;
    savePoints: string;
    insufficientPoints: string;
    measurementComplete: string;
  };

  // Calibration
  calibration: {
    title: string;
    selectReference: string;
    positionObject: string;
    markCorners: string;
    quality: string;
    successful: string;
    failed: string;
    businessCard: string;
    creditCard: string;
    quarter: string;
    ruler: string;
    custom: string;
    improveAccuracy: string;
    calibrateNow: string;
  };

  // Camera
  camera: {
    permissionRequired: string;
    flash: string;
    grid: string;
    zoom: string;
    focus: string;
    exposure: string;
    import: string;
    gallery: string;
    documents: string;
  };

  // Projects
  projects: {
    title: string;
    newProject: string;
    client: string;
    property: string;
    status: string;
    priority: string;
    notes: string;
    photos: string;
    attachments: string;
    export: string;
    share: string;
    completed: string;
    inProgress: string;
    planning: string;
  };

  // Tutorial
  tutorial: {
    welcome: string;
    getStarted: string;
    basicMeasurement: string;
    calibrationTutorial: string;
    advancedFeatures: string;
    skipTutorial: string;
    nextStep: string;
    previousStep: string;
    complete: string;
  };

  // Errors
  errors: {
    network: string;
    camera: string;
    storage: string;
    calibration: string;
    measurement: string;
    export: string;
    permission: string;
    unknown: string;
  };

  // Help
  help: {
    tips: string;
    faq: string;
    contact: string;
    documentation: string;
    video: string;
    feedback: string;
  };
}

const englishStrings: LocalizedStrings = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    retry: 'Retry',
    skip: 'Skip',
    yes: 'Yes',
    no: 'No',
  },
  navigation: {
    home: 'Home',
    measure: 'Measure',
    calibration: 'Calibration',
    projects: 'Projects',
    settings: 'Settings',
    help: 'Help',
    profile: 'Profile',
  },
  measurement: {
    title: 'Roof Measurement',
    selectMode: 'Select Mode',
    tapToPoint: 'Tap to Point',
    freehandDrawing: 'Freehand Drawing',
    edgeDetection: 'Edge Detection',
    snapToGrid: 'Snap to Grid',
    calibrateFirst: 'Calibrate for accuracy',
    pointsSelected: 'points selected',
    area: 'Area',
    perimeter: 'Perimeter',
    accuracy: 'Accuracy',
    confidence: 'Confidence',
    undo: 'Undo',
    redo: 'Redo',
    clearAll: 'Clear All',
    savePoints: 'Save Points',
    insufficientPoints: 'Need at least 3 points',
    measurementComplete: 'Measurement Complete',
  },
  calibration: {
    title: 'Calibration',
    selectReference: 'Select Reference Object',
    positionObject: 'Position Object',
    markCorners: 'Mark Corners',
    quality: 'Quality',
    successful: 'Calibration Successful',
    failed: 'Calibration Failed',
    businessCard: 'Business Card',
    creditCard: 'Credit Card',
    quarter: 'Quarter',
    ruler: 'Ruler',
    custom: 'Custom',
    improveAccuracy: 'Improve Accuracy',
    calibrateNow: 'Calibrate Now',
  },
  camera: {
    permissionRequired: 'Camera permission required',
    flash: 'Flash',
    grid: 'Grid',
    zoom: 'Zoom',
    focus: 'Focus',
    exposure: 'Exposure',
    import: 'Import',
    gallery: 'Gallery',
    documents: 'Documents',
  },
  projects: {
    title: 'Projects',
    newProject: 'New Project',
    client: 'Client',
    property: 'Property',
    status: 'Status',
    priority: 'Priority',
    notes: 'Notes',
    photos: 'Photos',
    attachments: 'Attachments',
    export: 'Export',
    share: 'Share',
    completed: 'Completed',
    inProgress: 'In Progress',
    planning: 'Planning',
  },
  tutorial: {
    welcome: 'Welcome',
    getStarted: 'Get Started',
    basicMeasurement: 'Basic Measurement',
    calibrationTutorial: 'Calibration Tutorial',
    advancedFeatures: 'Advanced Features',
    skipTutorial: 'Skip Tutorial',
    nextStep: 'Next Step',
    previousStep: 'Previous Step',
    complete: 'Complete',
  },
  errors: {
    network: 'Network connection error',
    camera: 'Camera access error',
    storage: 'Storage access error',
    calibration: 'Calibration error',
    measurement: 'Measurement error',
    export: 'Export error',
    permission: 'Permission denied',
    unknown: 'Unknown error occurred',
  },
  help: {
    tips: 'Tips',
    faq: 'FAQ',
    contact: 'Contact',
    documentation: 'Documentation',
    video: 'Video Tutorial',
    feedback: 'Feedback',
  },
};

const spanishStrings: LocalizedStrings = {
  common: {
    ok: 'Aceptar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    done: 'Hecho',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    retry: 'Reintentar',
    skip: 'Omitir',
    yes: 'Sí',
    no: 'No',
  },
  navigation: {
    home: 'Inicio',
    measure: 'Medir',
    calibration: 'Calibración',
    projects: 'Proyectos',
    settings: 'Configuración',
    help: 'Ayuda',
    profile: 'Perfil',
  },
  measurement: {
    title: 'Medición de Techo',
    selectMode: 'Seleccionar Modo',
    tapToPoint: 'Tocar Punto',
    freehandDrawing: 'Dibujo Libre',
    edgeDetection: 'Detección de Bordes',
    snapToGrid: 'Ajustar a Cuadrícula',
    calibrateFirst: 'Calibrar para precisión',
    pointsSelected: 'puntos seleccionados',
    area: 'Área',
    perimeter: 'Perímetro',
    accuracy: 'Precisión',
    confidence: 'Confianza',
    undo: 'Deshacer',
    redo: 'Rehacer',
    clearAll: 'Limpiar Todo',
    savePoints: 'Guardar Puntos',
    insufficientPoints: 'Se necesitan al menos 3 puntos',
    measurementComplete: 'Medición Completa',
  },
  calibration: {
    title: 'Calibración',
    selectReference: 'Seleccionar Objeto de Referencia',
    positionObject: 'Posicionar Objeto',
    markCorners: 'Marcar Esquinas',
    quality: 'Calidad',
    successful: 'Calibración Exitosa',
    failed: 'Calibración Fallida',
    businessCard: 'Tarjeta de Negocios',
    creditCard: 'Tarjeta de Crédito',
    quarter: 'Moneda de 25 Centavos',
    ruler: 'Regla',
    custom: 'Personalizado',
    improveAccuracy: 'Mejorar Precisión',
    calibrateNow: 'Calibrar Ahora',
  },
  camera: {
    permissionRequired: 'Se requiere permiso de cámara',
    flash: 'Flash',
    grid: 'Cuadrícula',
    zoom: 'Zoom',
    focus: 'Enfoque',
    exposure: 'Exposición',
    import: 'Importar',
    gallery: 'Galería',
    documents: 'Documentos',
  },
  projects: {
    title: 'Proyectos',
    newProject: 'Nuevo Proyecto',
    client: 'Cliente',
    property: 'Propiedad',
    status: 'Estado',
    priority: 'Prioridad',
    notes: 'Notas',
    photos: 'Fotos',
    attachments: 'Adjuntos',
    export: 'Exportar',
    share: 'Compartir',
    completed: 'Completado',
    inProgress: 'En Progreso',
    planning: 'Planificación',
  },
  tutorial: {
    welcome: 'Bienvenido',
    getStarted: 'Comenzar',
    basicMeasurement: 'Medición Básica',
    calibrationTutorial: 'Tutorial de Calibración',
    advancedFeatures: 'Características Avanzadas',
    skipTutorial: 'Omitir Tutorial',
    nextStep: 'Siguiente Paso',
    previousStep: 'Paso Anterior',
    complete: 'Completar',
  },
  errors: {
    network: 'Error de conexión de red',
    camera: 'Error de acceso a la cámara',
    storage: 'Error de acceso al almacenamiento',
    calibration: 'Error de calibración',
    measurement: 'Error de medición',
    export: 'Error de exportación',
    permission: 'Permiso denegado',
    unknown: 'Ocurrió un error desconocido',
  },
  help: {
    tips: 'Consejos',
    faq: 'Preguntas Frecuentes',
    contact: 'Contacto',
    documentation: 'Documentación',
    video: 'Tutorial en Video',
    feedback: 'Comentarios',
  },
};

const frenchStrings: LocalizedStrings = {
  common: {
    ok: 'OK',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    edit: 'Modifier',
    done: 'Terminé',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Info',
    retry: 'Réessayer',
    skip: 'Ignorer',
    yes: 'Oui',
    no: 'Non',
  },
  navigation: {
    home: 'Accueil',
    measure: 'Mesurer',
    calibration: 'Étalonnage',
    projects: 'Projets',
    settings: 'Paramètres',
    help: 'Aide',
    profile: 'Profil',
  },
  measurement: {
    title: 'Mesure de Toit',
    selectMode: 'Sélectionner le Mode',
    tapToPoint: 'Toucher pour Pointer',
    freehandDrawing: 'Dessin à Main Levée',
    edgeDetection: 'Détection de Bords',
    snapToGrid: 'Aligner sur la Grille',
    calibrateFirst: 'Étalonner pour la précision',
    pointsSelected: 'points sélectionnés',
    area: 'Superficie',
    perimeter: 'Périmètre',
    accuracy: 'Précision',
    confidence: 'Confiance',
    undo: 'Annuler',
    redo: 'Refaire',
    clearAll: 'Tout Effacer',
    savePoints: 'Sauvegarder les Points',
    insufficientPoints: 'Au moins 3 points nécessaires',
    measurementComplete: 'Mesure Terminée',
  },
  calibration: {
    title: 'Étalonnage',
    selectReference: 'Sélectionner Objet de Référence',
    positionObject: 'Positionner l\'Objet',
    markCorners: 'Marquer les Coins',
    quality: 'Qualité',
    successful: 'Étalonnage Réussi',
    failed: 'Étalonnage Échoué',
    businessCard: 'Carte de Visite',
    creditCard: 'Carte de Crédit',
    quarter: 'Pièce de 25 Cents',
    ruler: 'Règle',
    custom: 'Personnalisé',
    improveAccuracy: 'Améliorer la Précision',
    calibrateNow: 'Étalonner Maintenant',
  },
  camera: {
    permissionRequired: 'Permission caméra requise',
    flash: 'Flash',
    grid: 'Grille',
    zoom: 'Zoom',
    focus: 'Focus',
    exposure: 'Exposition',
    import: 'Importer',
    gallery: 'Galerie',
    documents: 'Documents',
  },
  projects: {
    title: 'Projets',
    newProject: 'Nouveau Projet',
    client: 'Client',
    property: 'Propriété',
    status: 'Statut',
    priority: 'Priorité',
    notes: 'Notes',
    photos: 'Photos',
    attachments: 'Pièces Jointes',
    export: 'Exporter',
    share: 'Partager',
    completed: 'Terminé',
    inProgress: 'En Cours',
    planning: 'Planification',
  },
  tutorial: {
    welcome: 'Bienvenue',
    getStarted: 'Commencer',
    basicMeasurement: 'Mesure de Base',
    calibrationTutorial: 'Tutoriel d\'Étalonnage',
    advancedFeatures: 'Fonctionnalités Avancées',
    skipTutorial: 'Ignorer le Tutoriel',
    nextStep: 'Étape Suivante',
    previousStep: 'Étape Précédente',
    complete: 'Terminer',
  },
  errors: {
    network: 'Erreur de connexion réseau',
    camera: 'Erreur d\'accès à la caméra',
    storage: 'Erreur d\'accès au stockage',
    calibration: 'Erreur d\'étalonnage',
    measurement: 'Erreur de mesure',
    export: 'Erreur d\'exportation',
    permission: 'Permission refusée',
    unknown: 'Erreur inconnue',
  },
  help: {
    tips: 'Conseils',
    faq: 'FAQ',
    contact: 'Contact',
    documentation: 'Documentation',
    video: 'Tutoriel Vidéo',
    feedback: 'Commentaires',
  },
};

export type SupportedLanguage = 'en' | 'es' | 'fr';

const languageStrings: Record<SupportedLanguage, LocalizedStrings> = {
  en: englishStrings,
  es: spanishStrings,
  fr: frenchStrings,
};

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const supportedLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export class InternationalizationService {
  private static readonly LANGUAGE_KEY = 'app_language';
  private currentLanguage: SupportedLanguage = 'en';
  private currentStrings: LocalizedStrings = englishStrings;
  private listeners: Array<(language: SupportedLanguage, strings: LocalizedStrings) => void> = [];

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Try to load saved language preference
    try {
      const savedLanguage = await AsyncStorage.getItem(InternationalizationService.LANGUAGE_KEY);
      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage as SupportedLanguage;
      } else {
        // Auto-detect from device locale
        const deviceLanguage = this.detectDeviceLanguage();
        this.currentLanguage = deviceLanguage;
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
      // Fall back to device language detection
      this.currentLanguage = this.detectDeviceLanguage();
    }

    this.updateStrings();
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get current localized strings
   */
  getStrings(): LocalizedStrings {
    return this.currentStrings;
  }

  /**
   * Set the current language
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    this.currentLanguage = language;
    this.updateStrings();
    
    // Save preference
    try {
      await AsyncStorage.setItem(InternationalizationService.LANGUAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get localized string by key path
   */
  getString(keyPath: string): string {
    const keys = keyPath.split('.');
    let current: any = this.currentStrings;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Missing translation key: ${keyPath}`);
        return keyPath; // Return key path as fallback
      }
    }
    
    if (typeof current === 'string') {
      return current;
    }
    
    console.warn(`Invalid translation key: ${keyPath}`);
    return keyPath;
  }

  /**
   * Get formatted string with parameters
   */
  getFormattedString(keyPath: string, params: Record<string, string | number>): string {
    let str = this.getString(keyPath);
    
    Object.entries(params).forEach(([key, value]) => {
      str = str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });
    
    return str;
  }

  /**
   * Get plural form of a string
   */
  getPlural(keyPath: string, count: number, params?: Record<string, string | number>): string {
    // Simple plural logic - in a full implementation, you'd use proper plural rules for each language
    const str = this.getString(keyPath);
    const finalParams = { ...params, count };
    
    if (count === 1) {
      return this.getFormattedString(keyPath, finalParams);
    } else {
      // Look for plural form or add 's' for English
      const pluralKey = `${keyPath}_plural`;
      try {
        return this.getFormattedString(pluralKey, finalParams);
      } catch {
        // Fallback to simple plural for English
        if (this.currentLanguage === 'en') {
          return this.getFormattedString(keyPath, finalParams) + 's';
        }
        return this.getFormattedString(keyPath, finalParams);
      }
    }
  }

  /**
   * Subscribe to language changes
   */
  subscribe(listener: (language: SupportedLanguage, strings: LocalizedStrings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageInfo[] {
    return [...supportedLanguages];
  }

  /**
   * Check if app is in right-to-left layout language
   */
  isRTL(): boolean {
    // None of our currently supported languages use RTL
    // In the future, you'd check for Arabic, Hebrew, etc.
    return false;
  }

  /**
   * Format number according to current locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.getLocale(), options).format(value);
    } catch (error) {
      return value.toString();
    }
  }

  /**
   * Format currency according to current locale
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat(this.getLocale(), {
        style: 'currency',
        currency,
      }).format(value);
    } catch (error) {
      return `${currency} ${value}`;
    }
  }

  /**
   * Format date according to current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.getLocale(), options).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  // Private methods

  private detectDeviceLanguage(): SupportedLanguage {
    const deviceLocale = Localization.locale;
    const languageCode = deviceLocale.split('-')[0].toLowerCase();
    
    if (this.isValidLanguage(languageCode)) {
      return languageCode as SupportedLanguage;
    }
    
    return 'en'; // Default fallback
  }

  private isValidLanguage(language: string): boolean {
    return language in languageStrings;
  }

  private updateStrings(): void {
    this.currentStrings = languageStrings[this.currentLanguage];
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => 
      listener(this.currentLanguage, this.currentStrings)
    );
  }

  private getLocale(): string {
    switch (this.currentLanguage) {
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'en':
      default: return 'en-US';
    }
  }
}

// Singleton instance
export const i18nService = new InternationalizationService();

// Convenience hook for React components
export const useI18n = () => {
  const [currentStrings, setCurrentStrings] = React.useState(i18nService.getStrings());
  const [currentLanguage, setCurrentLanguage] = React.useState(i18nService.getCurrentLanguage());

  React.useEffect(() => {
    const unsubscribe = i18nService.subscribe((language, strings) => {
      setCurrentLanguage(language);
      setCurrentStrings(strings);
    });

    return unsubscribe;
  }, []);

  return {
    strings: currentStrings,
    language: currentLanguage,
    getString: (keyPath: string) => i18nService.getString(keyPath),
    getFormattedString: (keyPath: string, params: Record<string, string | number>) => 
      i18nService.getFormattedString(keyPath, params),
    getPlural: (keyPath: string, count: number, params?: Record<string, string | number>) =>
      i18nService.getPlural(keyPath, count, params),
    setLanguage: (language: SupportedLanguage) => i18nService.setLanguage(language),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => 
      i18nService.formatNumber(value, options),
    formatCurrency: (value: number, currency?: string) => 
      i18nService.formatCurrency(value, currency),
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => 
      i18nService.formatDate(date, options),
    isRTL: () => i18nService.isRTL(),
    getSupportedLanguages: () => i18nService.getSupportedLanguages(),
  };
};