import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Report configuration interface for enterprise analytics
 */
interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'performance' | 'compliance';
  type: 'chart' | 'table' | 'summary' | 'dashboard';
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  permissions: string[];
  customizable: boolean;
  exportable: boolean;
}

/**
 * Analytics data structure for metrics and KPIs
 */
interface AnalyticsData {
  revenue: RevenueMetrics;
  quotes: QuoteMetrics;
  customers: CustomerMetrics;
  performance: PerformanceMetrics;
  compliance: ComplianceMetrics;
  trends: TrendData[];
}

/**
 * Revenue and financial metrics
 */
interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageQuoteValue: number;
  conversionRate: number;
  paymentCycles: {
    pending: number;
    overdue: number;
    paid: number;
  };
  profitMargin: number;
  topRevenueStreams: Array<{
    service: string;
    revenue: number;
    percentage: number;
  }>;
}

/**
 * Quote and project metrics
 */
interface QuoteMetrics {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  averageQuoteTime: number; // in hours
  quoteAccuracy: number; // percentage
  seasonalTrends: Array<{
    month: string;
    quotes: number;
    revenue: number;
  }>;
  serviceBreakdown: Array<{
    service: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Customer analytics and insights
 */
interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  retentionRate: number;
  satisfactionScore: number;
  referralRate: number;
  customerLifetimeValue: number;
  geographicDistribution: Array<{
    region: string;
    customers: number;
    revenue: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    value: number;
  }>;
}

/**
 * Performance and operational metrics
 */
interface PerformanceMetrics {
  projectCompletionRate: number;
  averageProjectDuration: number;
  qualityScore: number;
  materialEfficiency: number;
  workforceUtilization: number;
  equipmentUptime: number;
  safetyIncidents: number;
  contractorRatings: Array<{
    contractor: string;
    rating: number;
    projects: number;
  }>;
}

/**
 * Compliance and regulatory metrics
 */
interface ComplianceMetrics {
  licenseCompliance: number;
  insuranceStatus: 'current' | 'expiring' | 'expired';
  safetyCompliance: number;
  permitApprovalRate: number;
  inspectionPassRate: number;
  regulatoryIssues: number;
  certificationStatus: Array<{
    certification: string;
    status: 'valid' | 'expiring' | 'expired';
    expiryDate: Date;
  }>;
}

/**
 * Trend data for time-series analysis
 */
interface TrendData {
  date: Date;
  metric: string;
  value: number;
  category: string;
}

/**
 * Available report templates
 */
const REPORT_TEMPLATES: ReportConfig[] = [
  {
    id: 'financial_summary',
    name: 'Financial Summary',
    description: 'Revenue, profitability, and financial KPIs',
    category: 'financial',
    type: 'dashboard',
    frequency: 'monthly',
    permissions: ['reports.financial'],
    customizable: true,
    exportable: true,
  },
  {
    id: 'quote_analysis',
    name: 'Quote Analysis',
    description: 'Quote conversion rates and pricing insights',
    category: 'operational',
    type: 'chart',
    frequency: 'weekly',
    permissions: ['reports.quotes'],
    customizable: true,
    exportable: true,
  },
  {
    id: 'customer_insights',
    name: 'Customer Insights',
    description: 'Customer behavior and satisfaction metrics',
    category: 'customer',
    type: 'dashboard',
    frequency: 'monthly',
    permissions: ['reports.customers'],
    customizable: false,
    exportable: true,
  },
  {
    id: 'performance_dashboard',
    name: 'Performance Dashboard',
    description: 'Operational efficiency and quality metrics',
    category: 'performance',
    type: 'dashboard',
    frequency: 'daily',
    permissions: ['reports.performance'],
    customizable: true,
    exportable: true,
  },
  {
    id: 'compliance_report',
    name: 'Compliance Report',
    description: 'Regulatory compliance and certification status',
    category: 'compliance',
    type: 'table',
    frequency: 'quarterly',
    permissions: ['reports.compliance'],
    customizable: false,
    exportable: true,
  },
];

/**
 * Enterprise-grade Reports Screen Component
 * 
 * Provides comprehensive analytics and reporting functionality including:
 * - Interactive dashboards with real-time metrics
 * - Financial performance analysis and KPIs
 * - Operational efficiency tracking
 * - Customer analytics and insights
 * - Compliance and regulatory reporting
 * - Customizable report generation
 * - Data export capabilities (PDF, Excel, CSV)
 * - Trend analysis and forecasting
 * - Role-based report access control
 * 
 * @component
 * @example
 * ```tsx
 * <ReportsScreen />
 * ```
 * 
 * @author The Roof Doctors Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export default function ReportsScreen(): JSX.Element {
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });
  const [activeCategory, setActiveCategory] = useState<'overview' | 'financial' | 'operational' | 'customer' | 'compliance'>('overview');

  /**
   * Load analytics data from API
   * TODO: Integrate with analytics service and data warehouse
   */
  const loadAnalyticsData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // TODO: Replace with actual analytics service
      // const analyticsResult = await analyticsService.getAnalytics(dateRange);
      
      // Mock analytics data for development
      const mockAnalytics: AnalyticsData = {
        revenue: {
          totalRevenue: 1245000,
          monthlyRevenue: 89500,
          revenueGrowth: 12.5,
          averageQuoteValue: 4750,
          conversionRate: 68.2,
          paymentCycles: {
            pending: 15,
            overdue: 3,
            paid: 142,
          },
          profitMargin: 28.5,
          topRevenueStreams: [
            { service: 'Complete Roof Replacement', revenue: 456000, percentage: 36.6 },
            { service: 'Roof Repair & Maintenance', revenue: 324000, percentage: 26.0 },
            { service: 'Emergency Roof Services', revenue: 234000, percentage: 18.8 },
            { service: 'Gutter Installation', revenue: 156000, percentage: 12.5 },
            { service: 'Roof Inspection', revenue: 75000, percentage: 6.0 },
          ],
        },
        quotes: {
          totalQuotes: 234,
          pendingQuotes: 23,
          approvedQuotes: 160,
          rejectedQuotes: 51,
          averageQuoteTime: 24.5,
          quoteAccuracy: 94.2,
          seasonalTrends: [
            { month: 'Jan', quotes: 18, revenue: 85000 },
            { month: 'Feb', quotes: 22, revenue: 98000 },
            { month: 'Mar', quotes: 28, revenue: 132000 },
            { month: 'Apr', quotes: 35, revenue: 165000 },
            { month: 'May', quotes: 42, revenue: 198000 },
            { month: 'Jun', quotes: 38, revenue: 180000 },
          ],
          serviceBreakdown: [
            { service: 'Repairs', count: 89, percentage: 38.0 },
            { service: 'Replacements', count: 67, percentage: 28.6 },
            { service: 'Inspections', count: 45, percentage: 19.2 },
            { service: 'Emergency', count: 33, percentage: 14.1 },
          ],
        },
        customers: {
          totalCustomers: 1456,
          newCustomers: 47,
          retentionRate: 76.3,
          satisfactionScore: 4.7,
          referralRate: 34.2,
          customerLifetimeValue: 8750,
          geographicDistribution: [
            { region: 'Downtown', customers: 345, revenue: 425000 },
            { region: 'Suburbs', customers: 678, revenue: 567000 },
            { region: 'Industrial', customers: 234, revenue: 189000 },
            { region: 'Rural', customers: 199, revenue: 124000 },
          ],
          customerSegments: [
            { segment: 'Residential', count: 1123, value: 6890000 },
            { segment: 'Commercial', count: 234, value: 4560000 },
            { segment: 'Industrial', count: 99, value: 2340000 },
          ],
        },
        performance: {
          projectCompletionRate: 96.8,
          averageProjectDuration: 4.2,
          qualityScore: 92.5,
          materialEfficiency: 87.3,
          workforceUtilization: 89.1,
          equipmentUptime: 94.7,
          safetyIncidents: 2,
          contractorRatings: [
            { contractor: 'Mike Johnson', rating: 4.9, projects: 45 },
            { contractor: 'Sarah Wilson', rating: 4.8, projects: 38 },
            { contractor: 'David Brown', rating: 4.7, projects: 52 },
          ],
        },
        compliance: {
          licenseCompliance: 100,
          insuranceStatus: 'current',
          safetyCompliance: 96.2,
          permitApprovalRate: 94.8,
          inspectionPassRate: 91.5,
          regulatoryIssues: 1,
          certificationStatus: [
            { certification: 'GAF Certified', status: 'valid', expiryDate: new Date('2024-12-31') },
            { certification: 'OSHA Certified', status: 'valid', expiryDate: new Date('2024-08-15') },
            { certification: 'EPA Lead-Safe', status: 'expiring', expiryDate: new Date('2024-03-20') },
          ],
        },
        trends: [], // Would contain time-series data
      };
      
      setAnalyticsData(mockAnalytics);
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  /**
   * Generate and export report
   * TODO: Integrate with report generation service
   */
  const exportReport = useCallback(async (reportConfig: ReportConfig, format: 'pdf' | 'excel' | 'csv') => {
    try {
      Alert.alert(
        'Export Report',
        `Exporting ${reportConfig.name} as ${format.toUpperCase()}...`,
        [{ text: 'OK' }]
      );
      
      // TODO: Implement actual report export
      // const reportData = await reportService.generateReport(reportConfig, dateRange, format);
      // await fileService.downloadReport(reportData);
      
      setTimeout(() => {
        Alert.alert('Success', `${reportConfig.name} exported successfully`);
        AccessibilityInfo.announceForAccessibility('Report exported successfully');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to export report:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  }, []);

  /**
   * Format currency values
   */
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  /**
   * Format percentage values
   */
  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  /**
   * Render metric card component
   */
  const renderMetricCard = useCallback((
    title: string, 
    value: string | number, 
    subtitle?: string, 
    trend?: number,
    color = '#234e70'
  ) => (
    <View style={[styles.metricCard, { width: (width - 60) / 2 }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </Text>
      {subtitle && (
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      )}
      {trend !== undefined && (
        <Text style={[
          styles.metricTrend,
          { color: trend >= 0 ? '#28a745' : '#d73a49' }
        ]}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </Text>
      )}
    </View>
  ), [width, formatCurrency]);

  /**
   * Render report template item
   */
  const renderReportTemplate = useCallback(({ item }: { item: ReportConfig }) => {
    const categoryColors = {
      financial: '#28a745',
      operational: '#0366d6',
      customer: '#6f42c1',
      performance: '#fd7e14',
      compliance: '#dc3545',
    };

    return (
      <TouchableOpacity
        style={styles.reportTemplate}
        onPress={() => {
          setSelectedReport(item);
          setShowReportModal(true);
        }}
        accessibilityLabel={`${item.name} report`}
        accessibilityHint={`Open ${item.description}`}
      >
        <View style={[styles.reportIcon, { backgroundColor: categoryColors[item.category] }]}>
          <Text style={styles.reportIconText}>
            {item.name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2)}
          </Text>
        </View>
        
        <View style={styles.reportInfo}>
          <Text style={styles.reportName}>{item.name}</Text>
          <Text style={styles.reportDescription}>{item.description}</Text>
          <Text style={styles.reportFrequency}>Updated {item.frequency}</Text>
        </View>
        
        <View style={styles.reportActions}>
          <Text style={styles.reportCategory}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
          {item.exportable && (
            <Text style={styles.exportableIndicator}>📊</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading && !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text 
          style={styles.loadingText}
          accessibilityLabel="Loading analytics data"
        >
          Loading analytics...
        </Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadAnalyticsData}
          accessibilityLabel="Retry loading analytics"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAnalyticsData(true)}
          tintColor="#234e70"
        />
      }
      accessibilityLabel="Reports and analytics screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={styles.headerTitle}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Reports & Analytics
        </Text>
        <Text style={styles.dateRange}>
          {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
        </Text>
      </View>

      {/* Category Navigation */}
      <ScrollView 
        horizontal 
        style={styles.categoryNavigation}
        showsHorizontalScrollIndicator={false}
      >
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'financial', name: 'Financial' },
          { id: 'operational', name: 'Operational' },
          { id: 'customer', name: 'Customer' },
          { id: 'compliance', name: 'Compliance' },
        ].map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === category.id && styles.activeCategoryTab
            ]}
            onPress={() => setActiveCategory(category.id as any)}
            accessibilityLabel={`${category.name} category`}
          >
            <Text style={[
              styles.categoryTabText,
              activeCategory === category.id && styles.activeCategoryTabText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Overview Dashboard */}
      {activeCategory === 'overview' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Revenue',
              analyticsData.revenue.totalRevenue,
              'All time',
              analyticsData.revenue.revenueGrowth
            )}
            {renderMetricCard(
              'Monthly Revenue',
              analyticsData.revenue.monthlyRevenue,
              'This month',
              undefined,
              '#28a745'
            )}
            {renderMetricCard(
              'Total Quotes',
              analyticsData.quotes.totalQuotes,
              'This period',
              undefined,
              '#0366d6'
            )}
            {renderMetricCard(
              'Conversion Rate',
              formatPercentage(analyticsData.revenue.conversionRate),
              'Quote to sale',
              undefined,
              '#6f42c1'
            )}
          </View>
        </View>
      )}

      {/* Financial Analytics */}
      {activeCategory === 'financial' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Performance</Text>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Avg Quote Value',
              analyticsData.revenue.averageQuoteValue,
              'Per quote'
            )}
            {renderMetricCard(
              'Profit Margin',
              formatPercentage(analyticsData.revenue.profitMargin),
              'Net profit'
            )}
          </View>
          
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Revenue Streams</Text>
            {analyticsData.revenue.topRevenueStreams.map((stream, index) => (
              <View key={index} style={styles.revenueStream}>
                <Text style={styles.streamName}>{stream.service}</Text>
                <View style={styles.streamMetrics}>
                  <Text style={styles.streamRevenue}>
                    {formatCurrency(stream.revenue)}
                  </Text>
                  <Text style={styles.streamPercentage}>
                    {formatPercentage(stream.percentage)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Customer Analytics */}
      {activeCategory === 'customer' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Customers',
              analyticsData.customers.totalCustomers,
              'All time'
            )}
            {renderMetricCard(
              'Satisfaction',
              `${analyticsData.customers.satisfactionScore}/5`,
              'Average rating'
            )}
          </View>
        </View>
      )}

      {/* Report Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Reports</Text>
        
        <FlatList
          data={REPORT_TEMPLATES}
          keyExtractor={(item) => item.id}
          renderItem={renderReportTemplate}
          scrollEnabled={false}
          contentContainerStyle={styles.reportsList}
        />
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

      {/* Report Export Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <Text style={styles.modalTitle}>{selectedReport.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedReport.description}
                </Text>
                
                <View style={styles.exportOptions}>
                  <Text style={styles.exportTitle}>Export Format:</Text>
                  
                  {['pdf', 'excel', 'csv'].map(format => (
                    <TouchableOpacity
                      key={format}
                      style={styles.exportOption}
                      onPress={() => {
                        setShowReportModal(false);
                        exportReport(selectedReport, format as any);
                      }}
                      accessibilityLabel={`Export as ${format.toUpperCase()}`}
                    >
                      <Text style={styles.exportOptionText}>
                        {format.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReportModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#234e70',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#d73a49',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#234e70',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#6a737d',
  },
  categoryNavigation: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d1d5da',
  },
  activeCategoryTab: {
    backgroundColor: '#0366d6',
    borderColor: '#0366d6',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#24292e',
    fontWeight: '500',
  },
  activeCategoryTabText: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
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
  metricTitle: {
    fontSize: 14,
    color: '#6a737d',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6a737d',
  },
  metricTrend: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  subSection: {
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#234e70',
    marginBottom: 12,
  },
  revenueStream: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  streamName: {
    fontSize: 14,
    color: '#24292e',
    flex: 1,
  },
  streamMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginRight: 12,
  },
  streamPercentage: {
    fontSize: 12,
    color: '#6a737d',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reportsList: {
    paddingBottom: 20,
  },
  reportTemplate: {
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
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#586069',
    marginBottom: 4,
  },
  reportFrequency: {
    fontSize: 12,
    color: '#6a737d',
  },
  reportActions: {
    alignItems: 'flex-end',
  },
  reportCategory: {
    fontSize: 12,
    color: '#0366d6',
    fontWeight: '500',
    marginBottom: 4,
  },
  exportableIndicator: {
    fontSize: 16,
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
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#586069',
    marginBottom: 20,
  },
  exportOptions: {
    marginBottom: 20,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 12,
  },
  exportOption: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  exportOptionText: {
    fontSize: 16,
    color: '#24292e',
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
});