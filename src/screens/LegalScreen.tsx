import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LEGAL_TEXT, COMPANY_INFO } from '../constants/company';

type LegalSection = 'overview' | 'terms' | 'privacy' | 'licenses';

export default function LegalScreen() {
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState<LegalSection>('overview');

  const handleExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  const renderOverview = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.contentTitle}>Legal Information</Text>
      <Text style={styles.contentText}>
        {COMPANY_INFO.name} is committed to protecting your privacy and ensuring transparency 
        in how we collect, use, and protect your data. This section contains our legal policies 
        and terms that govern your use of our application.
      </Text>
      
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setActiveSection('terms')}
        >
          <Text style={styles.linkButtonText}>View Terms of Service</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setActiveSection('privacy')}
        >
          <Text style={styles.linkButtonText}>View Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>Legal Contact</Text>
        <Text style={styles.contactText}>
          For legal inquiries: {COMPANY_INFO.legal.contactEmail}
        </Text>
        <Text style={styles.contactText}>
          {COMPANY_INFO.legal.address.street}
        </Text>
        <Text style={styles.contactText}>
          {COMPANY_INFO.legal.address.city}, {COMPANY_INFO.legal.address.state} {COMPANY_INFO.legal.address.zipCode}
        </Text>
      </View>
    </View>
  );

  const renderTerms = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.contentTitle}>Terms of Service</Text>
      <Text style={styles.lastUpdated}>Last updated: January 1, 2025</Text>
      
      <Text style={styles.sectionHeader}>1. Acceptance of Terms</Text>
      <Text style={styles.contentText}>
        By using {COMPANY_INFO.app.displayName}, you agree to be bound by these Terms of Service. 
        If you do not agree to these terms, please do not use our application.
      </Text>

      <Text style={styles.sectionHeader}>2. Service Description</Text>
      <Text style={styles.contentText}>
        {COMPANY_INFO.app.displayName} provides augmented reality roof measurement and 
        quoting services for roofing professionals. The app uses device cameras and sensors 
        to capture and calculate roof measurements.
      </Text>

      <Text style={styles.sectionHeader}>3. Data Usage</Text>
      <Text style={styles.contentText}>
        You retain ownership of all measurement data you create. We may use aggregated, 
        anonymized data to improve our services. All customer data is processed in accordance 
        with our Privacy Policy.
      </Text>

      <Text style={styles.sectionHeader}>4. Accuracy Disclaimer</Text>
      <Text style={styles.contentText}>
        While our AR measurement technology strives for accuracy, measurements should be 
        verified before final use. We recommend professional confirmation for critical measurements.
      </Text>

      <Text style={styles.sectionHeader}>5. Limitation of Liability</Text>
      <Text style={styles.contentText}>
        {COMPANY_INFO.name} is not liable for any damages arising from the use of measurement 
        data. Users are responsible for verifying all measurements and quotes.
      </Text>

      <TouchableOpacity
        style={styles.externalLink}
        onPress={() => handleExternalLink(COMPANY_INFO.legal.termsUrl)}
      >
        <Text style={styles.externalLinkText}>View Full Terms Online</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.contentTitle}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last updated: January 1, 2025</Text>
      
      <Text style={styles.sectionHeader}>Data We Collect</Text>
      <Text style={styles.contentText}>
        • Measurement data (roof dimensions, photos, AR tracking data)
        • Customer information (names, addresses, contact details)
        • Device information (camera access, location services)
        • Usage analytics (feature usage, app performance)
      </Text>

      <Text style={styles.sectionHeader}>How We Use Your Data</Text>
      <Text style={styles.contentText}>
        • To provide measurement and quoting services
        • To save and sync your project data
        • To improve app functionality and accuracy
        • To provide customer support
      </Text>

      <Text style={styles.sectionHeader}>Data Security</Text>
      <Text style={styles.contentText}>
        All data is encrypted in transit and at rest. We use industry-standard security 
        measures to protect your information. Data is stored on secure cloud servers 
        with regular backups.
      </Text>

      <Text style={styles.sectionHeader}>Data Sharing</Text>
      <Text style={styles.contentText}>
        We do not sell or share your personal data with third parties for marketing purposes. 
        Data may be shared only when required by law or with your explicit consent.
      </Text>

      <Text style={styles.sectionHeader}>Your Rights</Text>
      <Text style={styles.contentText}>
        • Access your data at any time
        • Request data deletion
        • Export your measurement data
        • Opt out of analytics collection
      </Text>

      <TouchableOpacity
        style={styles.externalLink}
        onPress={() => handleExternalLink(COMPANY_INFO.legal.privacyUrl)}
      >
        <Text style={styles.externalLinkText}>View Full Privacy Policy Online</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLicenses = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.contentTitle}>Third-Party Licenses</Text>
      
      <Text style={styles.sectionHeader}>Open Source Libraries</Text>
      <Text style={styles.contentText}>
        This application uses several open source libraries. Below are the key dependencies:
      </Text>

      <View style={styles.licenseItem}>
        <Text style={styles.licenseName}>React Native</Text>
        <Text style={styles.licenseDescription}>MIT License - Core framework</Text>
      </View>

      <View style={styles.licenseItem}>
        <Text style={styles.licenseName}>Expo SDK</Text>
        <Text style={styles.licenseDescription}>MIT License - Development platform</Text>
      </View>

      <View style={styles.licenseItem}>
        <Text style={styles.licenseName}>React Navigation</Text>
        <Text style={styles.licenseDescription}>MIT License - Navigation library</Text>
      </View>

      <Text style={styles.sectionHeader}>Proprietary Technology</Text>
      <Text style={styles.contentText}>
        AR measurement algorithms and roof calculation engines are proprietary to {COMPANY_INFO.name}.
      </Text>

      <Text style={styles.copyright}>{COMPANY_INFO.copyright}</Text>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'terms':
        return renderTerms();
      case 'privacy':
        return renderPrivacy();
      case 'licenses':
        return renderLicenses();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', title: 'Overview' },
            { key: 'terms', title: 'Terms' },
            { key: 'privacy', title: 'Privacy' },
            { key: 'licenses', title: 'Licenses' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeSection === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveSection(tab.key as LegalSection)}
            >
              <Text style={[
                styles.tabText,
                activeSection === tab.key && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        {renderContent()}
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#234e70',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#234e70',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  sectionContent: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6b7280',
    marginBottom: 12,
  },
  quickLinks: {
    marginVertical: 20,
    gap: 12,
  },
  linkButton: {
    backgroundColor: '#234e70',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  contactInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  externalLink: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  externalLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  licenseItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#234e70',
  },
  licenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  licenseDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  copyright: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
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