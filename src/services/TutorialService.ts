/**
 * @fileoverview Tutorial and Onboarding Service
 * Provides guided workflows, help overlays, and interactive tutorials
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'tap' | 'drag' | 'pinch' | 'wait' | 'none';
  duration?: number; // auto-advance after duration (ms)
  required: boolean; // user must complete to advance
  validation?: () => boolean; // custom validation function
  animation?: 'fade' | 'slide' | 'pulse' | 'bounce';
  image?: string; // illustration for the step
  video?: string; // tutorial video URL
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'measurement' | 'calibration' | 'export' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[]; // other tutorial IDs
  steps: TutorialStep[];
  isCompleted?: boolean;
  completedAt?: Date;
  completionRate?: number; // 0-1
}

export interface HelpTip {
  id: string;
  trigger: 'screen_enter' | 'button_hover' | 'error' | 'idle' | 'gesture_fail';
  condition?: () => boolean;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dismissible: boolean;
  showCount: number; // how many times to show
  cooldown: number; // hours between showings
  category: string;
}

export interface UserProgress {
  tutorialsCompleted: string[];
  currentTutorial?: string;
  currentStep?: number;
  totalTimeSpent: number; // minutes
  helpTipsShown: Record<string, { count: number; lastShown: Date }>;
  skillLevel: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferences: {
    showHelpTips: boolean;
    autoAdvanceTutorials: boolean;
    preferredLanguage: string;
    accessibilityMode: boolean;
  };
}

export class TutorialService {
  private static readonly STORAGE_KEY = 'tutorial_progress';
  private static readonly HELP_TIPS_KEY = 'help_tips_shown';
  
  private userProgress: UserProgress = {
    tutorialsCompleted: [],
    totalTimeSpent: 0,
    helpTipsShown: {},
    skillLevel: 'novice',
    preferences: {
      showHelpTips: true,
      autoAdvanceTutorials: false,
      preferredLanguage: 'en',
      accessibilityMode: false,
    },
  };

  private tutorials: Tutorial[] = [];
  private helpTips: HelpTip[] = [];
  private currentTutorialSession: {
    tutorial: Tutorial;
    currentStep: number;
    startTime: Date;
    stepStartTime: Date;
  } | null = null;

  /**
   * Initialize tutorial service
   */
  async initialize(): Promise<void> {
    await this.loadUserProgress();
    this.initializeTutorials();
    this.initializeHelpTips();
  }

  /**
   * Get available tutorials
   */
  getTutorials(category?: Tutorial['category']): Tutorial[] {
    let filtered = this.tutorials;
    
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    
    // Mark completed tutorials
    return filtered.map(tutorial => ({
      ...tutorial,
      isCompleted: this.userProgress.tutorialsCompleted.includes(tutorial.id),
    }));
  }

  /**
   * Start a tutorial
   */
  async startTutorial(tutorialId: string): Promise<boolean> {
    const tutorial = this.tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return false;

    // Check prerequisites
    const unmetPrereqs = tutorial.prerequisites.filter(
      prereq => !this.userProgress.tutorialsCompleted.includes(prereq)
    );
    
    if (unmetPrereqs.length > 0) {
      throw new Error(`Missing prerequisites: ${unmetPrereqs.join(', ')}`);
    }

    this.currentTutorialSession = {
      tutorial,
      currentStep: 0,
      startTime: new Date(),
      stepStartTime: new Date(),
    };

    this.userProgress.currentTutorial = tutorialId;
    this.userProgress.currentStep = 0;
    await this.saveUserProgress();

    return true;
  }

  /**
   * Get current tutorial step
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.currentTutorialSession) return null;
    
    const session = this.currentTutorialSession;
    return session.tutorial.steps[session.currentStep] || null;
  }

  /**
   * Advance to next tutorial step
   */
  async nextStep(): Promise<{ completed: boolean; finalStep: boolean }> {
    if (!this.currentTutorialSession) {
      return { completed: false, finalStep: false };
    }

    const session = this.currentTutorialSession;
    const currentStep = session.tutorial.steps[session.currentStep];
    
    // Validate step completion if required
    if (currentStep?.required && currentStep.validation && !currentStep.validation()) {
      return { completed: false, finalStep: false };
    }

    // Track time spent on step
    const stepTime = Date.now() - session.stepStartTime.getTime();
    this.userProgress.totalTimeSpent += stepTime / (1000 * 60); // convert to minutes

    session.currentStep++;
    session.stepStartTime = new Date();

    // Check if tutorial is complete
    if (session.currentStep >= session.tutorial.steps.length) {
      await this.completeTutorial();
      return { completed: true, finalStep: true };
    }

    this.userProgress.currentStep = session.currentStep;
    await this.saveUserProgress();

    return { 
      completed: false, 
      finalStep: session.currentStep === session.tutorial.steps.length - 1 
    };
  }

  /**
   * Go to previous tutorial step
   */
  async previousStep(): Promise<boolean> {
    if (!this.currentTutorialSession || this.currentTutorialSession.currentStep === 0) {
      return false;
    }

    this.currentTutorialSession.currentStep--;
    this.currentTutorialSession.stepStartTime = new Date();
    this.userProgress.currentStep = this.currentTutorialSession.currentStep;
    await this.saveUserProgress();

    return true;
  }

  /**
   * Skip current tutorial
   */
  async skipTutorial(): Promise<void> {
    if (!this.currentTutorialSession) return;

    // Track partial completion
    const session = this.currentTutorialSession;
    const completionRate = session.currentStep / session.tutorial.steps.length;
    
    this.currentTutorialSession = null;
    this.userProgress.currentTutorial = undefined;
    this.userProgress.currentStep = undefined;
    await this.saveUserProgress();
  }

  /**
   * Complete current tutorial
   */
  private async completeTutorial(): Promise<void> {
    if (!this.currentTutorialSession) return;

    const tutorialId = this.currentTutorialSession.tutorial.id;
    const totalTime = Date.now() - this.currentTutorialSession.startTime.getTime();
    
    // Mark as completed
    if (!this.userProgress.tutorialsCompleted.includes(tutorialId)) {
      this.userProgress.tutorialsCompleted.push(tutorialId);
    }

    // Update skill level based on completed tutorials
    this.updateSkillLevel();

    this.currentTutorialSession = null;
    this.userProgress.currentTutorial = undefined;
    this.userProgress.currentStep = undefined;
    this.userProgress.totalTimeSpent += totalTime / (1000 * 60);
    
    await this.saveUserProgress();
  }

  /**
   * Get help tip for current context
   */
  getHelpTip(trigger: HelpTip['trigger'], context?: any): HelpTip | null {
    if (!this.userProgress.preferences.showHelpTips) return null;

    const relevantTips = this.helpTips.filter(tip => {
      // Check trigger
      if (tip.trigger !== trigger) return false;
      
      // Check condition if provided
      if (tip.condition && !tip.condition()) return false;
      
      // Check if already shown too many times
      const shown = this.userProgress.helpTipsShown[tip.id];
      if (shown && shown.count >= tip.showCount) return false;
      
      // Check cooldown
      if (shown && tip.cooldown > 0) {
        const hoursSinceLastShown = (Date.now() - shown.lastShown.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastShown < tip.cooldown) return false;
      }
      
      return true;
    });

    // Sort by priority and return highest priority tip
    relevantTips.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return relevantTips[0] || null;
  }

  /**
   * Mark help tip as shown
   */
  async markHelpTipShown(tipId: string): Promise<void> {
    const current = this.userProgress.helpTipsShown[tipId] || { count: 0, lastShown: new Date(0) };
    this.userProgress.helpTipsShown[tipId] = {
      count: current.count + 1,
      lastShown: new Date(),
    };
    await this.saveUserProgress();
  }

  /**
   * Get user progress and statistics
   */
  getUserProgress(): UserProgress {
    return { ...this.userProgress };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserProgress['preferences']>): Promise<void> {
    this.userProgress.preferences = { ...this.userProgress.preferences, ...preferences };
    await this.saveUserProgress();
  }

  /**
   * Reset tutorial progress
   */
  async resetProgress(): Promise<void> {
    this.userProgress = {
      tutorialsCompleted: [],
      totalTimeSpent: 0,
      helpTipsShown: {},
      skillLevel: 'novice',
      preferences: this.userProgress.preferences, // Keep preferences
    };
    this.currentTutorialSession = null;
    await this.saveUserProgress();
  }

  /**
   * Get recommended next tutorial
   */
  getRecommendedTutorial(): Tutorial | null {
    const incomplete = this.tutorials.filter(
      t => !this.userProgress.tutorialsCompleted.includes(t.id)
    );

    if (incomplete.length === 0) return null;

    // Find tutorial with met prerequisites and appropriate difficulty
    const suitable = incomplete.filter(tutorial => {
      const prereqsMet = tutorial.prerequisites.every(
        prereq => this.userProgress.tutorialsCompleted.includes(prereq)
      );
      return prereqsMet;
    });

    // Sort by difficulty and return easiest available
    suitable.sort((a, b) => {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    return suitable[0] || null;
  }

  // Private methods

  private async loadUserProgress(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(TutorialService.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.userProgress = {
          ...this.userProgress,
          ...parsed,
          // Convert date strings back to Date objects
          helpTipsShown: Object.fromEntries(
            Object.entries(parsed.helpTipsShown || {}).map(([key, value]: [string, any]) => [
              key,
              { ...value, lastShown: new Date(value.lastShown) }
            ])
          ),
        };
      }
    } catch (error) {
      console.warn('Failed to load tutorial progress:', error);
    }
  }

  private async saveUserProgress(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        TutorialService.STORAGE_KEY,
        JSON.stringify(this.userProgress)
      );
    } catch (error) {
      console.warn('Failed to save tutorial progress:', error);
    }
  }

  private updateSkillLevel(): void {
    const completedCount = this.userProgress.tutorialsCompleted.length;
    const totalTime = this.userProgress.totalTimeSpent;

    if (completedCount >= 10 && totalTime >= 240) {
      this.userProgress.skillLevel = 'expert';
    } else if (completedCount >= 7 && totalTime >= 120) {
      this.userProgress.skillLevel = 'advanced';
    } else if (completedCount >= 4 && totalTime >= 60) {
      this.userProgress.skillLevel = 'intermediate';
    } else if (completedCount >= 2) {
      this.userProgress.skillLevel = 'beginner';
    }
  }

  private initializeTutorials(): void {
    this.tutorials = [
      {
        id: 'basic_measurement',
        name: 'Basic Roof Measurement',
        description: 'Learn how to measure a simple roof using touch points',
        category: 'onboarding',
        difficulty: 'beginner',
        estimatedTime: 5,
        prerequisites: [],
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Roof Measurement',
            description: 'This tutorial will teach you how to measure roof surfaces accurately using your device camera.',
            position: 'center',
            required: false,
            animation: 'fade',
          },
          {
            id: 'camera_setup',
            title: 'Position Your Camera',
            description: 'Hold your device steady and point the camera at the roof surface you want to measure.',
            position: 'top',
            action: 'wait',
            duration: 3000,
            required: true,
          },
          {
            id: 'first_point',
            title: 'Mark Your First Point',
            description: 'Tap on a corner of the roof to place your first measurement point.',
            targetElement: 'camera-view',
            position: 'bottom',
            action: 'tap',
            required: true,
            validation: () => this.userProgress.currentStep !== undefined && this.userProgress.currentStep > 2,
          },
          {
            id: 'additional_points',
            title: 'Add More Points',
            description: 'Continue tapping to add more points around the roof perimeter. You need at least 3 points.',
            position: 'bottom',
            action: 'tap',
            required: true,
          },
          {
            id: 'complete_measurement',
            title: 'Complete Your Measurement',
            description: 'Great! You\'ve successfully measured a roof surface. Tap "Save" to complete.',
            position: 'bottom',
            required: true,
          },
        ],
      },
      {
        id: 'calibration_tutorial',
        name: 'Measurement Calibration',
        description: 'Learn how to calibrate measurements using reference objects',
        category: 'calibration',
        difficulty: 'intermediate',
        estimatedTime: 8,
        prerequisites: ['basic_measurement'],
        steps: [
          {
            id: 'why_calibrate',
            title: 'Why Calibrate?',
            description: 'Calibration ensures your measurements are accurate by using a known reference object.',
            position: 'center',
            required: false,
          },
          {
            id: 'choose_reference',
            title: 'Choose Reference Object',
            description: 'Select a reference object like a business card or coin that you have with you.',
            position: 'center',
            required: true,
          },
          {
            id: 'measure_reference',
            title: 'Measure Reference',
            description: 'Carefully mark the edges of your reference object to establish scale.',
            position: 'bottom',
            action: 'tap',
            required: true,
          },
        ],
      },
      {
        id: 'advanced_features',
        name: 'Advanced Features',
        description: 'Explore undo/redo, different measurement modes, and export options',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 12,
        prerequisites: ['basic_measurement', 'calibration_tutorial'],
        steps: [
          {
            id: 'measurement_modes',
            title: 'Measurement Modes',
            description: 'Switch between tap-to-point, freehand drawing, and edge detection modes.',
            position: 'top',
            required: true,
          },
          {
            id: 'undo_redo',
            title: 'Undo and Redo',
            description: 'Use undo/redo buttons to correct mistakes in your measurements.',
            position: 'top',
            required: true,
          },
          {
            id: 'export_options',
            title: 'Export Your Data',
            description: 'Learn how to export your measurements as PDF, CSV, or image files.',
            position: 'bottom',
            required: true,
          },
        ],
      },
    ];
  }

  private initializeHelpTips(): void {
    this.helpTips = [
      {
        id: 'first_time_camera',
        trigger: 'screen_enter',
        condition: () => this.userProgress.tutorialsCompleted.length === 0,
        message: 'Tip: For best results, ensure good lighting and hold your device steady while measuring.',
        priority: 'medium',
        dismissible: true,
        showCount: 3,
        cooldown: 24,
        category: 'measurement',
      },
      {
        id: 'measurement_accuracy',
        trigger: 'error',
        message: 'Having trouble with accuracy? Try calibrating with a reference object first.',
        priority: 'high',
        dismissible: true,
        showCount: 5,
        cooldown: 1,
        category: 'accuracy',
      },
      {
        id: 'undo_available',
        trigger: 'button_hover',
        condition: () => this.userProgress.tutorialsCompleted.includes('basic_measurement'),
        message: 'You can undo your last action using the undo button.',
        priority: 'low',
        dismissible: true,
        showCount: 2,
        cooldown: 48,
        category: 'ui',
      },
    ];
  }
}

// Singleton instance
export const tutorialService = new TutorialService();