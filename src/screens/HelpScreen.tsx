import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Linking,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * FAQ item interface for help content management
 */
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popularity: number;
  lastUpdated: Date;
  helpful: number;
  notHelpful: number;
}

/**
 * Help article interface for detailed documentation
 */
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  views: number;
  rating: number;
  estimatedReadTime: number; // in minutes
}

/**
 * Support contact information interface
 */
interface SupportContact {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  availability: string;
  languages: string[];
  specialties: string[];
}

/**
 * Feedback interface for user suggestions
 */
interface UserFeedback {
  id: string;
  type: 'bug' | 'feature' | 'general' | 'urgent';
  subject: string;
  description: string;
  userId: string;
  userEmail: string;
  attachments?: string[];
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Help categories and their content
 */
const HELP_CATEGORIES = [
  {
    id: 'getting_started',
    name: 'Getting Started',
    icon: '🚀',
    description: 'Basic setup and first steps',
  },
  {
    id: 'quotes',
    name: 'Quotes & Pricing',
    icon: '💰',
    description: 'Understanding quotes and pricing',
  },
  {
    id: 'projects',
    name: 'Project Management',
    icon: '📋',
    description: 'Managing your roofing projects',
  },
  {
    id: 'account',
    name: 'Account & Billing',
    icon: '👤',
    description: 'Account settings and billing',
  },
  {
    id: 'technical',
    name: 'Technical Support',
    icon: '🔧',
    description: 'Technical issues and troubleshooting',
  },
  {
    id: 'safety',
    name: 'Safety & Compliance',
    icon: '⚠️',
    description: 'Safety guidelines and regulations',
  },
];

/**
 * Mock FAQ data
 */
const MOCK_FAQS: FAQItem[] = [
  {
    id: 'faq_001',
    question: 'How do I request a roof inspection quote?',
    answer: 'To request a quote, navigate to the "Get Quote" section in the app, fill out the property details form, and upload photos of your roof. Our certified contractors will review your request and provide a detailed quote within 24 hours.',
    category: 'quotes',
    tags: ['quote', 'inspection', 'pricing'],
    popularity: 95,
    lastUpdated: new Date('2024-01-15'),
    helpful: 127,
    notHelpful: 8,
  },
  {
    id: 'faq_002',
    question: 'What information do I need to provide for an accurate quote?',
    answer: 'For the most accurate quote, please provide: property address, roof type and age, square footage if known, photos of your roof from multiple angles, description of any visible damage or concerns, and preferred timeline for the work.',
    category: 'quotes',
    tags: ['quote', 'requirements', 'accuracy'],
    popularity: 89,
    lastUpdated: new Date('2024-01-10'),
    helpful: 98,
    notHelpful: 12,
  },
  {
    id: 'faq_003',
    question: 'How can I track the progress of my roofing project?',
    answer: 'You can track your project progress in the "My Projects" section. This shows real-time updates, photos from work sites, milestone completions, and direct communication with your assigned contractor team.',
    category: 'projects',
    tags: ['tracking', 'progress', 'updates'],
    popularity: 76,
    lastUpdated: new Date('2024-01-08'),
    helpful: 84,
    notHelpful: 6,
  },
  {
    id: 'faq_004',
    question: 'What safety measures do your contractors follow?',
    answer: 'All our contractors are licensed, insured, and follow OSHA safety guidelines. They use proper safety equipment, conduct safety briefings before each job, and maintain clean work sites. We also perform regular safety audits.',
    category: 'safety',
    tags: ['safety', 'OSHA', 'insurance', 'contractors'],
    popularity: 82,
    lastUpdated: new Date('2024-01-12'),
    helpful: 76,
    notHelpful: 4,
  },
  {
    id: 'faq_005',
    question: 'How do I update my account information?',
    answer: 'Go to the Profile section and tap "Edit" to update your personal information, contact details, and preferences. Changes are saved automatically and will be reflected across all your active projects.',
    category: 'account',
    tags: ['profile', 'account', 'settings'],
    popularity: 68,
    lastUpdated: new Date('2024-01-05'),
    helpful: 52,
    notHelpful: 3,
  },
];

/**
 * Mock support contacts
 */
const SUPPORT_CONTACTS: SupportContact[] = [
  {
    id: 'support_001',
    name: 'Sarah Johnson',
    role: 'Customer Success Manager',
    department: 'Customer Support',
    email: 'sarah.johnson@roofdoctors.com',
    phone: '+1 (555) 123-4567',
    availability: 'Mon-Fri 8AM-6PM EST',
    languages: ['English', 'Spanish'],
    specialties: ['Account Issues', 'Billing', 'General Support'],
  },
  {
    id: 'support_002',
    name: 'Mike Wilson',
    role: 'Technical Support Lead',
    department: 'Technical Support',
    email: 'mike.wilson@roofdoctors.com',
    phone: '+1 (555) 123-4568',
    availability: 'Mon-Fri 9AM-5PM EST',
    languages: ['English'],
    specialties: ['App Issues', 'Technical Problems', 'Integration Support'],
  },
  {
    id: 'support_003',
    name: 'Emergency Support',
    role: 'Emergency Response Team',
    department: 'Emergency Services',
    phone: '+1 (555) 999-ROOF',
    availability: '24/7 Emergency Line',
    languages: ['English', 'Spanish'],
    specialties: ['Emergency Repairs', 'Storm Damage', 'Urgent Issues'],
  },
];

/**
 * Enterprise-grade Help Screen Component
 * 
 * Provides comprehensive customer support and self-service functionality including:
 * - Searchable FAQ database with categorization
 * - Detailed help articles and documentation
 * - Multiple support contact methods
 * - In-app feedback and ticket system
 * - Live chat integration placeholder
 * - Video tutorials and resources
 * - Community forums access
 * - Multilingual support capabilities
 * - Accessibility-optimized help content
 * 
 * @component
 * @example
 * ```tsx
 * <HelpScreen />
 * ```
 * 
 * @author The Roof Doctors Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export default function HelpScreen(): JSX.Element {
  const navigation = useNavigation();
  
  // State management
  const [faqs, setFaqs] = useState<FAQItem[]>(MOCK_FAQS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'general' as UserFeedback['type'],
    subject: '',
    description: '',
    userEmail: '',
  });

  /**
   * Filter FAQs based on search and category
   */
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort by popularity
    return filtered.sort((a, b) => b.popularity - a.popularity);
  }, [faqs, searchQuery, selectedCategory]);

  /**
   * Handle FAQ helpful rating
   * TODO: Integrate with analytics service
   */
  const rateFAQ = useCallback(async (faqId: string, helpful: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await helpService.rateFAQ(faqId, helpful);
      
      setFaqs(prev => 
        prev.map(faq =>
          faq.id === faqId
            ? {
                ...faq,
                helpful: helpful ? faq.helpful + 1 : faq.helpful,
                notHelpful: !helpful ? faq.notHelpful + 1 : faq.notHelpful,
              }
            : faq
        )
      );
      
      AccessibilityInfo.announceForAccessibility(
        helpful ? 'Marked as helpful' : 'Marked as not helpful'
      );
      
    } catch (error) {
      console.error('Failed to rate FAQ:', error);
    }
  }, []);

  /**
   * Handle contact method selection
   */
  const contactSupport = useCallback(async (contact: SupportContact, method: 'email' | 'phone') => {
    try {
      if (method === 'email' && contact.email) {
        const subject = encodeURIComponent('Support Request - The Roof Doctors App');
        const body = encodeURIComponent(`Hello ${contact.name},\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you,`);
        const url = `mailto:${contact.email}?subject=${subject}&body=${body}`;
        
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Email Not Available', `Please contact ${contact.name} at ${contact.email}`);
        }
      } else if (method === 'phone' && contact.phone) {
        const url = `tel:${contact.phone}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Phone Not Available', `Please call ${contact.name} at ${contact.phone}`);
        }
      }
      
      setShowContactModal(false);
    } catch (error) {
      console.error('Failed to open contact method:', error);
      Alert.alert('Error', 'Unable to open contact method');
    }
  }, []);

  /**
   * Submit feedback
   * TODO: Integrate with feedback service
   */
  const submitFeedback = useCallback(async () => {
    try {
      if (!feedbackForm.subject.trim() || !feedbackForm.description.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      setLoading(true);
      
      // TODO: Replace with actual API call
      // await feedbackService.submitFeedback(feedbackForm);
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. We will review it and get back to you if needed.',
        [{ text: 'OK', onPress: () => setShowFeedbackModal(false) }]
      );
      
      // Reset form
      setFeedbackForm({
        type: 'general',
        subject: '',
        description: '',
        userEmail: '',
      });
      
      AccessibilityInfo.announceForAccessibility('Feedback submitted successfully');
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [feedbackForm]);

  /**
   * Open external resources
   */
  const openExternalResource = useCallback(async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Link Not Available', `Unable to open ${title}`);
      }
    } catch (error) {
      console.error('Failed to open external resource:', error);
      Alert.alert('Error', 'Unable to open resource');
    }
  }, []);

  /**
   * Render FAQ item
   */
  const renderFAQItem = useCallback(({ item }: { item: FAQItem }) => {
    const isExpanded = expandedFAQ === item.id;
    
    return (
      <View style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => setExpandedFAQ(isExpanded ? null : item.id)}
          accessibilityLabel={`FAQ: ${item.question}`}
          accessibilityHint={isExpanded ? 'Tap to collapse answer' : 'Tap to expand answer'}
          accessibilityRole="button"
        >
          <Text style={styles.faqQuestionText}>{item.question}</Text>
          <Text style={styles.faqExpandIcon}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{item.answer}</Text>
            
            <View style={styles.faqActions}>
              <Text style={styles.faqHelpfulText}>Was this helpful?</Text>
              <TouchableOpacity
                style={styles.faqActionButton}
                onPress={() => rateFAQ(item.id, true)}
                accessibilityLabel="Mark as helpful"
              >
                <Text style={styles.faqActionButtonText}>👍 Yes ({item.helpful})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.faqActionButton}
                onPress={() => rateFAQ(item.id, false)}
                accessibilityLabel="Mark as not helpful"
              >
                <Text style={styles.faqActionButtonText}>👎 No ({item.notHelpful})</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.faqMeta}>
              <Text style={styles.faqMetaText}>
                Category: {HELP_CATEGORIES.find(c => c.id === item.category)?.name}
              </Text>
              <Text style={styles.faqMetaText}>
                Updated: {item.lastUpdated.toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }, [expandedFAQ, rateFAQ]);

  /**
   * Render support contact
   */
  const renderSupportContact = useCallback(({ item }: { item: SupportContact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactRole}>{item.role}</Text>
        <Text style={styles.contactAvailability}>{item.availability}</Text>
        <Text style={styles.contactSpecialties}>
          Specialties: {item.specialties.join(', ')}
        </Text>
      </View>
      
      <View style={styles.contactActions}>
        {item.email && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => contactSupport(item, 'email')}
            accessibilityLabel={`Email ${item.name}`}
          >
            <Text style={styles.contactButtonText}>Email</Text>
          </TouchableOpacity>
        )}
        {item.phone && (
          <TouchableOpacity
            style={[styles.contactButton, styles.phoneButton]}
            onPress={() => contactSupport(item, 'phone')}
            accessibilityLabel={`Call ${item.name}`}
          >
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [contactSupport]);

  return (
    <ScrollView 
      style={styles.container}
      accessibilityLabel="Help and support screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={styles.headerTitle}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Help & Support
        </Text>
        <Text style={styles.headerSubtitle}>
          Find answers to common questions or contact our support team
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowContactModal(true)}
          accessibilityLabel="Contact support team"
        >
          <Text style={styles.quickActionIcon}>📞</Text>
          <Text style={styles.quickActionText}>Contact Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowFeedbackModal(true)}
          accessibilityLabel="Send feedback"
        >
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>Send Feedback</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => openExternalResource('https://roofdoctors.com/tutorials', 'Video Tutorials')}
          accessibilityLabel="Watch video tutorials"
        >
          <Text style={styles.quickActionIcon}>🎥</Text>
          <Text style={styles.quickActionText}>Video Tutorials</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search help articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search help articles"
          accessibilityHint="Type to search FAQ and help content"
        />
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        style={styles.categoryFilter}
        showsHorizontalScrollIndicator={false}
        accessibilityLabel="Help categories"
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.activeCategoryChip
          ]}
          onPress={() => setSelectedCategory('all')}
          accessibilityLabel="Show all categories"
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.activeCategoryChipText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {HELP_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityLabel={`Show ${category.name} help`}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.activeCategoryChipText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Frequently Asked Questions
          {filteredFAQs.length > 0 && ` (${filteredFAQs.length})`}
        </Text>
        
        {filteredFAQs.length > 0 ? (
          <FlatList
            data={filteredFAQs}
            keyExtractor={(item) => item.id}
            renderItem={renderFAQItem}
            scrollEnabled={false}
            contentContainerStyle={styles.faqList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No results found for your search' : 'No FAQs available'}
            </Text>
          </View>
        )}
      </View>

      {/* Additional Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        
        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => openExternalResource('https://roofdoctors.com/knowledge-base', 'Knowledge Base')}
          accessibilityLabel="Open knowledge base"
        >
          <Text style={styles.resourceIcon}>📚</Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Knowledge Base</Text>
            <Text style={styles.resourceDescription}>
              Comprehensive documentation and guides
            </Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => openExternalResource('https://community.roofdoctors.com', 'Community Forum')}
          accessibilityLabel="Open community forum"
        >
          <Text style={styles.resourceIcon}>👥</Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Community Forum</Text>
            <Text style={styles.resourceDescription}>
              Connect with other users and experts
            </Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resourceItem}
          onPress={() => openExternalResource('https://roofdoctors.com/safety', 'Safety Guidelines')}
          accessibilityLabel="Open safety guidelines"
        >
          <Text style={styles.resourceIcon}>⚠️</Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>Safety Guidelines</Text>
            <Text style={styles.resourceDescription}>
              Important safety information and best practices
            </Text>
          </View>
          <Text style={styles.resourceChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityHint="Return to previous screen"
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            
            <FlatList
              data={SUPPORT_CONTACTS}
              keyExtractor={(item) => item.id}
              renderItem={renderSupportContact}
              style={styles.contactsList}
            />
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowContactModal(false)}
              accessibilityLabel="Close contact modal"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            
            <View style={styles.feedbackForm}>
              <Text style={styles.inputLabel}>Feedback Type</Text>
              <ScrollView horizontal style={styles.feedbackTypeContainer}>
                {[
                  { value: 'general', label: 'General' },
                  { value: 'bug', label: 'Bug Report' },
                  { value: 'feature', label: 'Feature Request' },
                  { value: 'urgent', label: 'Urgent Issue' },
                ].map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.feedbackTypeChip,
                      feedbackForm.type === type.value && styles.activeFeedbackType
                    ]}
                    onPress={() => setFeedbackForm({ ...feedbackForm, type: type.value as any })}
                    accessibilityLabel={`Select ${type.label} feedback type`}
                  >
                    <Text style={[
                      styles.feedbackTypeText,
                      feedbackForm.type === type.value && styles.activeFeedbackTypeText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Brief description of your feedback"
                value={feedbackForm.subject}
                onChangeText={(text) => setFeedbackForm({ ...feedbackForm, subject: text })}
                accessibilityLabel="Feedback subject"
              />
              
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.feedbackInput, styles.feedbackTextArea]}
                placeholder="Detailed description of your feedback"
                value={feedbackForm.description}
                onChangeText={(text) => setFeedbackForm({ ...feedbackForm, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Feedback description"
              />
              
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="your.email@example.com"
                value={feedbackForm.userEmail}
                onChangeText={(text) => setFeedbackForm({ ...feedbackForm, userEmail: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Your email address"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitFeedback}
                disabled={loading}
                accessibilityLabel="Submit feedback"
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFeedbackModal(false)}
                accessibilityLabel="Cancel feedback"
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6a737d',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#234e70',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryFilter: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d1d5da',
  },
  activeCategoryChip: {
    backgroundColor: '#0366d6',
    borderColor: '#0366d6',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#24292e',
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 16,
  },
  faqList: {
    paddingBottom: 16,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginRight: 12,
  },
  faqExpandIcon: {
    fontSize: 20,
    color: '#0366d6',
    fontWeight: 'bold',
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#586069',
    lineHeight: 20,
    marginBottom: 16,
  },
  faqActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqHelpfulText: {
    fontSize: 14,
    color: '#6a737d',
    marginRight: 12,
  },
  faqActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 16,
    marginRight: 8,
  },
  faqActionButtonText: {
    fontSize: 12,
    color: '#24292e',
  },
  faqMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  faqMetaText: {
    fontSize: 12,
    color: '#6a737d',
  },
  resourceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#586069',
  },
  resourceChevron: {
    fontSize: 20,
    color: '#6a737d',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6a737d',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6a737d',
    paddingVertical: 16,
    margin: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  contactItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    paddingVertical: 16,
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
  },
  contactRole: {
    fontSize: 14,
    color: '#0366d6',
    marginBottom: 4,
  },
  contactAvailability: {
    fontSize: 12,
    color: '#6a737d',
    marginBottom: 4,
  },
  contactSpecialties: {
    fontSize: 12,
    color: '#586069',
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  phoneButton: {
    backgroundColor: '#28a745',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 8,
    marginTop: 12,
  },
  feedbackTypeContainer: {
    marginBottom: 8,
  },
  feedbackTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d1d5da',
  },
  activeFeedbackType: {
    backgroundColor: '#0366d6',
    borderColor: '#0366d6',
  },
  feedbackTypeText: {
    fontSize: 14,
    color: '#24292e',
  },
  activeFeedbackTypeText: {
    color: '#ffffff',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  feedbackTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6a737d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});