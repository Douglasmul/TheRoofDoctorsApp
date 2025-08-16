import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Switch,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Legal document interface for enterprise legal content management
 */
interface LegalDocument {
  id: string;
  title: string;
  type: 'terms' | 'privacy' | 'cookies' | 'gdpr' | 'ccpa' | 'eula' | 'sla' | 'dpa';
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  content: LegalSection[];
  languages: string[];
  jurisdiction: string;
  mandatory: boolean;
  acceptanceRequired: boolean;
  downloadable: boolean;
}

/**
 * Legal section for structured content organization
 */
interface LegalSection {
  id: string;
  title: string;
  content: string;
  subsections?: LegalSection[];
  important: boolean;
  lastModified: Date;
}

/**
 * User consent tracking interface
 */
interface UserConsent {
  documentId: string;
  version: string;
  accepted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  method: 'click' | 'scroll' | 'explicit';
}

/**
 * Legal compliance settings interface
 */
interface ComplianceSettings {
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  cookieConsent: boolean;
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  location: string;
  ageVerification: boolean;
}

/**
 * Available legal document types
 */
const LEGAL_DOCUMENT_TYPES = [
  {
    id: 'terms',
    name: 'Terms of Service',
    icon: '📋',
    description: 'Terms and conditions for using our service',
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    icon: '🔒',
    description: 'How we collect, use, and protect your data',
  },
  {
    id: 'cookies',
    name: 'Cookie Policy',
    icon: '🍪',
    description: 'Information about cookies and tracking',
  },
  {
    id: 'gdpr',
    name: 'GDPR Notice',
    icon: '🇪🇺',
    description: 'European data protection rights',
  },
  {
    id: 'ccpa',
    name: 'CCPA Notice',
    icon: '🇺🇸',
    description: 'California consumer privacy rights',
  },
  {
    id: 'eula',
    name: 'End User License',
    icon: '⚖️',
    description: 'Software license agreement',
  },
];

/**
 * Mock legal documents data
 */
const MOCK_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'terms_v2_1',
    title: 'Terms of Service',
    type: 'terms',
    version: '2.1',
    effectiveDate: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-15'),
    languages: ['en', 'es', 'fr'],
    jurisdiction: 'United States',
    mandatory: true,
    acceptanceRequired: true,
    downloadable: true,
    content: [
      {
        id: 'terms_acceptance',
        title: '1. Acceptance of Terms',
        content: 'By using The Roof Doctors application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.',
        important: true,
        lastModified: new Date('2024-01-01'),
      },
      {
        id: 'terms_services',
        title: '2. Description of Services',
        content: 'The Roof Doctors provides a platform connecting property owners with certified roofing contractors. Our services include quote generation, project management, contractor matching, and payment processing.',
        important: false,
        lastModified: new Date('2024-01-01'),
        subsections: [
          {
            id: 'terms_quotes',
            title: '2.1 Quote Services',
            content: 'We provide estimates for roofing work based on information you provide. Quotes are estimates only and final pricing may vary.',
            important: false,
            lastModified: new Date('2024-01-01'),
          },
          {
            id: 'terms_contractors',
            title: '2.2 Contractor Network',
            content: 'We maintain a network of licensed and insured contractors. However, you are responsible for verifying contractor credentials.',
            important: true,
            lastModified: new Date('2024-01-01'),
          },
        ],
      },
      {
        id: 'terms_user_obligations',
        title: '3. User Obligations',
        content: 'You agree to provide accurate information, maintain the security of your account, and use our Service in compliance with applicable laws and regulations.',
        important: true,
        lastModified: new Date('2024-01-01'),
      },
      {
        id: 'terms_payment',
        title: '4. Payment Terms',
        content: 'Payment processing is handled through secure third-party providers. You are responsible for all charges incurred through your account.',
        important: true,
        lastModified: new Date('2024-01-10'),
      },
      {
        id: 'terms_liability',
        title: '5. Limitation of Liability',
        content: 'Our liability is limited to the maximum extent permitted by law. We are not liable for any indirect, incidental, or consequential damages.',
        important: true,
        lastModified: new Date('2024-01-01'),
      },
    ],
  },
  {
    id: 'privacy_v1_3',
    title: 'Privacy Policy',
    type: 'privacy',
    version: '1.3',
    effectiveDate: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-20'),
    languages: ['en', 'es'],
    jurisdiction: 'United States',
    mandatory: true,
    acceptanceRequired: true,
    downloadable: true,
    content: [
      {
        id: 'privacy_collection',
        title: '1. Information We Collect',
        content: 'We collect information you provide directly, automatically through your use of our Service, and from third parties.',
        important: true,
        lastModified: new Date('2024-01-20'),
        subsections: [
          {
            id: 'privacy_personal',
            title: '1.1 Personal Information',
            content: 'Name, email address, phone number, property address, and payment information.',
            important: true,
            lastModified: new Date('2024-01-01'),
          },
          {
            id: 'privacy_usage',
            title: '1.2 Usage Information',
            content: 'Device information, IP address, app usage patterns, and location data (with permission).',
            important: false,
            lastModified: new Date('2024-01-01'),
          },
        ],
      },
      {
        id: 'privacy_use',
        title: '2. How We Use Your Information',
        content: 'We use your information to provide services, communicate with you, improve our platform, and ensure security.',
        important: true,
        lastModified: new Date('2024-01-01'),
      },
      {
        id: 'privacy_sharing',
        title: '3. Information Sharing',
        content: 'We share information with contractors as necessary to provide services, with service providers, and as required by law.',
        important: true,
        lastModified: new Date('2024-01-15'),
      },
      {
        id: 'privacy_security',
        title: '4. Data Security',
        content: 'We implement technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction.',
        important: true,
        lastModified: new Date('2024-01-01'),
      },
      {
        id: 'privacy_rights',
        title: '5. Your Rights',
        content: 'You have rights to access, correct, delete, and port your data. You may also opt out of certain communications.',
        important: true,
        lastModified: new Date('2024-01-20'),
      },
    ],
  },
];

/**
 * Enterprise-grade Legal Screen Component
 * 
 * Provides comprehensive legal compliance and document management including:
 * - Structured legal document display with versioning
 * - User consent tracking and management
 * - GDPR and CCPA compliance features
 * - Multi-language legal document support
 * - Document download and sharing capabilities
 * - Consent withdrawal and preference management
 * - Legal document search and navigation
 * - Accessibility-optimized legal content
 * - Compliance settings and privacy controls
 * 
 * @component
 * @example
 * ```tsx
 * <LegalScreen />
 * ```
 * 
 * @author The Roof Doctors Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export default function LegalScreen(): JSX.Element {
  const navigation = useNavigation();
  
  // State management
  const [legalDocuments] = useState<LegalDocument[]>(MOCK_LEGAL_DOCUMENTS);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [userConsents, setUserConsents] = useState<UserConsent[]>([]);
  const [complianceSettings, setComplianceSettings] = useState<ComplianceSettings>({
    gdprEnabled: true,
    ccpaEnabled: true,
    cookieConsent: true,
    dataProcessing: true,
    marketing: false,
    analytics: true,
    location: 'US',
    ageVerification: true,
  });
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  /**
   * Load user consent data
   * TODO: Integrate with consent management service
   */
  const loadUserConsents = useCallback(async () => {
    try {
      // TODO: Replace with actual consent service
      // const consents = await consentService.getUserConsents();
      
      // Mock consent data
      const mockConsents: UserConsent[] = [
        {
          documentId: 'terms_v2_1',
          version: '2.1',
          accepted: true,
          timestamp: new Date('2024-01-15T10:30:00Z'),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          method: 'click',
        },
        {
          documentId: 'privacy_v1_3',
          version: '1.3',
          accepted: true,
          timestamp: new Date('2024-01-20T14:45:00Z'),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          method: 'explicit',
        },
      ];
      
      setUserConsents(mockConsents);
    } catch (error) {
      console.error('Failed to load user consents:', error);
    }
  }, []);

  /**
   * Record user consent for a legal document
   * TODO: Integrate with consent management service
   */
  const recordConsent = useCallback(async (documentId: string, version: string, accepted: boolean) => {
    try {
      const consent: UserConsent = {
        documentId,
        version,
        accepted,
        timestamp: new Date(),
        ipAddress: '192.168.1.100', // TODO: Get actual IP
        userAgent: 'React Native App', // TODO: Get actual user agent
        method: 'explicit',
      };
      
      // TODO: Replace with actual consent service
      // await consentService.recordConsent(consent);
      
      setUserConsents(prev => [
        ...prev.filter(c => c.documentId !== documentId),
        consent,
      ]);
      
      Alert.alert(
        'Consent Recorded',
        `Your consent has been ${accepted ? 'granted' : 'withdrawn'} and recorded.`,
        [{ text: 'OK' }]
      );
      
      AccessibilityInfo.announceForAccessibility(
        `Consent ${accepted ? 'granted' : 'withdrawn'} and recorded`
      );
      
    } catch (error) {
      console.error('Failed to record consent:', error);
      Alert.alert('Error', 'Failed to record consent. Please try again.');
    }
  }, []);

  /**
   * Download legal document
   * TODO: Integrate with document service
   */
  const downloadDocument = useCallback(async (document: LegalDocument) => {
    try {
      Alert.alert(
        'Download Document',
        `Download ${document.title} v${document.version} as PDF?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: () => {
              // TODO: Implement actual document download
              Alert.alert('Success', 'Document download will be available soon.');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to download document:', error);
      Alert.alert('Error', 'Failed to download document');
    }
  }, []);

  /**
   * Share legal document
   * TODO: Integrate with sharing service
   */
  const shareDocument = useCallback(async (document: LegalDocument) => {
    try {
      const shareUrl = `https://roofdoctors.com/legal/${document.type}/${document.version}`;
      
      // TODO: Implement actual sharing
      Alert.alert(
        'Share Document',
        `Share link: ${shareUrl}`,
        [
          { text: 'Copy Link', onPress: () => {
            // TODO: Copy to clipboard
            Alert.alert('Copied', 'Link copied to clipboard');
          }},
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Failed to share document:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  }, []);

  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  /**
   * Update compliance settings
   */
  const updateComplianceSetting = useCallback((key: keyof ComplianceSettings, value: any) => {
    setComplianceSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // TODO: Save settings to backend
    // complianceService.updateSettings({ [key]: value });
  }, []);

  /**
   * Get user consent status for a document
   */
  const getConsentStatus = useCallback((documentId: string) => {
    return userConsents.find(consent => consent.documentId === documentId);
  }, [userConsents]);

  /**
   * Render legal document item
   */
  const renderDocumentItem = useCallback((document: LegalDocument) => {
    const documentType = LEGAL_DOCUMENT_TYPES.find(type => type.id === document.type);
    const consentStatus = getConsentStatus(document.id);
    
    return (
      <TouchableOpacity
        key={document.id}
        style={styles.documentItem}
        onPress={() => {
          setSelectedDocument(document);
          setShowDocumentModal(true);
        }}
        accessibilityLabel={`${document.title} version ${document.version}`}
        accessibilityHint="Tap to view document details"
      >
        <View style={styles.documentHeader}>
          <Text style={styles.documentIcon}>{documentType?.icon}</Text>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{document.title}</Text>
            <Text style={styles.documentVersion}>Version {document.version}</Text>
            <Text style={styles.documentDate}>
              Effective: {document.effectiveDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.documentStatus}>
            {document.acceptanceRequired && (
              <View style={[
                styles.consentBadge,
                { backgroundColor: consentStatus?.accepted ? '#28a745' : '#dc3545' }
              ]}>
                <Text style={styles.consentBadgeText}>
                  {consentStatus?.accepted ? 'Accepted' : 'Required'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.documentDescription}>
          {documentType?.description}
        </Text>
      </TouchableOpacity>
    );
  }, [getConsentStatus]);

  /**
   * Render legal section
   */
  const renderLegalSection = useCallback((section: LegalSection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    
    return (
      <View key={section.id} style={[styles.legalSection, { marginLeft: level * 16 }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          accessibilityLabel={section.title}
          accessibilityHint={isExpanded ? 'Tap to collapse' : 'Tap to expand'}
        >
          <Text style={[
            styles.sectionTitle,
            section.important && styles.importantSection,
            { fontSize: 18 - level * 2 }
          ]}>
            {section.title}
          </Text>
          <Text style={styles.sectionToggle}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionText}>{section.content}</Text>
            
            {section.subsections?.map(subsection => 
              renderLegalSection(subsection, level + 1)
            )}
            
            <Text style={styles.sectionMeta}>
              Last modified: {section.lastModified.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  }, [expandedSections, toggleSection]);

  useEffect(() => {
    loadUserConsents();
  }, [loadUserConsents]);

  return (
    <ScrollView 
      style={styles.container}
      accessibilityLabel="Legal and privacy screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={styles.headerTitle}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Legal & Privacy
        </Text>
        <Text style={styles.headerSubtitle}>
          View our legal documents and manage your privacy preferences
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowConsentModal(true)}
          accessibilityLabel="Manage consent preferences"
        >
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionText}>Manage Consent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => Linking.openURL('mailto:privacy@roofdoctors.com')}
          accessibilityLabel="Contact privacy team"
        >
          <Text style={styles.quickActionIcon}>📧</Text>
          <Text style={styles.quickActionText}>Privacy Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => Alert.alert('Data Export', 'Data export functionality will be available soon.')}
          accessibilityLabel="Export your data"
        >
          <Text style={styles.quickActionIcon}>📤</Text>
          <Text style={styles.quickActionText}>Export Data</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal Documents</Text>
        
        {legalDocuments.map(renderDocumentItem)}
      </View>

      {/* Compliance Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Rights</Text>
        
        <View style={styles.rightsContainer}>
          <View style={styles.rightItem}>
            <Text style={styles.rightTitle}>Right to Access</Text>
            <Text style={styles.rightDescription}>
              Request a copy of your personal data we hold
            </Text>
          </View>
          
          <View style={styles.rightItem}>
            <Text style={styles.rightTitle}>Right to Rectification</Text>
            <Text style={styles.rightDescription}>
              Correct inaccurate or incomplete personal data
            </Text>
          </View>
          
          <View style={styles.rightItem}>
            <Text style={styles.rightTitle}>Right to Deletion</Text>
            <Text style={styles.rightDescription}>
              Request deletion of your personal data
            </Text>
          </View>
          
          <View style={styles.rightItem}>
            <Text style={styles.rightTitle}>Right to Portability</Text>
            <Text style={styles.rightDescription}>
              Receive your data in a machine-readable format
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal Contact</Text>
        
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Data Protection Officer:</Text>
          <Text style={styles.contactValue}>privacy@roofdoctors.com</Text>
          
          <Text style={styles.contactLabel}>Legal Department:</Text>
          <Text style={styles.contactValue}>legal@roofdoctors.com</Text>
          
          <Text style={styles.contactLabel}>Mailing Address:</Text>
          <Text style={styles.contactValue}>
            The Roof Doctors{'\n'}
            Legal Department{'\n'}
            123 Business Ave{'\n'}
            Suite 100{'\n'}
            City, State 12345
          </Text>
        </View>
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

      {/* Document Detail Modal */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDocument && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedDocument.title}
                  </Text>
                  <Text style={styles.modalVersion}>
                    Version {selectedDocument.version}
                  </Text>
                </View>
                
                <ScrollView style={styles.documentContent}>
                  {selectedDocument.content.map(section => 
                    renderLegalSection(section)
                  )}
                </ScrollView>
                
                <View style={styles.modalActions}>
                  {selectedDocument.acceptanceRequired && (
                    <View style={styles.consentActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => {
                          recordConsent(selectedDocument.id, selectedDocument.version, true);
                          setShowDocumentModal(false);
                        }}
                        accessibilityLabel="Accept document"
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => {
                          recordConsent(selectedDocument.id, selectedDocument.version, false);
                          setShowDocumentModal(false);
                        }}
                        accessibilityLabel="Decline document"
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.documentActions}>
                    {selectedDocument.downloadable && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => downloadDocument(selectedDocument)}
                        accessibilityLabel="Download document"
                      >
                        <Text style={styles.actionButtonText}>📄 Download</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => shareDocument(selectedDocument)}
                      accessibilityLabel="Share document"
                    >
                      <Text style={styles.actionButtonText}>🔗 Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDocumentModal(false)}
              accessibilityLabel="Close document"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Consent Management Modal */}
      <Modal
        visible={showConsentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConsentModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Privacy Preferences</Text>
            
            <ScrollView style={styles.preferencesContent}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>Cookie Consent</Text>
                  <Text style={styles.preferenceDescription}>
                    Allow cookies for improved user experience
                  </Text>
                </View>
                <Switch
                  value={complianceSettings.cookieConsent}
                  onValueChange={(value) => updateComplianceSetting('cookieConsent', value)}
                  accessibilityLabel="Toggle cookie consent"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>Analytics</Text>
                  <Text style={styles.preferenceDescription}>
                    Help us improve by sharing usage analytics
                  </Text>
                </View>
                <Switch
                  value={complianceSettings.analytics}
                  onValueChange={(value) => updateComplianceSetting('analytics', value)}
                  accessibilityLabel="Toggle analytics"
                />
              </View>
              
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>Marketing</Text>
                  <Text style={styles.preferenceDescription}>
                    Receive marketing communications
                  </Text>
                </View>
                <Switch
                  value={complianceSettings.marketing}
                  onValueChange={(value) => updateComplianceSetting('marketing', value)}
                  accessibilityLabel="Toggle marketing"
                />
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowConsentModal(false)}
              accessibilityLabel="Close preferences"
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
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
  documentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  documentVersion: {
    fontSize: 14,
    color: '#0366d6',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#6a737d',
  },
  documentStatus: {
    alignItems: 'flex-end',
  },
  consentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  consentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  documentDescription: {
    fontSize: 14,
    color: '#586069',
    lineHeight: 20,
  },
  rightsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rightItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  rightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: '#586069',
  },
  contactInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a737d',
    marginTop: 12,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#24292e',
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
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    textAlign: 'center',
  },
  modalVersion: {
    fontSize: 14,
    color: '#6a737d',
    marginTop: 4,
  },
  documentContent: {
    maxHeight: 400,
    marginBottom: 16,
  },
  legalSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    flex: 1,
  },
  importantSection: {
    color: '#dc3545',
  },
  sectionToggle: {
    fontSize: 18,
    color: '#0366d6',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionContent: {
    paddingLeft: 16,
    paddingTop: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#24292e',
    lineHeight: 20,
    marginBottom: 8,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#6a737d',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalActions: {
    marginTop: 16,
  },
  consentActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#24292e',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6a737d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  preferencesContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#586069',
  },
});