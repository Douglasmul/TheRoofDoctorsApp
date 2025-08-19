import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How accurate are AR roof measurements?',
    answer: 'Our AR measurement technology provides accuracy within 2-3% when used properly. For best results, ensure good lighting, stable device positioning, and walk around the entire roof perimeter.',
    category: 'Measurement',
  },
  {
    id: '2',
    question: 'Can I edit measurements after they are taken?',
    answer: 'Yes, you can manually adjust measurement points and roof boundaries in the measurement review screen. This allows you to correct any inaccuracies or add details missed during the AR capture.',
    category: 'Measurement',
  },
  {
    id: '3',
    question: 'How do I transfer measurements to a quote?',
    answer: 'After reviewing your measurement, tap "Save to Quote" to automatically generate a quote with calculated materials and labor estimates. You can then customize pricing and add additional services.',
    category: 'Quotes',
  },
  {
    id: '4',
    question: 'Can I export quotes in different formats?',
    answer: 'Yes, quotes can be exported as PDF for professional presentation, CSV for data analysis, or shared via email directly to customers. All exports include your company branding.',
    category: 'Quotes',
  },
  {
    id: '5',
    question: 'How do I reset my password?',
    answer: 'Go to Settings > Account > Change Password, or use the "Forgot Password" link on the login screen. You\'ll receive a reset link via email.',
    category: 'Account',
  },
  {
    id: '6',
    question: 'What device permissions does the app need?',
    answer: 'The app requires camera access for AR measurements, location services for project geo-tagging, and storage access for saving measurements and quotes.',
    category: 'Technical',
  },
  {
    id: '7',
    question: 'How is my data secured?',
    answer: 'All measurement and customer data is encrypted during transmission and storage. We follow enterprise security standards and never share your data with third parties.',
    category: 'Security',
  },
  {
    id: '8',
    question: 'Can I work offline?',
    answer: 'Basic measurement and quote functionality works offline. Data will sync when you reconnect to the internet. However, cloud features like backup and sharing require an internet connection.',
    category: 'Technical',
  },
];

const HELP_CATEGORIES = [
  'All',
  'Measurement',
  'Quotes',
  'Account',
  'Technical',
  'Security',
];

export default function HelpScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQ = selectedCategory === 'All' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === selectedCategory);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (expandedItems.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${COMPANY_INFO.legal.supportEmail}?subject=Support Request - The Roof Doctors App`);
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${COMPANY_INFO.legal.phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionText}>Email Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleCallSupport}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Call Support</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HELP_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {filteredFAQ.map(item => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.faqItem}
              onPress={() => toggleExpanded(item.id)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqToggle}>{isExpanded ? '−' : '+'}</Text>
              </View>
              
              {isExpanded && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Additional Resources */}
      <View style={styles.resourcesSection}>
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        
        <TouchableOpacity 
          style={styles.resourceItem}
          onPress={() => navigation.navigate('Legal' as never)}
        >
          <Text style={styles.resourceTitle}>Terms & Privacy</Text>
          <Text style={styles.resourceDescription}>View our terms of service and privacy policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceTitle}>User Manual</Text>
          <Text style={styles.resourceDescription}>Comprehensive guide to using the app</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceTitle}>Video Tutorials</Text>
          <Text style={styles.resourceDescription}>Step-by-step video guides</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Information */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.contactItem}>📧 {COMPANY_INFO.legal.supportEmail}</Text>
        <Text style={styles.contactItem}>📞 {COMPANY_INFO.legal.phone}</Text>
        <Text style={styles.contactItem}>
          🏢 {COMPANY_INFO.legal.address.street}, {COMPANY_INFO.legal.address.city}, {COMPANY_INFO.legal.address.state} {COMPANY_INFO.legal.address.zipCode}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    backgroundColor: '#234e70',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#234e70',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  faqSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  resourcesSection: {
    margin: 16,
  },
  resourceItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactSection: {
    margin: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  backButton: {
    margin: 16,
    backgroundColor: '#234e70',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});