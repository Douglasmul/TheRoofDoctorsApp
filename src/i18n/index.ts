/**
 * @fileoverview Internationalization configuration for AR roof measurement app
 * Enterprise-grade i18n setup with accessibility and voice guidance support
 * @version 1.0.0
 * @enterprise
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { es } from './es';

/**
 * Language detection plugin for React Native
 */
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get stored language preference
      const storedLanguage = await AsyncStorage.getItem('user-language');
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }

      // Fall back to device locale
      const deviceLocale = Localization.locale;
      const languageCode = deviceLocale.split('-')[0];
      
      // Check if we support the detected language
      const supportedLanguages = ['en', 'es'];
      const detectedLanguage = supportedLanguages.includes(languageCode) 
        ? languageCode 
        : 'en'; // Default to English

      callback(detectedLanguage);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en'); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error caching user language:', error);
    }
  },
};

/**
 * Initialize i18next with enterprise configuration
 */
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Resources
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    
    // Language settings
    fallbackLng: 'en',
    lng: undefined, // Will be detected
    
    // Namespace settings
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Debugging (disable in production)
    debug: __DEV__,
    
    // Key settings
    keySeparator: '.',
    nsSeparator: ':',
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes
      format: (value, format, lng) => {
        // Custom formatters for enterprise features
        switch (format) {
          case 'currency':
            return new Intl.NumberFormat(lng, {
              style: 'currency',
              currency: 'USD', // TODO: Make dynamic based on user settings
            }).format(value);
          
          case 'area':
            return new Intl.NumberFormat(lng, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);
          
          case 'percentage':
            return new Intl.NumberFormat(lng, {
              style: 'percent',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }).format(value / 100);
          
          case 'date':
            return new Intl.DateTimeFormat(lng, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date(value));
          
          case 'time':
            return new Intl.DateTimeFormat(lng, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(new Date(value));
          
          case 'datetime':
            return new Intl.DateTimeFormat(lng, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(value));
          
          default:
            return value;
        }
      },
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // React settings
    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
      useSuspense: false,
    },
    
    // Performance settings
    initImmediate: false,
    
    // Missing keys handling
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (__DEV__) {
        console.warn(`Missing translation key: ${lng}.${ns}.${key}`);
      }
      // TODO: In production, send missing keys to analytics/monitoring
    },
    
    // Post-processing
    postProcess: ['interval', 'plural'],
    
    // Backend settings (for future dynamic loading)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
  });

/**
 * Enterprise i18n utilities
 */
export class I18nManager {
  /**
   * Get current language
   */
  static getCurrentLanguage(): string {
    return i18n.language;
  }

  /**
   * Change language with persistence
   */
  static async changeLanguage(language: string): Promise<void> {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('user-language', language);
      
      // Announce language change for accessibility
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const message = i18n.t('accessibility.announcements.languageChanged', { language });
        this.announceForAccessibility(message);
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  }

  /**
   * Get available languages
   */
  static getAvailableLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ];
  }

  /**
   * Get localized number format
   */
  static formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  }

  /**
   * Get localized currency format
   */
  static formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Get localized date format
   */
  static formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(i18n.language, options).format(date);
  }

  /**
   * Get localized area format based on user preference
   */
  static formatArea(value: number, unit: 'metric' | 'imperial' = 'metric'): string {
    const formattedValue = this.formatNumber(value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    const unitSymbol = unit === 'metric' 
      ? i18n.t('units.area.squareMeters')
      : i18n.t('units.area.squareFeet');
    
    return `${formattedValue} ${unitSymbol}`;
  }

  /**
   * Get localized angle format
   */
  static formatAngle(value: number): string {
    const formattedValue = this.formatNumber(value, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    
    return `${formattedValue}${i18n.t('units.angle.degrees')}`;
  }

  /**
   * Get direction/orientation for RTL languages
   */
  static getLayoutDirection(): 'ltr' | 'rtl' {
    // Currently supporting LTR languages only
    // TODO: Add RTL support for Arabic, Hebrew, etc.
    return 'ltr';
  }

  /**
   * Check if current language is RTL
   */
  static isRTL(): boolean {
    return this.getLayoutDirection() === 'rtl';
  }

  /**
   * Get voice guidance text with SSML markup
   */
  static getVoiceGuidance(key: string, options?: any): string {
    const text = i18n.t(key, options);
    
    // Add SSML markup for better pronunciation
    let ssmlText = text;
    
    // Add pauses after punctuation
    ssmlText = ssmlText.replace(/\./g, '.<break time="500ms"/>');
    ssmlText = ssmlText.replace(/,/g, ',<break time="300ms"/>');
    
    // Emphasize important words
    ssmlText = ssmlText.replace(/(\d+\.?\d*)\s*(m²|ft²|°)/g, '<emphasis level="strong">$1 $2</emphasis>');
    
    return `<speak>${ssmlText}</speak>`;
  }

  /**
   * Announce text for accessibility users
   */
  static announceForAccessibility(text: string): void {
    // TODO: Implement platform-specific accessibility announcements
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Load additional language resources dynamically
   */
  static async loadLanguageResources(language: string): Promise<void> {
    try {
      // TODO: Implement dynamic loading from server
      // const resources = await fetch(`/api/locales/${language}.json`);
      // const translations = await resources.json();
      // i18n.addResourceBundle(language, 'translation', translations, true, true);
      console.log(`Loading resources for ${language} - not implemented yet`);
    } catch (error) {
      console.error(`Error loading language resources for ${language}:`, error);
    }
  }

  /**
   * Get pluralization rules for current language
   */
  static getPluralRule(count: number): string {
    // Use Intl.PluralRules for accurate pluralization
    const pr = new Intl.PluralRules(i18n.language);
    return pr.select(count);
  }

  /**
   * Format measurement units based on user preference
   */
  static formatMeasurementUnit(
    value: number,
    type: 'area' | 'length' | 'angle',
    system: 'metric' | 'imperial' = 'metric'
  ): string {
    switch (type) {
      case 'area':
        return this.formatArea(value, system);
      
      case 'length':
        const lengthValue = this.formatNumber(value, { maximumFractionDigits: 2 });
        const lengthUnit = system === 'metric' 
          ? i18n.t('units.length.meters')
          : i18n.t('units.length.feet');
        return `${lengthValue} ${lengthUnit}`;
      
      case 'angle':
        return this.formatAngle(value);
      
      default:
        return this.formatNumber(value);
    }
  }

  /**
   * Validate translation completeness
   */
  static validateTranslations(): { [language: string]: string[] } {
    const issues: { [language: string]: string[] } = {};
    
    // TODO: Implement translation validation
    // Compare all languages against base language (English)
    // Report missing keys, empty values, etc.
    
    return issues;
  }
}

// Export configured i18n instance
export default i18n;

// Export translation function for convenience
export const t = i18n.t.bind(i18n);

// TODO: Add support for additional languages (French, German, Portuguese, etc.)
// TODO: Implement context-aware translations for technical terms
// TODO: Add support for region-specific variations (en-US vs en-GB)
// TODO: Integrate with translation management systems (Crowdin, Lokalise)
// TODO: Add automatic translation quality checks
// TODO: Implement A/B testing for different translation variants
// TODO: Add support for dynamic content translation via API
// TODO: Integrate with voice synthesis for better pronunciation