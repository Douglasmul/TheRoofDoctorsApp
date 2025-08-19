/**
 * @fileoverview Styles for MeasurementReviewScreen
 * Separated large StyleSheet for better maintainability
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { StyleSheet } from 'react-native';

export const measurementReviewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  qualityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qualityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
  },
  planeCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  planeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
  },
  planeType: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planeDetail: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  materialCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 4,
  },
  materialSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  materialList: {
    // No specific styles needed
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  materialName: {
    fontSize: 14,
    color: '#234e70',
    flex: 1,
  },
  materialQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginRight: 16,
  },
  materialCost: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
  },
  complianceCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  complianceStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  complianceStatusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  complianceDetails: {
    // No specific styles needed
  },
  complianceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  complianceStandard: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  syncCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  syncStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  syncTime: {
    fontSize: 12,
    color: '#666',
  },
  syncError: {
    fontSize: 12,
    color: '#F44336',
  },
  actionPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#2196F3',
  },
  syncButton: {
    backgroundColor: '#4CAF50',
  },
  quoteButton: {
    backgroundColor: '#e67e22',
  },
  complianceButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    textAlign: 'center',
    marginBottom: 20,
  },
  exportOptions: {
    marginBottom: 20,
  },
  exportOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // New styles for surface type breakdown
  breakdownSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 12,
  },
  breakdownItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  breakdownCount: {
    fontSize: 12,
    color: '#666',
  },
  breakdownArea: {
    fontSize: 12,
    color: '#666',
  },
  
  // New styles for editing interface
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  validateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  validateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  planeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planeTypeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editForm: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  editRow: {
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
  },
  typeOptionSelected: {
    backgroundColor: '#234e70',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#666',
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  materialSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
  },
  materialOptionSelected: {
    backgroundColor: '#FF9800',
  },
  materialOptionText: {
    fontSize: 12,
    color: '#666',
  },
  materialOptionTextSelected: {
    color: 'white',
  },
});