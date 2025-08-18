/**
 * @fileoverview Demo data with current timestamps
 * Sample data for testing and demonstration purposes
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

/**
 * Demo user profile data with current timestamps
 */
export const DEMO_PROFILE = {
  id: 'demo-user-001',
  name: 'John Demo',
  email: 'john.demo@example.com',
  role: 'Professional Roofer',
  joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  lastActive: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  profilePicture: null,
  company: 'Demo Roofing LLC',
  certifications: [
    'Professional Roofer Certification',
    'Safety Training Completed',
  ],
  stats: {
    totalMeasurements: 42,
    accuracyRating: 95.8,
    averageProjectSize: 2850, // sq ft
  },
} as const;

/**
 * Demo measurement history with current timestamps
 */
export const DEMO_MEASUREMENTS = [
  {
    id: 'demo-measurement-001',
    address: '123 Main Street, Anytown, CA',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    totalArea: 2450,
    status: 'completed',
    quality: 'excellent',
  },
  {
    id: 'demo-measurement-002', 
    address: '456 Oak Avenue, Somewhere, CA',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    totalArea: 1890,
    status: 'completed',
    quality: 'good',
  },
  {
    id: 'demo-measurement-003',
    address: '789 Pine Street, Anywhere, CA',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    totalArea: 3200,
    status: 'in-progress',
    quality: 'good',
  },
] as const;

/**
 * Demo notification data with current timestamps
 */
export const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-001',
    title: 'Measurement Complete',
    message: 'Your roof measurement for 123 Main Street has been processed.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    type: 'success',
    read: false,
  },
  {
    id: 'demo-notif-002',
    title: 'New Update Available',
    message: 'Version 1.1.0 includes improved AR accuracy and new export formats.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    type: 'info',
    read: true,
  },
  {
    id: 'demo-notif-003',
    title: 'Compliance Report Ready',
    message: 'Your compliance report for Project #789 is ready for download.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    type: 'info',
    read: true,
  },
] as const;

export default {
  DEMO_PROFILE,
  DEMO_MEASUREMENTS,
  DEMO_NOTIFICATIONS,
};