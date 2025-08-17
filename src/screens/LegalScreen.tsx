/**
 * LegalScreen.tsx
 * 
 * Enterprise-ready legal information and compliance with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - Terms of Service and Privacy Policy
 * - Software licenses and attributions
 * - Compliance and regulatory information
 * - Cookie and data processing policies
 * - User consent management
 * - Legal document version tracking
 * 
 * TODO: Integrate with legal document management system
 * TODO: Add document version control
 * TODO: Connect to consent management platform
 * TODO: Implement user agreement tracking
 * TODO: Add legal document analytics
 * TODO: Add multi-language support for legal docs
 * TODO: Implement digital signature capability
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for legal management
interface LegalDocument {
  id: string;
  title: string;
  type: 'terms' | 'privacy' | 'license' | 'compliance' | 'policy' | 'agreement';
  content: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  isRequired: boolean;
  userConsent?: UserConsent;
  downloadUrl?: string;
}

interface UserConsent {
  given: boolean;
  timestamp?: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

interface LegalCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  documents: LegalDocument[];
  priority: number;
}

interface ConsentRequest {
  documentId: string;
  title: string;
  summary: string;
  isRequired: boolean;
  currentConsent?: UserConsent;
}

interface LegalSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface DocumentItemProps {
  document: LegalDocument;
  onPress: () => void;
  onConsent?: (documentId: string, consent: boolean) => void;
}

interface ConsentFormProps {
  requests: ConsentRequest[];
  onConsentChange: (documentId: string, consent: boolean) => void;
  onSaveConsents: () => void;
}

// Demo legal data - Replace with actual legal content from CMS/legal system
const DEMO_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    type: 'terms',
    content: `TERMS OF SERVICE

Last Updated: January 15, 2024

1. ACCEPTANCE OF TERMS
By accessing or using The Roof Doctors mobile application ("App"), you agree to be bound by these Terms of Service ("Terms").

2. DESCRIPTION OF SERVICE
The Roof Doctors App provides roofing measurement, project management, and related professional services for contractors and roofing professionals.

3. USER ACCOUNTS
- You must provide accurate information when creating an account
- You are responsible for maintaining the security of your account
- You must be at least 18 years old to use this service

4. ACCEPTABLE USE
You agree not to:
- Use the App for any illegal purposes
- Interfere with the App's operation
- Attempt to gain unauthorized access to our systems
- Upload malicious code or content

5. INTELLECTUAL PROPERTY
All content, features, and functionality of the App are owned by The Roof Doctors and are protected by copyright, trademark, and other laws.

6. PRIVACY
Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.

7. LIMITATION OF LIABILITY
The Roof Doctors shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.

8. TERMINATION
We may terminate or suspend your account at any time for violations of these Terms.

9. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.

10. CONTACT INFORMATION
For questions about these Terms, contact us at legal@theroofdoctors.com.`,
    version: '2.1',
    effectiveDate: '2024-01-15',
    lastUpdated: '2024-01-15',
    isRequired: true,
    userConsent: {
      given: true,
      timestamp: '2024-01-15T10:00:00Z',
      version: '2.1',
    },
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    type: 'privacy',
    content: `PRIVACY POLICY

Last Updated: January 15, 2024

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, use our services, or contact us.

Types of information collected:
- Personal identification information (name, email, phone)
- Professional information (company, role, certifications)
- Device and usage information
- Location data (when permission is granted)
- Camera and photo data for measurements

2. HOW WE USE YOUR INFORMATION
We use the information we collect to:
- Provide and improve our services
- Communicate with you
- Ensure security and prevent fraud
- Comply with legal obligations

3. INFORMATION SHARING
We do not sell, trade, or rent your personal information to third parties. We may share information with:
- Service providers who assist in our operations
- Legal authorities when required by law
- Business partners with your consent

4. DATA SECURITY
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your account and data
- Opt-out of marketing communications

6. COOKIES AND TRACKING
We use cookies and similar technologies to enhance your experience and analyze usage patterns.

7. CHILDREN'S PRIVACY
Our service is not intended for children under 13. We do not knowingly collect personal information from children.

8. INTERNATIONAL TRANSFERS
Your information may be transferred to and processed in countries other than your own.

9. CHANGES TO PRIVACY POLICY
We will notify you of significant changes to this Privacy Policy.

10. CONTACT US
For privacy-related questions, contact us at privacy@theroofdoctors.com.`,
    version: '1.8',
    effectiveDate: '2024-01-15',
    lastUpdated: '2024-01-15',
    isRequired: true,
    userConsent: {
      given: true,
      timestamp: '2024-01-15T10:00:00Z',
      version: '1.8',
    },
  },
  {
    id: 'data-processing-agreement',
    title: 'Data Processing Agreement',
    type: 'agreement',
    content: `DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") forms part of the Terms of Service between you and The Roof Doctors.

1. DEFINITIONS
- "Personal Data" has the meaning set forth in applicable data protection laws
- "Processing" includes any operation performed on Personal Data

2. SCOPE AND APPLICABILITY
This DPA applies to the Processing of Personal Data by The Roof Doctors on behalf of users.

3. DATA CONTROLLER AND PROCESSOR ROLES
- You act as the data controller for customer data you input
- The Roof Doctors acts as a data processor

4. PROCESSING INSTRUCTIONS
We will process Personal Data only for the purposes outlined in our Privacy Policy and Terms of Service.

5. SECURITY MEASURES
We implement appropriate technical and organizational measures to ensure data security.

6. SUBPROCESSORS
We may engage third-party subprocessors with appropriate safeguards.

7. DATA SUBJECT RIGHTS
We will assist you in responding to data subject requests.

8. DATA BREACH NOTIFICATION
We will notify you promptly of any personal data breaches.

9. INTERNATIONAL TRANSFERS
Data transfers will comply with applicable laws and include appropriate safeguards.

10. AUDIT RIGHTS
You may request information about our compliance with this DPA.`,
    version: '1.2',
    effectiveDate: '2024-01-15',
    lastUpdated: '2024-01-15',
    isRequired: false,
    userConsent: {
      given: false,
      version: '1.2',
    },
  },
];

const DEMO_SOFTWARE_LICENSES: LegalDocument[] = [
  {
    id: 'react-native-license',
    title: 'React Native',
    type: 'license',
    content: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
    version: 'MIT',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    isRequired: false,
  },
  {
    id: 'expo-license',
    title: 'Expo SDK',
    type: 'license',
    content: `MIT License

Copyright (c) 2023 Expo Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`,
    version: 'MIT',
    effectiveDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    isRequired: false,
  },
];

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

/**
 * Legal section component
 */
const LegalSection: React.FC<LegalSectionProps> = ({
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
    <View style={styles.legalSection}>
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
 * Document item component
 */
const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  onPress,
  onConsent,
}) => {
  const getStatusColor = useCallback(() => {
    if (!document.userConsent) return '#9E9E9E';
    return document.userConsent.given ? '#4CAF50' : '#F44336';
  }, [document.userConsent]);

  const getStatusText = useCallback(() => {
    if (!document.userConsent) return 'Not Reviewed';
    return document.userConsent.given ? 'Accepted' : 'Declined';
  }, [document.userConsent]);

  return (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${document.title}, version ${document.version}, ${getStatusText()}`}
      accessibilityHint="Tap to view document details"
    >
      <View style={styles.documentContent}>
        <Text style={styles.documentTitle}>{document.title}</Text>
        <Text style={styles.documentMeta}>
          Version {document.version} • Updated {new Date(document.lastUpdated).toLocaleDateString()}
        </Text>
        {document.isRequired && (
          <Text style={styles.requiredBadge}>Required</Text>
        )}
      </View>
      
      <View style={styles.documentActions}>
        {document.userConsent && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        )}
        
        {document.isRequired && onConsent && (
          <TouchableOpacity
            style={styles.consentButton}
            onPress={() => onConsent(document.id, !document.userConsent?.given)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={document.userConsent?.given ? 'Revoke consent' : 'Give consent'}
          >
            <Text style={styles.consentButtonText}>
              {document.userConsent?.given ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.documentArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Consent management form
 */
const ConsentForm: React.FC<ConsentFormProps> = ({
  requests,
  onConsentChange,
  onSaveConsents,
}) => {
  const hasChanges = requests.some(req => 
    req.currentConsent?.given !== (req.currentConsent?.given ?? false)
  );

  return (
    <View style={styles.consentForm}>
      <Text style={styles.consentTitle}>Manage Your Consents</Text>
      <Text style={styles.consentDescription}>
        You can withdraw your consent at any time. Required consents are necessary for the app to function properly.
      </Text>
      
      {requests.map((request) => (
        <View key={request.documentId} style={styles.consentItem}>
          <View style={styles.consentContent}>
            <Text style={styles.consentItemTitle}>{request.title}</Text>
            <Text style={styles.consentSummary}>{request.summary}</Text>
            {request.isRequired && (
              <Text style={styles.requiredText}>Required for app functionality</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.consentToggle,
              request.currentConsent?.given && styles.consentToggleActive,
            ]}
            onPress={() => onConsentChange(request.documentId, !request.currentConsent?.given)}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel={`${request.title} consent`}
            accessibilityState={{ checked: request.currentConsent?.given }}
          >
            <Text style={styles.consentToggleText}>
              {request.currentConsent?.given ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      
      {hasChanges && (
        <TouchableOpacity
          style={styles.saveConsentsButton}
          onPress={onSaveConsents}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save consent preferences"
        >
          <Text style={styles.saveConsentsText}>Save Preferences</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Main LegalScreen component
 */
export default function LegalScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual legal context/Redux
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>(DEMO_LEGAL_DOCUMENTS);
  const [softwareLicenses] = useState<LegalDocument[]>(DEMO_SOFTWARE_LICENSES);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showConsentForm, setShowConsentForm] = useState(false);

  // Legal document categories
  const documentCategories: LegalCategory[] = React.useMemo(() => [
    {
      id: 'agreements',
      title: 'User Agreements',
      description: 'Terms of service and user agreements',
      icon: '📋',
      documents: legalDocuments.filter(doc => doc.type === 'terms' || doc.type === 'agreement'),
      priority: 1,
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      description: 'Privacy policies and data processing information',
      icon: '🔒',
      documents: legalDocuments.filter(doc => doc.type === 'privacy' || doc.type === 'policy'),
      priority: 2,
    },
    {
      id: 'compliance',
      title: 'Compliance & Regulatory',
      description: 'Regulatory compliance and industry standards',
      icon: '⚖️',
      documents: legalDocuments.filter(doc => doc.type === 'compliance'),
      priority: 3,
    },
    {
      id: 'licenses',
      title: 'Software Licenses',
      description: 'Third-party software licenses and attributions',
      icon: '📄',
      documents: softwareLicenses,
      priority: 4,
    },
  ], [legalDocuments, softwareLicenses]);

  // Consent requests for required documents
  const consentRequests: ConsentRequest[] = React.useMemo(() => 
    legalDocuments
      .filter(doc => doc.isRequired)
      .map(doc => ({
        documentId: doc.id,
        title: doc.title,
        summary: doc.type === 'terms' 
          ? 'Agree to the terms and conditions for using our service'
          : 'Consent to our data collection and processing practices',
        isRequired: doc.isRequired,
        currentConsent: doc.userConsent,
      }))
  , [legalDocuments]);

  // Document handlers
  const handleDocumentPress = useCallback((document: LegalDocument) => {
    setSelectedDocument(document);
    // TODO: Navigate to document detail view or open modal
    Alert.alert(
      document.title,
      `Version ${document.version}\nLast updated: ${new Date(document.lastUpdated).toLocaleDateString()}\n\nWould you like to view the full document?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Document',
          onPress: () => {
            // TODO: Open document viewer or navigate to document screen
            Alert.alert('Document Viewer', `Opening ${document.title}...`);
          },
        },
        ...(document.downloadUrl ? [{
          text: 'Download PDF',
          onPress: () => Linking.openURL(document.downloadUrl!),
        }] : []),
      ]
    );
  }, []);

  const handleConsentChange = useCallback((documentId: string, consent: boolean) => {
    setLegalDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? {
            ...doc,
            userConsent: {
              given: consent,
              timestamp: new Date().toISOString(),
              version: doc.version,
              // TODO: Add actual IP address and user agent
              ipAddress: '192.168.1.1',
              userAgent: 'RoofDoctorsApp/1.0.0',
            },
          }
        : doc
    ));
    // TODO: Sync consent with backend/legal system
  }, []);

  const handleSaveConsents = useCallback(() => {
    // TODO: Batch save all consent changes to backend
    Alert.alert('Consents Saved', 'Your consent preferences have been updated.');
    setShowConsentForm(false);
  }, []);

  const handleExportConsents = useCallback(() => {
    Alert.alert(
      'Export Consents',
      'Download a record of your consent preferences?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // TODO: Generate and download consent record
            Alert.alert('Export Started', 'Your consent record will be downloaded.');
          },
        },
      ]
    );
  }, []);

  const handleContactLegal = useCallback(() => {
    Alert.alert(
      'Legal Contact',
      'Choose how to contact our legal team:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:legal@theroofdoctors.com?subject=Legal Inquiry'),
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+18005555555'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Legal information and documents"
    >
      {/* Header with Actions */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Legal Information</Text>
        <Text style={styles.headerSubtitle}>
          Review our legal documents and manage your consent preferences
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowConsentForm(!showConsentForm)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Manage consent preferences"
          >
            <Text style={styles.headerButtonText}>Manage Consents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, styles.secondaryButton]}
            onPress={handleContactLegal}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Contact legal team"
          >
            <Text style={[styles.headerButtonText, styles.secondaryButtonText]}>
              Contact Legal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Consent Management Form */}
      {showConsentForm && (
        <LegalSection title="Consent Management">
          <ConsentForm
            requests={consentRequests}
            onConsentChange={handleConsentChange}
            onSaveConsents={handleSaveConsents}
          />
        </LegalSection>
      )}

      {/* Document Categories */}
      {documentCategories
        .sort((a, b) => a.priority - b.priority)
        .map((category) => (
          <LegalSection
            key={category.id}
            title={`${category.icon} ${category.title}`}
            subtitle={category.description}
            collapsible={category.documents.length > 3}
            defaultExpanded={category.priority <= 2}
          >
            {category.documents.map((document) => (
              <DocumentItem
                key={document.id}
                document={document}
                onPress={() => handleDocumentPress(document)}
                onConsent={document.isRequired ? handleConsentChange : undefined}
              />
            ))}
            
            {category.documents.length === 0 && (
              <Text style={styles.emptyCategory}>
                No documents in this category
              </Text>
            )}
          </LegalSection>
        ))}

      {/* Compliance Information */}
      <LegalSection title="Compliance & Standards" collapsible defaultExpanded={false}>
        <View style={styles.complianceInfo}>
          <Text style={styles.complianceTitle}>Industry Standards</Text>
          <Text style={styles.complianceItem}>• GDPR Compliant</Text>
          <Text style={styles.complianceItem}>• CCPA Compliant</Text>
          <Text style={styles.complianceItem}>• SOC 2 Type II Certified</Text>
          <Text style={styles.complianceItem}>• ISO 27001 Compliant</Text>
          
          <Text style={styles.complianceTitle}>Security Certifications</Text>
          <Text style={styles.complianceItem}>• PCI DSS Level 1 Compliant</Text>
          <Text style={styles.complianceItem}>• OWASP Security Guidelines</Text>
          
          <Text style={styles.complianceTitle}>Data Processing</Text>
          <Text style={styles.complianceItem}>• Data Processing Agreement Available</Text>
          <Text style={styles.complianceItem}>• EU-US Privacy Shield Framework</Text>
          <Text style={styles.complianceItem}>• Standard Contractual Clauses</Text>
        </View>
      </LegalSection>

      {/* Legal Updates */}
      <LegalSection title="Recent Legal Updates" collapsible defaultExpanded={false}>
        <View style={styles.legalUpdates}>
          <View style={styles.updateItem}>
            <Text style={styles.updateDate}>January 15, 2024</Text>
            <Text style={styles.updateTitle}>Privacy Policy Updated</Text>
            <Text style={styles.updateDescription}>
              Enhanced data protection measures and clarified cookie usage
            </Text>
          </View>
          
          <View style={styles.updateItem}>
            <Text style={styles.updateDate}>December 1, 2023</Text>
            <Text style={styles.updateTitle}>Terms of Service Revision</Text>
            <Text style={styles.updateDescription}>
              Updated user responsibilities and service availability terms
            </Text>
          </View>
        </View>
      </LegalSection>

      {/* Export and Contact */}
      <LegalSection title="Legal Actions">
        <View style={styles.legalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportConsents}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Export consent record"
          >
            <Text style={styles.actionButtonIcon}>📄</Text>
            <Text style={styles.actionButtonText}>Export Consent Record</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL('https://theroofdoctors.com/legal')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Visit legal center website"
          >
            <Text style={styles.actionButtonIcon}>🌐</Text>
            <Text style={styles.actionButtonText}>Legal Center Website</Text>
          </TouchableOpacity>
        </View>
      </LegalSection>

      {/* Footer Information */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          The Roof Doctors Legal Department
        </Text>
        <Text style={styles.footerText}>
          For legal inquiries: legal@theroofdoctors.com
        </Text>
        <Text style={styles.footerText}>
          Last reviewed: January 15, 2024
        </Text>
      </View>
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
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  legalSection: {
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
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  requiredBadge: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  consentButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  documentArrow: {
    fontSize: 20,
    color: '#c0c0c0',
    marginLeft: 8,
  },
  consentForm: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  consentContent: {
    flex: 1,
    marginRight: 12,
  },
  consentItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  consentSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  requiredText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  consentToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  consentToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  consentToggleText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  saveConsentsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveConsentsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCategory: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  complianceInfo: {
    gap: 16,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  complianceItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
  },
  // Spacing between children should be handled via margin on child components
  legalUpdates: {
  },
  updateItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  updateDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  updateDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  legalActions: {
    // spacing between children handled via marginBottom on child components
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
});