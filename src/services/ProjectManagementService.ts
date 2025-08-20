/**
 * @fileoverview Project Management Service
 * Handles multiple measurement jobs, client details, and project organization
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoofMeasurement, MaterialCalculation } from '../types/measurement';

export interface ProjectClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectProperty {
  id: string;
  clientId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  type: 'residential' | 'commercial' | 'industrial' | 'other';
  yearBuilt?: number;
  stories: number;
  roofType: 'gable' | 'hip' | 'flat' | 'mansard' | 'gambrel' | 'shed' | 'complex';
  currentMaterial?: string;
  notes?: string;
  images?: string[]; // URIs to property images
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementProject {
  id: string;
  name: string;
  clientId: string;
  propertyId: string;
  status: 'planning' | 'in_progress' | 'measuring' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  measurements: RoofMeasurement[];
  materialCalculations?: MaterialCalculation[];
  
  // Project timeline
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Weather and conditions
  weatherConditions?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    conditions: string;
    visibility: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // Project team
  assignedTo?: string; // User ID
  teamMembers?: string[]; // User IDs
  
  // Documentation
  notes: ProjectNote[];
  attachments: ProjectAttachment[];
  photos: ProjectPhoto[];
  
  // Quality and compliance
  qualityScore?: number;
  complianceChecks?: ComplianceCheck[];
  
  // Financial
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  
  // Export and sharing
  exports: ProjectExport[];
  sharedWith?: string[]; // Email addresses
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
}

export interface ProjectNote {
  id: string;
  timestamp: Date;
  author: string;
  content: string;
  type: 'general' | 'measurement' | 'issue' | 'reminder' | 'client_communication';
  isPrivate: boolean;
}

export interface ProjectAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uri: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  tags: string[];
}

export interface ProjectPhoto {
  id: string;
  uri: string;
  thumbnail?: string;
  fileName: string;
  fileSize: number;
  takenAt: Date;
  takenBy: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  tags: string[];
  isBeforePhoto: boolean;
  isAfterPhoto: boolean;
}

export interface ComplianceCheck {
  id: string;
  standard: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  checkedAt?: Date;
  checkedBy?: string;
  notes?: string;
  evidence?: string[]; // URIs to supporting documents
}

export interface ProjectExport {
  id: string;
  format: 'pdf' | 'csv' | 'json' | 'image' | 'cad' | 'excel';
  fileName: string;
  fileSize: number;
  uri?: string;
  exportedAt: Date;
  exportedBy: string;
  includePhotos: boolean;
  includeNotes: boolean;
  includeMaterials: boolean;
  customOptions: Record<string, any>;
  downloadCount: number;
  expiresAt?: Date;
}

export interface ProjectFilter {
  status?: MeasurementProject['status'][];
  priority?: MeasurementProject['priority'][];
  clientId?: string;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
    field: 'createdAt' | 'scheduledDate' | 'completedAt';
  };
  tags?: string[];
  searchQuery?: string;
  propertyType?: ProjectProperty['type'][];
  sortBy?: 'createdAt' | 'updatedAt' | 'scheduledDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectStatistics {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
  totalArea: number;
  averageProjectDuration: number; // hours
  totalRevenue?: number;
  clientCount: number;
  propertyCount: number;
  measurementCount: number;
}

export class ProjectManagementService {
  private static readonly PROJECTS_KEY = 'measurement_projects';
  private static readonly CLIENTS_KEY = 'project_clients';
  private static readonly PROPERTIES_KEY = 'project_properties';
  
  private projects: MeasurementProject[] = [];
  private clients: ProjectClient[] = [];
  private properties: ProjectProperty[] = [];
  private listeners: Array<() => void> = [];

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadProjects(),
      this.loadClients(),
      this.loadProperties(),
    ]);
  }

  /**
   * Create a new client
   */
  async createClient(clientData: Omit<ProjectClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectClient> {
    const client: ProjectClient = {
      ...clientData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clients.push(client);
    await this.saveClients();
    this.notifyListeners();

    return client;
  }

  /**
   * Update a client
   */
  async updateClient(clientId: string, updates: Partial<ProjectClient>): Promise<boolean> {
    const index = this.clients.findIndex(c => c.id === clientId);
    if (index === -1) return false;

    this.clients[index] = {
      ...this.clients[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveClients();
    this.notifyListeners();
    return true;
  }

  /**
   * Get all clients
   */
  getClients(): ProjectClient[] {
    return [...this.clients];
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): ProjectClient | null {
    return this.clients.find(c => c.id === clientId) || null;
  }

  /**
   * Create a new property
   */
  async createProperty(propertyData: Omit<ProjectProperty, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectProperty> {
    const property: ProjectProperty = {
      ...propertyData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.properties.push(property);
    await this.saveProperties();
    this.notifyListeners();

    return property;
  }

  /**
   * Get properties for a client
   */
  getClientProperties(clientId: string): ProjectProperty[] {
    return this.properties.filter(p => p.clientId === clientId);
  }

  /**
   * Create a new measurement project
   */
  async createProject(projectData: Omit<MeasurementProject, 'id' | 'createdAt' | 'updatedAt' | 'measurements' | 'notes' | 'attachments' | 'photos' | 'exports'>): Promise<MeasurementProject> {
    const project: MeasurementProject = {
      ...projectData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      measurements: [],
      notes: [],
      attachments: [],
      photos: [],
      exports: [],
    };

    this.projects.push(project);
    await this.saveProjects();
    this.notifyListeners();

    return project;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, updates: Partial<MeasurementProject>): Promise<boolean> {
    const index = this.projects.findIndex(p => p.id === projectId);
    if (index === -1) return false;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveProjects();
    this.notifyListeners();
    return true;
  }

  /**
   * Get all projects with optional filtering
   */
  getProjects(filter?: ProjectFilter): MeasurementProject[] {
    let filtered = [...this.projects];

    if (filter) {
      if (filter.status) {
        filtered = filtered.filter(p => filter.status!.includes(p.status));
      }
      
      if (filter.priority) {
        filtered = filtered.filter(p => filter.priority!.includes(p.priority));
      }
      
      if (filter.clientId) {
        filtered = filtered.filter(p => p.clientId === filter.clientId);
      }
      
      if (filter.assignedTo) {
        filtered = filtered.filter(p => p.assignedTo === filter.assignedTo);
      }
      
      if (filter.dateRange) {
        const { start, end, field } = filter.dateRange;
        filtered = filtered.filter(p => {
          const date = p[field];
          return date && date >= start && date <= end;
        });
      }
      
      if (filter.tags) {
        filtered = filtered.filter(p => 
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }
      
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Sort results
      if (filter.sortBy) {
        filtered.sort((a, b) => {
          const aVal = a[filter.sortBy!];
          const bVal = b[filter.sortBy!];
          
          if (aVal instanceof Date && bVal instanceof Date) {
            return filter.sortOrder === 'desc' ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime();
          }
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return filter.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          }
          
          return 0;
        });
      }
    }

    return filtered;
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): MeasurementProject | null {
    return this.projects.find(p => p.id === projectId) || null;
  }

  /**
   * Add measurement to project
   */
  async addMeasurementToProject(projectId: string, measurement: RoofMeasurement): Promise<boolean> {
    const project = this.getProject(projectId);
    if (!project) return false;

    project.measurements.push(measurement);
    project.updatedAt = new Date();
    
    // Update status if this is the first measurement
    if (project.status === 'planning' || project.status === 'in_progress') {
      project.status = 'measuring';
    }

    await this.saveProjects();
    this.notifyListeners();
    return true;
  }

  /**
   * Add note to project
   */
  async addNote(projectId: string, note: Omit<ProjectNote, 'id' | 'timestamp'>): Promise<boolean> {
    const project = this.getProject(projectId);
    if (!project) return false;

    const newNote: ProjectNote = {
      ...note,
      id: this.generateId(),
      timestamp: new Date(),
    };

    project.notes.push(newNote);
    project.updatedAt = new Date();

    await this.saveProjects();
    this.notifyListeners();
    return true;
  }

  /**
   * Add photo to project
   */
  async addPhoto(projectId: string, photo: Omit<ProjectPhoto, 'id'>): Promise<boolean> {
    const project = this.getProject(projectId);
    if (!project) return false;

    const newPhoto: ProjectPhoto = {
      ...photo,
      id: this.generateId(),
    };

    project.photos.push(newPhoto);
    project.updatedAt = new Date();

    await this.saveProjects();
    this.notifyListeners();
    return true;
  }

  /**
   * Get project statistics
   */
  getStatistics(): ProjectStatistics {
    const now = new Date();
    
    return {
      totalProjects: this.projects.length,
      completedProjects: this.projects.filter(p => p.status === 'completed').length,
      inProgressProjects: this.projects.filter(p => 
        ['in_progress', 'measuring', 'review'].includes(p.status)
      ).length,
      overdueProjects: this.projects.filter(p => 
        p.scheduledDate && p.scheduledDate < now && p.status !== 'completed'
      ).length,
      totalArea: this.projects.reduce((sum, p) => 
        sum + p.measurements.reduce((measureSum, m) => measureSum + m.totalArea, 0), 0
      ),
      averageProjectDuration: this.calculateAverageProjectDuration(),
      totalRevenue: this.projects.reduce((sum, p) => sum + (p.actualCost || 0), 0),
      clientCount: this.clients.length,
      propertyCount: this.properties.length,
      measurementCount: this.projects.reduce((sum, p) => sum + p.measurements.length, 0),
    };
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
   * Export project data
   */
  async exportProject(projectId: string, format: ProjectExport['format'], options: Partial<ProjectExport>): Promise<string | null> {
    const project = this.getProject(projectId);
    if (!project) return null;

    const exportRecord: ProjectExport = {
      id: this.generateId(),
      format,
      fileName: `${project.name}_${format}_${new Date().toISOString().split('T')[0]}.${format}`,
      fileSize: 0, // Would be calculated after generation
      exportedAt: new Date(),
      exportedBy: 'current_user', // Would get from auth context
      includePhotos: options.includePhotos || false,
      includeNotes: options.includeNotes || false,
      includeMaterials: options.includeMaterials || false,
      customOptions: options.customOptions || {},
      downloadCount: 0,
      ...options,
    };

    project.exports.push(exportRecord);
    await this.saveProjects();

    // In a real implementation, this would generate the actual file
    // and return the file URI or download URL
    return `file://exports/${exportRecord.fileName}`;
  }

  // Private methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private async loadProjects(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(ProjectManagementService.PROJECTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.projects = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : undefined,
          startedAt: p.startedAt ? new Date(p.startedAt) : undefined,
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
        }));
      }
    } catch (error) {
      console.warn('Failed to load projects:', error);
    }
  }

  private async saveProjects(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ProjectManagementService.PROJECTS_KEY,
        JSON.stringify(this.projects)
      );
    } catch (error) {
      console.warn('Failed to save projects:', error);
    }
  }

  private async loadClients(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(ProjectManagementService.CLIENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.clients = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      }
    } catch (error) {
      console.warn('Failed to load clients:', error);
    }
  }

  private async saveClients(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ProjectManagementService.CLIENTS_KEY,
        JSON.stringify(this.clients)
      );
    } catch (error) {
      console.warn('Failed to save clients:', error);
    }
  }

  private async loadProperties(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(ProjectManagementService.PROPERTIES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.properties = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      }
    } catch (error) {
      console.warn('Failed to load properties:', error);
    }
  }

  private async saveProperties(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ProjectManagementService.PROPERTIES_KEY,
        JSON.stringify(this.properties)
      );
    } catch (error) {
      console.warn('Failed to save properties:', error);
    }
  }

  private calculateAverageProjectDuration(): number {
    const completedProjects = this.projects.filter(p => 
      p.status === 'completed' && p.startedAt && p.completedAt
    );

    if (completedProjects.length === 0) return 0;

    const totalDuration = completedProjects.reduce((sum, p) => {
      const duration = p.completedAt!.getTime() - p.startedAt!.getTime();
      return sum + (duration / (1000 * 60 * 60)); // Convert to hours
    }, 0);

    return totalDuration / completedProjects.length;
  }
}

// Singleton instance
export const projectManagementService = new ProjectManagementService();