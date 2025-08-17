/**
 * HelpScreen.tsx
 * 
 * Enterprise-ready user assistance and documentation with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - Searchable knowledge base
 * - FAQ sections with categories
 * - Video tutorials and guides
 * - Contact support options
 * - User manual and documentation
 * - Troubleshooting guides
 * 
 * TODO: Integrate with help desk system
 * TODO: Add video player component
 * TODO: Connect to knowledge base API
 * TODO: Implement search functionality
 * TODO: Add user feedback on articles
 * TODO: Add live chat integration
 * TODO: Implement article rating system
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for help system
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  lastUpdated: string;
  helpfulCount: number;
  views: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

interface SupportContact {
  type: 'phone' | 'email' | 'chat' | 'ticket';
  label: string;
  value: string;
  availability: string;
  icon: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articleCount: number;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
}

interface HelpSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface SearchResultProps {
  article: HelpArticle;
  searchTerm: string;
  onPress: () => void;
}

// Demo help data - Replace with actual help content from CMS/API
const DEMO_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'Basic setup and first steps',
    articleCount: 12,
  },
  {
    id: 'roof-measurement',
    name: 'Roof Measurement',
    icon: '📏',
    description: 'How to measure roofs accurately',
    articleCount: 8,
  },
  {
    id: 'project-management',
    name: 'Project Management',
    icon: '📋',
    description: 'Managing your roofing projects',
    articleCount: 15,
  },
  {
    id: 'reports-analytics',
    name: 'Reports & Analytics',
    icon: '📊',
    description: 'Understanding your data',
    articleCount: 6,
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: '🔧',
    description: 'Common issues and solutions',
    articleCount: 10,
  },
  {
    id: 'account-billing',
    name: 'Account & Billing',
    icon: '💳',
    description: 'Account management and payments',
    articleCount: 7,
  },
];

const DEMO_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I take accurate roof measurements?',
    answer: 'To take accurate measurements, ensure your device camera is calibrated, hold it steady, and follow the on-screen guides. Use the grid overlay and take multiple shots from different angles for best results.',
    category: 'roof-measurement',
    popularity: 95,
  },
  {
    id: '2',
    question: 'Can I use the app offline?',
    answer: 'Yes, many features work offline including measurement tools and project data viewing. However, you\'ll need an internet connection to sync data, generate reports, and access cloud features.',
    category: 'getting-started',
    popularity: 87,
  },
  {
    id: '3',
    question: 'How do I export my project data?',
    answer: 'Go to the Reports screen, select the data you want to export, choose your format (PDF, Excel, or CSV), and tap Export. The file will be emailed to your registered email address.',
    category: 'reports-analytics',
    popularity: 76,
  },
  {
    id: '4',
    question: 'What should I do if the app crashes?',
    answer: 'First, try restarting the app. If the problem persists, check for updates in your app store. You can also clear the app cache in settings or contact support with crash details.',
    category: 'troubleshooting',
    popularity: 83,
  },
];

const DEMO_SUPPORT_CONTACTS: SupportContact[] = [
  {
    type: 'phone',
    label: 'Call Support',
    value: '+1 (800) ROOF-DOC',
    availability: 'Mon-Fri 8AM-6PM EST',
    icon: '📞',
  },
  {
    type: 'email',
    label: 'Email Support',
    value: 'support@theroofdoctors.com',
    availability: '24/7 - Response within 24 hours',
    icon: '📧',
  },
  {
    type: 'chat',
    label: 'Live Chat',
    value: 'chat',
    availability: 'Mon-Fri 9AM-5PM EST',
    icon: '💬',
  },
  {
    type: 'ticket',
    label: 'Submit Ticket',
    value: 'ticket',
    availability: '24/7 - Track your request',
    icon: '🎫',
  },
];

const DEMO_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Roof Measurement',
    content: 'Learn the basics of using our roof measurement tools...',
    category: 'getting-started',
    tags: ['measurement', 'basics', 'tutorial'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    lastUpdated: '2024-01-10',
    helpfulCount: 42,
    views: 156,
  },
  {
    id: '2',
    title: 'Advanced Camera Calibration Techniques',
    content: 'Professional tips for achieving the most accurate measurements...',
    category: 'roof-measurement',
    tags: ['calibration', 'accuracy', 'professional'],
    difficulty: 'advanced',
    estimatedReadTime: 8,
    lastUpdated: '2024-01-08',
    helpfulCount: 23,
    views: 89,
  },
];

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

/**
 * Quick action button component
 */
const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onPress,
  variant = 'primary',
  accessibilityLabel,
}) => (
  <TouchableOpacity
    style={[
      styles.quickAction,
      variant === 'secondary' && styles.quickActionSecondary,
    ]}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || title}
    accessibilityHint={description}
  >
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={styles.quickActionTitle}>{title}</Text>
    <Text style={styles.quickActionDescription}>{description}</Text>
  </TouchableOpacity>
);

/**
 * Help section component
 */
const HelpSection: React.FC<HelpSectionProps> = ({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  }, [collapsible, isExpanded]);

  return (
    <View style={styles.helpSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleExpanded}
        disabled={!collapsible}
        accessible={true}
        accessibilityRole={collapsible ? "button" : "text"}
        accessibilityLabel={title}
        accessibilityHint={collapsible ? `${isExpanded ? 'Collapse' : 'Expand'} section` : undefined}
      >
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          )}
        </View>
        {collapsible && (
          <Text style={styles.sectionToggle}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

/**
 * Search result item component
 */
const SearchResult: React.FC<SearchResultProps> = ({
  article,
  searchTerm,
  onPress,
}) => {
  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    // Simple highlighting - in production, use proper text highlighting
    return text;
  };

  return (
    <TouchableOpacity
      style={styles.searchResult}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${article.title} - ${article.difficulty} level, ${article.estimatedReadTime} minute read`}
    >
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultTitle}>
          {highlightText(article.title, searchTerm)}
        </Text>
        <Text style={styles.searchResultMeta}>
          {article.category} • {article.difficulty} • {article.estimatedReadTime} min read
        </Text>
        <Text style={styles.searchResultSnippet} numberOfLines={2}>
          {article.content}
        </Text>
      </View>
      <View style={styles.searchResultStats}>
        <Text style={styles.searchResultViews}>👁 {article.views}</Text>
        <Text style={styles.searchResultHelpful}>👍 {article.helpfulCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Main HelpScreen component
 */
export default function HelpScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual help context/Redux
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // Search functionality
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      // TODO: Implement actual search API call
      setTimeout(() => {
        const filtered = DEMO_ARTICLES.filter(article =>
          article.title.toLowerCase().includes(term.toLowerCase()) ||
          article.content.toLowerCase().includes(term.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  // Category navigation
  const handleCategoryPress = useCallback((category: HelpCategory) => {
    setSelectedCategory(category.id);
    // TODO: Navigate to category articles or filter current view
    Alert.alert('Category Selected', `Showing articles for ${category.name}`);
  }, []);

  // FAQ management
  const toggleFAQ = useCallback((faqId: string) => {
    setExpandedFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  }, []);

  // Support contact handlers
  const handleSupportContact = useCallback((contact: SupportContact) => {
    switch (contact.type) {
      case 'phone':
        Linking.openURL(`tel:${contact.value.replace(/[^\d]/g, '')}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${contact.value}?subject=Support Request`);
        break;
      case 'chat':
        // TODO: Open live chat widget
        Alert.alert('Live Chat', 'Opening live chat...');
        break;
      case 'ticket':
        // TODO: Navigate to support ticket form
        Alert.alert('Support Ticket', 'Opening support ticket form...');
        break;
    }
  }, []);

  // Article handlers
  const handleArticlePress = useCallback((article: HelpArticle) => {
    // TODO: Navigate to article detail view
    Alert.alert('Article', `Opening "${article.title}"`);
  }, []);

  const handleVideoTutorial = useCallback(() => {
    // TODO: Navigate to video tutorials
    Alert.alert('Video Tutorials', 'Opening video tutorial library');
  }, []);

  const handleUserManual = useCallback(() => {
    // TODO: Open PDF user manual
    Alert.alert('User Manual', 'Opening comprehensive user manual');
  }, []);

  const handleFeedback = useCallback(() => {
    // TODO: Open feedback form
    Alert.alert('Feedback', 'We value your feedback! Opening feedback form...');
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Help and support screen"
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={handleSearch}
            accessible={true}
            accessibilityLabel="Search help articles"
            accessibilityHint="Type to search through help documentation"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <HelpSection title={`Search Results (${searchResults.length})`}>
          {searchResults.map((article) => (
            <SearchResult
              key={article.id}
              article={article}
              searchTerm={searchTerm}
              onPress={() => handleArticlePress(article)}
            />
          ))}
        </HelpSection>
      )}

      {/* Quick Actions */}
      {searchResults.length === 0 && (
        <HelpSection title="Quick Help" subtitle="Get help fast with these options">
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Video Tutorials"
              description="Watch step-by-step guides"
              icon="🎥"
              onPress={handleVideoTutorial}
            />
            <QuickAction
              title="User Manual"
              description="Complete documentation"
              icon="📖"
              onPress={handleUserManual}
            />
            <QuickAction
              title="Contact Support"
              description="Get personalized help"
              icon="🤝"
              onPress={() => handleSupportContact(DEMO_SUPPORT_CONTACTS[1])}
            />
            <QuickAction
              title="Send Feedback"
              description="Help us improve"
              icon="💬"
              onPress={handleFeedback}
              variant="secondary"
            />
          </View>
        </HelpSection>
      )}

      {/* Help Categories */}
      {searchResults.length === 0 && (
        <HelpSection title="Browse by Category" subtitle="Find articles organized by topic">
          <View style={styles.categoriesGrid}>
            {DEMO_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} category with ${category.articleCount} articles`}
                accessibilityHint={category.description}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <Text style={styles.categoryCount}>{category.articleCount} articles</Text>
              </TouchableOpacity>
            ))}
          </View>
        </HelpSection>
      )}

      {/* Frequently Asked Questions */}
      {searchResults.length === 0 && (
        <HelpSection title="Frequently Asked Questions" subtitle="Common questions and answers" collapsible>
          {DEMO_FAQS.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={faq.question}
                accessibilityHint={expandedFAQs.has(faq.id) ? 'Collapse answer' : 'Expand to see answer'}
                accessibilityState={{ expanded: expandedFAQs.has(faq.id) }}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedFAQs.has(faq.id) ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedFAQs.has(faq.id) && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  <View style={styles.faqMeta}>
                    <Text style={styles.faqPopularity}>
                      👍 {faq.popularity}% found this helpful
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </HelpSection>
      )}

      {/* Contact Support */}
      {searchResults.length === 0 && (
        <HelpSection title="Contact Support" subtitle="Multiple ways to get help">
          <View style={styles.supportContactsContainer}>
            {DEMO_SUPPORT_CONTACTS.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={styles.supportContact}
                onPress={() => handleSupportContact(contact)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${contact.label} - ${contact.availability}`}
                accessibilityHint={`Contact support via ${contact.type}`}
              >
                <Text style={styles.supportContactIcon}>{contact.icon}</Text>
                <View style={styles.supportContactInfo}>
                  <Text style={styles.supportContactLabel}>{contact.label}</Text>
                  <Text style={styles.supportContactValue}>{contact.value}</Text>
                  <Text style={styles.supportContactAvailability}>{contact.availability}</Text>
                </View>
                <Text style={styles.supportContactArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </HelpSection>
      )}

      {/* App Information */}
      {searchResults.length === 0 && (
        <HelpSection title="App Information" collapsible defaultExpanded={false}>
          <View style={styles.appInfo}>
            <Text style={styles.appInfoItem}>Version: 1.0.0 (Build 1)</Text>
            <Text style={styles.appInfoItem}>Last Updated: January 15, 2024</Text>
            <Text style={styles.appInfoItem}>Help Docs Version: 2024.1</Text>
            <TouchableOpacity 
              style={styles.appInfoButton}
              onPress={() => Alert.alert('App Info', 'Additional app information and diagnostics')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View detailed app information"
            >
              <Text style={styles.appInfoButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </HelpSection>
      )}
    </ScrollView>
  );
}

// Responsive and accessible styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  helpSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionToggle: {
    fontSize: 16,
    color: '#999',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingRight: 12,
    paddingBottom: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: isTablet ? 200 : 150,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Spacing between grid items is handled via margin on categoryCard
  },
  categoryCard: {
    flex: 1,
    minWidth: isTablet ? 200 : 150,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  categoryCount: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  searchResult: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  searchResultMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  searchResultSnippet: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchResultStats: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 12,
  },
  searchResultViews: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  searchResultHelpful: {
    fontSize: 11,
    color: '#999',
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    lineHeight: 22,
  },
  faqToggle: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingLeft: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  faqMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqPopularity: {
    fontSize: 12,
    color: '#4CAF50',
  },
  supportContactsContainer: {
    gap: 1,
  },
  supportContact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  supportContactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  supportContactInfo: {
    flex: 1,
  },
  supportContactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  supportContactValue: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  supportContactAvailability: {
    fontSize: 12,
    color: '#666',
  },
  supportContactArrow: {
    fontSize: 20,
    color: '#c0c0c0',
    marginLeft: 8,
  },
  appInfo: {
    gap: 8,
  },
  appInfoItem: {
    fontSize: 14,
    color: '#666',
    // gap: 8, // Removed unsupported property
  },
  appInfoItem: {
    fontSize: 14,
    lineHeight: 20,
    lineHeight: 20,
    marginBottom: 8,
    // gap: 8, // Removed unsupported property
  },
  appInfoButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  appInfoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});