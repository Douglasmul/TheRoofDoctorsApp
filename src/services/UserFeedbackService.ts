/**
 * @fileoverview User Feedback and Support Service
 * Handles bug reports, feature requests, and user support
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MailComposer from 'expo-mail-composer';
import { Alert, Share } from 'react-native';

export interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'compliment';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'submitted' | 'acknowledged' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  
  // User information
  userEmail?: string;
  userName?: string;
  userId?: string;
  
  // Technical details
  appVersion: string;
  deviceInfo: {
    platform: string;
    osVersion: string;
    deviceModel: string;
    screenDimensions: { width: number; height: number };
  };
  
  // Context
  screenName?: string;
  userActions?: string[];
  errorLogs?: string[];
  screenshots?: string[];
  
  // Feedback metadata
  tags: string[];
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  workaround?: string;
  
  // Response tracking
  responseReceived: boolean;
  responseDate?: Date;
  responseMessage?: string;
  satisfaction?: 1 | 2 | 3 | 4 | 5;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature' | 'general';
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  
  // Contact information
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  
  // Conversation history
  messages: SupportMessage[];
  
  // Attachments
  attachments: string[];
  
  // Internal tracking
  assignedAgent?: string;
  estimatedResolution?: Date;
  actualResolution?: Date;
  customerSatisfaction?: number;
}

export interface SupportMessage {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  bugReports: number;
  featureRequests: number;
  averageResponseTime: number; // hours
  satisfactionScore: number; // 1-5
  topCategories: Array<{ category: string; count: number }>;
  trendData: Array<{ date: string; count: number; type: string }>;
}

export class UserFeedbackService {
  private static readonly FEEDBACK_KEY = 'user_feedback';
  private static readonly SUPPORT_KEY = 'support_tickets';
  private static readonly SETTINGS_KEY = 'feedback_settings';
  
  private feedback: FeedbackItem[] = [];
  private supportTickets: SupportTicket[] = [];
  private settings = {
    enableAutoSubmit: false,
    includeDeviceInfo: true,
    includeLogs: true,
    enableCrashReporting: true,
    emailNotifications: true,
  };

  private listeners: Array<() => void> = [];

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadFeedback(),
      this.loadSupportTickets(),
      this.loadSettings(),
    ]);
  }

  /**
   * Create a new feedback item
   */
  async createFeedback(feedbackData: Omit<FeedbackItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'appVersion' | 'deviceInfo' | 'responseReceived'>): Promise<FeedbackItem> {
    const feedback: FeedbackItem = {
      ...feedbackData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      appVersion: await this.getAppVersion(),
      deviceInfo: await this.getDeviceInfo(),
      responseReceived: false,
    };

    this.feedback.push(feedback);
    await this.saveFeedback();
    this.notifyListeners();

    // Auto-submit if enabled
    if (this.settings.enableAutoSubmit) {
      await this.submitFeedback(feedback.id);
    }

    return feedback;
  }

  /**
   * Submit feedback via email or API
   */
  async submitFeedback(feedbackId: string): Promise<boolean> {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (!feedback) return false;

    try {
      // Check if email is available
      const isEmailAvailable = await MailComposer.isAvailableAsync();
      
      if (isEmailAvailable) {
        const subject = `${feedback.type.toUpperCase()}: ${feedback.title}`;
        const body = this.formatFeedbackEmail(feedback);
        
        const result = await MailComposer.composeAsync({
          recipients: ['support@theroofdoctors.com'],
          subject,
          body,
          isHtml: true,
          attachments: feedback.screenshots || [],
        });

        if (result.status === MailComposer.MailComposerStatus.SENT) {
          feedback.status = 'submitted';
          feedback.updatedAt = new Date();
          await this.saveFeedback();
          this.notifyListeners();
          return true;
        }
      } else {
        // Fallback to sharing
        const shareText = this.formatFeedbackText(feedback);
        await Share.share({
          message: shareText,
          title: `Feedback: ${feedback.title}`,
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }

    return false;
  }

  /**
   * Create a new support ticket
   */
  async createSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'messages'>): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      ...ticketData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'open',
      messages: [],
    };

    this.supportTickets.push(ticket);
    await this.saveSupportTickets();
    this.notifyListeners();

    return ticket;
  }

  /**
   * Quick feedback methods for common scenarios
   */
  async reportBug(title: string, description: string, screenName?: string, errorLogs?: string[]): Promise<FeedbackItem> {
    return this.createFeedback({
      type: 'bug',
      title,
      description,
      category: 'bug',
      priority: 'medium',
      screenName,
      errorLogs,
      tags: ['bug', 'auto-reported'],
    });
  }

  async requestFeature(title: string, description: string, category?: string): Promise<FeedbackItem> {
    return this.createFeedback({
      type: 'feature',
      title,
      description,
      category: category || 'feature',
      priority: 'low',
      tags: ['feature-request'],
    });
  }

  async reportCrash(error: Error, stackTrace?: string, userActions?: string[]): Promise<FeedbackItem> {
    return this.createFeedback({
      type: 'bug',
      title: `App Crash: ${error.name}`,
      description: `${error.message}\n\nStack trace:\n${stackTrace || error.stack}`,
      category: 'crash',
      priority: 'high',
      errorLogs: [error.message, stackTrace || error.stack || ''].filter(Boolean),
      userActions,
      tags: ['crash', 'auto-reported'],
    });
  }

  /**
   * Get all feedback items
   */
  getFeedback(filter?: {
    type?: FeedbackItem['type'];
    status?: FeedbackItem['status'];
    priority?: FeedbackItem['priority'];
  }): FeedbackItem[] {
    let filtered = [...this.feedback];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(f => f.type === filter.type);
      }
      if (filter.status) {
        filtered = filtered.filter(f => f.status === filter.status);
      }
      if (filter.priority) {
        filtered = filtered.filter(f => f.priority === filter.priority);
      }
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get support tickets
   */
  getSupportTickets(filter?: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
  }): SupportTicket[] {
    let filtered = [...this.supportTickets];

    if (filter) {
      if (filter.status) {
        filtered = filtered.filter(t => t.status === filter.status);
      }
      if (filter.priority) {
        filtered = filtered.filter(t => t.priority === filter.priority);
      }
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update feedback status (simulate response from support)
   */
  async updateFeedbackStatus(feedbackId: string, status: FeedbackItem['status'], responseMessage?: string): Promise<boolean> {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (!feedback) return false;

    feedback.status = status;
    feedback.updatedAt = new Date();
    
    if (responseMessage) {
      feedback.responseReceived = true;
      feedback.responseDate = new Date();
      feedback.responseMessage = responseMessage;
    }

    await this.saveFeedback();
    this.notifyListeners();
    return true;
  }

  /**
   * Rate feedback response satisfaction
   */
  async rateFeedbackSatisfaction(feedbackId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
    const feedback = this.feedback.find(f => f.id === feedbackId);
    if (!feedback) return false;

    feedback.satisfaction = rating;
    feedback.updatedAt = new Date();
    
    await this.saveFeedback();
    this.notifyListeners();
    return true;
  }

  /**
   * Get feedback analytics
   */
  getAnalytics(): FeedbackAnalytics {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentFeedback = this.feedback.filter(f => f.createdAt >= thirtyDaysAgo);
    
    // Calculate average response time
    const respondedFeedback = this.feedback.filter(f => f.responseReceived && f.responseDate);
    const avgResponseTime = respondedFeedback.reduce((sum, f) => {
      const responseTime = f.responseDate!.getTime() - f.createdAt.getTime();
      return sum + (responseTime / (1000 * 60 * 60)); // Convert to hours
    }, 0) / (respondedFeedback.length || 1);

    // Calculate satisfaction score
    const ratedFeedback = this.feedback.filter(f => f.satisfaction);
    const avgSatisfaction = ratedFeedback.reduce((sum, f) => sum + f.satisfaction!, 0) / (ratedFeedback.length || 1);

    // Top categories
    const categoryCount: Record<string, number> = {};
    recentFeedback.forEach(f => {
      categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trend data (last 30 days)
    const trendData: Array<{ date: string; count: number; type: string }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayFeedback = this.feedback.filter(f => 
        f.createdAt.toISOString().split('T')[0] === dateStr
      );
      
      ['bug', 'feature', 'improvement'].forEach(type => {
        const count = dayFeedback.filter(f => f.type === type).length;
        trendData.push({ date: dateStr, count, type });
      });
    }

    return {
      totalFeedback: this.feedback.length,
      bugReports: this.feedback.filter(f => f.type === 'bug').length,
      featureRequests: this.feedback.filter(f => f.type === 'feature').length,
      averageResponseTime: avgResponseTime,
      satisfactionScore: avgSatisfaction,
      topCategories,
      trendData,
    };
  }

  /**
   * Update service settings
   */
  async updateSettings(settings: Partial<typeof this.settings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Export feedback data for backup or analysis
   */
  async exportFeedbackData(): Promise<string> {
    const data = {
      feedback: this.feedback,
      supportTickets: this.supportTickets,
      analytics: this.getAnalytics(),
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Private methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private async getAppVersion(): Promise<string> {
    // In a real app, this would get the version from the app bundle
    return '1.0.0';
  }

  private async getDeviceInfo() {
    // In a real app, this would get actual device info
    return {
      platform: 'ios', // or 'android'
      osVersion: '17.0',
      deviceModel: 'iPhone 15',
      screenDimensions: { width: 375, height: 812 },
    };
  }

  private formatFeedbackEmail(feedback: FeedbackItem): string {
    return `
      <html>
        <body>
          <h2>Feedback Report</h2>
          <p><strong>Type:</strong> ${feedback.type.toUpperCase()}</p>
          <p><strong>Title:</strong> ${feedback.title}</p>
          <p><strong>Priority:</strong> ${feedback.priority}</p>
          <p><strong>Category:</strong> ${feedback.category}</p>
          
          <h3>Description</h3>
          <p>${feedback.description.replace(/\n/g, '<br>')}</p>
          
          ${feedback.reproductionSteps ? `
            <h3>Reproduction Steps</h3>
            <ol>
              ${feedback.reproductionSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          ` : ''}
          
          ${feedback.expectedBehavior ? `
            <h3>Expected Behavior</h3>
            <p>${feedback.expectedBehavior}</p>
          ` : ''}
          
          ${feedback.actualBehavior ? `
            <h3>Actual Behavior</h3>
            <p>${feedback.actualBehavior}</p>
          ` : ''}
          
          <h3>Technical Information</h3>
          <p><strong>App Version:</strong> ${feedback.appVersion}</p>
          <p><strong>Device:</strong> ${feedback.deviceInfo.deviceModel}</p>
          <p><strong>OS:</strong> ${feedback.deviceInfo.platform} ${feedback.deviceInfo.osVersion}</p>
          <p><strong>Screen:</strong> ${feedback.deviceInfo.screenDimensions.width}x${feedback.deviceInfo.screenDimensions.height}</p>
          
          ${feedback.screenName ? `<p><strong>Screen:</strong> ${feedback.screenName}</p>` : ''}
          
          ${feedback.userActions?.length ? `
            <h3>User Actions</h3>
            <ul>
              ${feedback.userActions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          ` : ''}
          
          ${feedback.errorLogs?.length ? `
            <h3>Error Logs</h3>
            <pre>${feedback.errorLogs.join('\n')}</pre>
          ` : ''}
          
          <p><strong>Submitted:</strong> ${feedback.createdAt.toLocaleString()}</p>
        </body>
      </html>
    `;
  }

  private formatFeedbackText(feedback: FeedbackItem): string {
    let text = `FEEDBACK REPORT\n\n`;
    text += `Type: ${feedback.type.toUpperCase()}\n`;
    text += `Title: ${feedback.title}\n`;
    text += `Priority: ${feedback.priority}\n`;
    text += `Category: ${feedback.category}\n\n`;
    text += `Description:\n${feedback.description}\n\n`;
    
    if (feedback.reproductionSteps?.length) {
      text += `Reproduction Steps:\n`;
      feedback.reproductionSteps.forEach((step, i) => {
        text += `${i + 1}. ${step}\n`;
      });
      text += '\n';
    }
    
    text += `Technical Info:\n`;
    text += `App Version: ${feedback.appVersion}\n`;
    text += `Device: ${feedback.deviceInfo.deviceModel}\n`;
    text += `OS: ${feedback.deviceInfo.platform} ${feedback.deviceInfo.osVersion}\n`;
    text += `Submitted: ${feedback.createdAt.toLocaleString()}\n`;
    
    return text;
  }

  private async loadFeedback(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(UserFeedbackService.FEEDBACK_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.feedback = parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
          responseDate: f.responseDate ? new Date(f.responseDate) : undefined,
        }));
      }
    } catch (error) {
      console.warn('Failed to load feedback:', error);
    }
  }

  private async saveFeedback(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        UserFeedbackService.FEEDBACK_KEY,
        JSON.stringify(this.feedback)
      );
    } catch (error) {
      console.warn('Failed to save feedback:', error);
    }
  }

  private async loadSupportTickets(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(UserFeedbackService.SUPPORT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.supportTickets = parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          estimatedResolution: t.estimatedResolution ? new Date(t.estimatedResolution) : undefined,
          actualResolution: t.actualResolution ? new Date(t.actualResolution) : undefined,
          messages: t.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
      }
    } catch (error) {
      console.warn('Failed to load support tickets:', error);
    }
  }

  private async saveSupportTickets(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        UserFeedbackService.SUPPORT_KEY,
        JSON.stringify(this.supportTickets)
      );
    } catch (error) {
      console.warn('Failed to save support tickets:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(UserFeedbackService.SETTINGS_KEY);
      if (data) {
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        UserFeedbackService.SETTINGS_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
}

// Singleton instance
export const userFeedbackService = new UserFeedbackService();