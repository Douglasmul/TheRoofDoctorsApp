/**
 * @fileoverview Enhanced Export Service
 * Provides professional export capabilities for measurements and projects
 * @version 1.0.0
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { RoofMeasurement, MaterialCalculation } from '../types/measurement';
import { MeasurementProject } from '../services/ProjectManagementService';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json' | 'cad' | 'image';
  includePhotos: boolean;
  includeNotes: boolean;
  includeMaterials: boolean;
  includeMetadata: boolean;
  paperSize?: 'letter' | 'a4' | 'legal';
  orientation?: 'portrait' | 'landscape';
  compression?: 'none' | 'low' | 'medium' | 'high';
  watermark?: string;
  customFields?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  metadata?: {
    exportTime: Date;
    format: string;
    itemCount: number;
    processingTime: number;
  };
}

export interface PDFExportOptions extends ExportOptions {
  template: 'standard' | 'detailed' | 'summary' | 'technical';
  includeCalculations: boolean;
  includeDiagrams: boolean;
  logoUrl?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

export interface CADExportOptions extends ExportOptions {
  cadFormat: 'dxf' | 'dwg' | 'svg';
  units: 'metric' | 'imperial';
  precision: number;
  layerStructure: 'single' | 'multiple';
  includeAnnotations: boolean;
}

export class EnhancedExportService {
  private exportHistory: Array<{
    id: string;
    timestamp: Date;
    format: string;
    fileName: string;
    fileSize: number;
    exportTime: number; // ms
  }> = [];

  /**
   * Export a single measurement
   */
  async exportMeasurement(
    measurement: RoofMeasurement, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      let result: ExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF([measurement], options as PDFExportOptions);
          break;
        case 'csv':
          result = await this.exportToCSV([measurement], options);
          break;
        case 'excel':
          result = await this.exportToExcel([measurement], options);
          break;
        case 'json':
          result = await this.exportToJSON([measurement], options);
          break;
        case 'cad':
          result = await this.exportToCAD([measurement], options as CADExportOptions);
          break;
        case 'image':
          result = await this.exportToImage([measurement], options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Record export history
      if (result.success && result.filePath) {
        this.exportHistory.push({
          id: Date.now().toString(),
          timestamp: new Date(),
          format: options.format,
          fileName: result.fileName || 'export',
          fileSize: result.fileSize || 0,
          exportTime: Date.now() - startTime,
        });
      }

      return {
        ...result,
        metadata: {
          exportTime: new Date(),
          format: options.format,
          itemCount: 1,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Export multiple measurements
   */
  async exportMeasurements(
    measurements: RoofMeasurement[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      let result: ExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(measurements, options as PDFExportOptions);
          break;
        case 'csv':
          result = await this.exportToCSV(measurements, options);
          break;
        case 'excel':
          result = await this.exportToExcel(measurements, options);
          break;
        case 'json':
          result = await this.exportToJSON(measurements, options);
          break;
        default:
          throw new Error(`Batch export not supported for format: ${options.format}`);
      }

      return {
        ...result,
        metadata: {
          exportTime: new Date(),
          format: options.format,
          itemCount: measurements.length,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Export a complete project
   */
  async exportProject(
    project: MeasurementProject, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      let result: ExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.exportProjectToPDF(project, options as PDFExportOptions);
          break;
        case 'json':
          result = await this.exportProjectToJSON(project, options);
          break;
        case 'excel':
          result = await this.exportProjectToExcel(project, options);
          break;
        default:
          // For other formats, export just the measurements
          result = await this.exportMeasurements(project.measurements, options);
      }

      return {
        ...result,
        metadata: {
          exportTime: new Date(),
          format: options.format,
          itemCount: project.measurements.length,
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Project export failed',
      };
    }
  }

  /**
   * Share exported file
   */
  async shareExport(filePath: string, title?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device.');
        return false;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: this.getMimeTypeFromPath(filePath),
        dialogTitle: title || 'Share Export',
      });
      
      return true;
    } catch (error) {
      Alert.alert('Sharing Failed', 'Could not share the exported file.');
      return false;
    }
  }

  /**
   * Get export history
   */
  getExportHistory(): Array<{
    id: string;
    timestamp: Date;
    format: string;
    fileName: string;
    fileSize: number;
    exportTime: number;
  }> {
    return [...this.exportHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Private export implementations

  private async exportToPDF(
    measurements: RoofMeasurement[], 
    options: PDFExportOptions
  ): Promise<ExportResult> {
    // In a real implementation, this would use a PDF generation library
    // like react-native-pdf-lib or generate HTML and convert to PDF
    
    const fileName = `measurements_${Date.now()}.pdf`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate PDF content (mock implementation)
    const pdfContent = this.generatePDFContent(measurements, options);
    
    // In a real implementation, you would:
    // 1. Use a PDF library to create the actual PDF
    // 2. Add images, charts, and professional formatting
    // 3. Include company branding and templates
    
    // For now, save as HTML (would be PDF in production)
    await FileSystem.writeAsStringAsync(filePath.replace('.pdf', '.html'), pdfContent);
    
    const fileInfo = await FileSystem.getInfoAsync(filePath.replace('.pdf', '.html'));
    
    return {
      success: true,
      filePath: filePath.replace('.pdf', '.html'),
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportToCSV(
    measurements: RoofMeasurement[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `measurements_${Date.now()}.csv`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate CSV content
    let csvContent = 'ID,Property,Date,Total Area (m²),Total Area (sq ft),Plane Count,Accuracy,Notes\n';
    
    measurements.forEach(measurement => {
      const totalAreaSqFt = measurement.totalArea * 10.764; // Convert m² to sq ft
      const row = [
        measurement.id,
        measurement.propertyId,
        measurement.timestamp.toISOString().split('T')[0],
        measurement.totalArea.toFixed(2),
        totalAreaSqFt.toFixed(2),
        measurement.planes.length,
        (measurement.accuracy * 100).toFixed(1) + '%',
        `"${measurement.metadata?.notes || ''}"`
      ].join(',');
      csvContent += row + '\n';
    });
    
    // Add individual plane data if requested
    if (options.includeMetadata) {
      csvContent += '\n\nDetailed Plane Data\n';
      csvContent += 'Measurement ID,Plane ID,Type,Area (m²),Area (sq ft),Pitch Angle,Confidence\n';
      
      measurements.forEach(measurement => {
        measurement.planes.forEach(plane => {
          const areaSqFt = plane.area * 10.764;
          const row = [
            measurement.id,
            plane.id,
            plane.type,
            plane.area.toFixed(2),
            areaSqFt.toFixed(2),
            plane.pitchAngle.toFixed(1),
            (plane.confidence * 100).toFixed(1) + '%'
          ].join(',');
          csvContent += row + '\n';
        });
      });
    }
    
    await FileSystem.writeAsStringAsync(filePath, csvContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    return {
      success: true,
      filePath,
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportToJSON(
    measurements: RoofMeasurement[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `measurements_${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Prepare export data
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        count: measurements.length,
        options,
      },
      measurements: measurements.map(measurement => ({
        ...measurement,
        // Convert dates to ISO strings for JSON compatibility
        timestamp: measurement.timestamp.toISOString(),
        auditTrail: measurement.auditTrail.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        })),
        exports: measurement.exports.map(exp => ({
          ...exp,
          exportedAt: exp.exportedAt.toISOString(),
          expiresAt: exp.expiresAt?.toISOString(),
        })),
      })),
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    await FileSystem.writeAsStringAsync(filePath, jsonContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    return {
      success: true,
      filePath,
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportToExcel(
    measurements: RoofMeasurement[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    // In a real implementation, this would use a library like xlsx or exceljs
    // For now, we'll create a detailed CSV that could be opened in Excel
    
    const fileName = `measurements_${Date.now()}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate Excel-compatible CSV with multiple sheets simulation
    let content = '=== SUMMARY SHEET ===\n';
    content += 'Total Measurements,Total Area (m²),Total Area (sq ft),Average Accuracy\n';
    
    const totalArea = measurements.reduce((sum, m) => sum + m.totalArea, 0);
    const totalAreaSqFt = totalArea * 10.764;
    const avgAccuracy = measurements.reduce((sum, m) => sum + m.accuracy, 0) / measurements.length;
    
    content += `${measurements.length},${totalArea.toFixed(2)},${totalAreaSqFt.toFixed(2)},${(avgAccuracy * 100).toFixed(1)}%\n\n`;
    
    content += '=== MEASUREMENTS SHEET ===\n';
    content += 'ID,Property,Date,Total Area (m²),Plane Count,Accuracy,Quality Score\n';
    
    measurements.forEach(measurement => {
      const row = [
        measurement.id,
        measurement.propertyId,
        measurement.timestamp.toISOString().split('T')[0],
        measurement.totalArea.toFixed(2),
        measurement.planes.length,
        (measurement.accuracy * 100).toFixed(1) + '%',
        measurement.qualityMetrics.overallScore.toFixed(1)
      ].join(',');
      content += row + '\n';
    });
    
    content += '\n=== PLANES SHEET ===\n';
    content += 'Measurement ID,Plane ID,Type,Area (m²),Pitch Angle,Confidence,Material\n';
    
    measurements.forEach(measurement => {
      measurement.planes.forEach(plane => {
        const row = [
          measurement.id,
          plane.id,
          plane.type,
          plane.area.toFixed(2),
          plane.pitchAngle.toFixed(1),
          (plane.confidence * 100).toFixed(1) + '%',
          plane.material || 'unknown'
        ].join(',');
        content += row + '\n';
      });
    });
    
    // Save as CSV (would be Excel format in production)
    await FileSystem.writeAsStringAsync(filePath.replace('.xlsx', '.csv'), content);
    const fileInfo = await FileSystem.getInfoAsync(filePath.replace('.xlsx', '.csv'));
    
    return {
      success: true,
      filePath: filePath.replace('.xlsx', '.csv'),
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportToCAD(
    measurements: RoofMeasurement[], 
    options: CADExportOptions
  ): Promise<ExportResult> {
    const fileName = `measurements_${Date.now()}.${options.cadFormat}`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate CAD content (mock DXF format)
    let cadContent = '';
    
    if (options.cadFormat === 'dxf') {
      cadContent = this.generateDXFContent(measurements, options);
    } else if (options.cadFormat === 'svg') {
      cadContent = this.generateSVGContent(measurements, options);
    } else {
      throw new Error(`CAD format ${options.cadFormat} not yet implemented`);
    }
    
    await FileSystem.writeAsStringAsync(filePath, cadContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    return {
      success: true,
      filePath,
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportToImage(
    measurements: RoofMeasurement[], 
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `measurements_${Date.now()}.png`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // In a real implementation, this would:
    // 1. Create a canvas or use react-native-svg to generate the image
    // 2. Draw measurement diagrams, floor plans, or 3D renderings
    // 3. Include annotations, dimensions, and branding
    
    // For now, create an SVG and save it
    const svgContent = this.generateMeasurementDiagram(measurements[0], options);
    
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    await FileSystem.writeAsStringAsync(filePath.replace('.png', '.svg'), svgContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath.replace('.png', '.svg'));
    
    return {
      success: true,
      filePath: filePath.replace('.png', '.svg'),
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportProjectToPDF(
    project: MeasurementProject, 
    options: PDFExportOptions
  ): Promise<ExportResult> {
    const fileName = `project_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    // Ensure export directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate comprehensive project report
    const pdfContent = this.generateProjectPDFContent(project, options);
    
    // Save as HTML (would be PDF in production)
    await FileSystem.writeAsStringAsync(filePath.replace('.pdf', '.html'), pdfContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath.replace('.pdf', '.html'));
    
    return {
      success: true,
      filePath: filePath.replace('.pdf', '.html'),
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportProjectToJSON(
    project: MeasurementProject, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `project_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        projectId: project.id,
        projectName: project.name,
        options,
      },
      project: {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        scheduledDate: project.scheduledDate?.toISOString(),
        startedAt: project.startedAt?.toISOString(),
        completedAt: project.completedAt?.toISOString(),
        notes: project.notes.map(note => ({
          ...note,
          timestamp: note.timestamp.toISOString(),
        })),
        attachments: project.attachments.map(att => ({
          ...att,
          uploadedAt: att.uploadedAt.toISOString(),
        })),
        photos: project.photos.map(photo => ({
          ...photo,
          takenAt: photo.takenAt.toISOString(),
        })),
      },
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    await FileSystem.writeAsStringAsync(filePath, jsonContent);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    return {
      success: true,
      filePath,
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  private async exportProjectToExcel(
    project: MeasurementProject, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const fileName = `project_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}exports/${fileName}`;
    
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}exports/`, { intermediates: true });
    
    // Generate multi-sheet Excel report
    let content = '=== PROJECT OVERVIEW ===\n';
    content += 'Field,Value\n';
    content += `Project Name,"${project.name}"\n`;
    content += `Status,${project.status}\n`;
    content += `Priority,${project.priority}\n`;
    content += `Created,${project.createdAt.toISOString().split('T')[0]}\n`;
    content += `Measurements,${project.measurements.length}\n`;
    content += `Total Area,"${project.measurements.reduce((sum, m) => sum + m.totalArea, 0).toFixed(2)} m²"\n`;
    content += `Notes Count,${project.notes.length}\n`;
    content += `Photos Count,${project.photos.length}\n\n`;
    
    // Add measurements data
    content += '=== MEASUREMENTS ===\n';
    content += await this.exportToCSV(project.measurements, options).then(result => {
      return `See measurements data in separate export.`;
    });
    
    // Add notes
    if (options.includeNotes && project.notes.length > 0) {
      content += '\n=== NOTES ===\n';
      content += 'Date,Author,Type,Content\n';
      project.notes.forEach(note => {
        content += `${note.timestamp.toISOString().split('T')[0]},"${note.author}",${note.type},"${note.content.replace(/"/g, '""')}"\n`;
      });
    }
    
    // Save as CSV (would be Excel in production)
    await FileSystem.writeAsStringAsync(filePath.replace('.xlsx', '.csv'), content);
    const fileInfo = await FileSystem.getInfoAsync(filePath.replace('.xlsx', '.csv'));
    
    return {
      success: true,
      filePath: filePath.replace('.xlsx', '.csv'),
      fileName,
      fileSize: fileInfo.size || 0,
    };
  }

  // Content generation helpers

  private generatePDFContent(measurements: RoofMeasurement[], options: PDFExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Roof Measurement Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .measurement { margin: 30px 0; border: 1px solid #ddd; padding: 20px; }
            .plane { margin: 10px 0; padding: 10px; background: #f9f9f9; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background: #e8f4fd; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Roof Measurement Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            ${options.companyInfo ? `
              <div style="margin-top: 20px;">
                <strong>${options.companyInfo.name}</strong><br>
                ${options.companyInfo.address}<br>
                ${options.companyInfo.phone} | ${options.companyInfo.email}
              </div>
            ` : ''}
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Measurements:</strong> ${measurements.length}</p>
            <p><strong>Total Area:</strong> ${measurements.reduce((sum, m) => sum + m.totalArea, 0).toFixed(2)} m² 
               (${(measurements.reduce((sum, m) => sum + m.totalArea, 0) * 10.764).toFixed(2)} sq ft)</p>
            <p><strong>Average Accuracy:</strong> ${(measurements.reduce((sum, m) => sum + m.accuracy, 0) / measurements.length * 100).toFixed(1)}%</p>
          </div>
          
          ${measurements.map((measurement, index) => `
            <div class="measurement">
              <h3>Measurement ${index + 1}</h3>
              <p><strong>Property:</strong> ${measurement.propertyId}</p>
              <p><strong>Date:</strong> ${measurement.timestamp.toLocaleDateString()}</p>
              <p><strong>Total Area:</strong> ${measurement.totalArea.toFixed(2)} m² (${(measurement.totalArea * 10.764).toFixed(2)} sq ft)</p>
              <p><strong>Accuracy:</strong> ${(measurement.accuracy * 100).toFixed(1)}%</p>
              <p><strong>Quality Score:</strong> ${measurement.qualityMetrics.overallScore.toFixed(1)}/100</p>
              
              <h4>Roof Planes</h4>
              <table>
                <tr>
                  <th>Type</th>
                  <th>Area (m²)</th>
                  <th>Area (sq ft)</th>
                  <th>Pitch Angle</th>
                  <th>Confidence</th>
                </tr>
                ${measurement.planes.map(plane => `
                  <tr>
                    <td>${plane.type}</td>
                    <td>${plane.area.toFixed(2)}</td>
                    <td>${(plane.area * 10.764).toFixed(2)}</td>
                    <td>${plane.pitchAngle.toFixed(1)}°</td>
                    <td>${(plane.confidence * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `).join('')}
          
          <div style="margin-top: 50px; font-size: 12px; color: #666;">
            <p>This report was generated automatically by The Roof Doctors measurement app.</p>
            <p>For questions or support, please contact our team.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateProjectPDFContent(project: MeasurementProject, options: PDFExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Project Report: ${project.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin: 30px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Project Report</h1>
            <h2>${project.name}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h3>Project Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Status:</strong> ${project.status}<br>
                <strong>Priority:</strong> ${project.priority}<br>
                <strong>Created:</strong> ${project.createdAt.toLocaleDateString()}
              </div>
              <div class="info-item">
                <strong>Measurements:</strong> ${project.measurements.length}<br>
                <strong>Total Area:</strong> ${project.measurements.reduce((sum, m) => sum + m.totalArea, 0).toFixed(2)} m²<br>
                <strong>Notes:</strong> ${project.notes.length}
              </div>
            </div>
          </div>
          
          ${project.description ? `
            <div class="section">
              <h3>Description</h3>
              <p>${project.description}</p>
            </div>
          ` : ''}
          
          ${project.measurements.length > 0 ? `
            <div class="section">
              <h3>Measurements Summary</h3>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Area (m²)</th>
                  <th>Planes</th>
                  <th>Accuracy</th>
                </tr>
                ${project.measurements.map(measurement => `
                  <tr>
                    <td>${measurement.timestamp.toLocaleDateString()}</td>
                    <td>${measurement.totalArea.toFixed(2)}</td>
                    <td>${measurement.planes.length}</td>
                    <td>${(measurement.accuracy * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
          
          ${options.includeNotes && project.notes.length > 0 ? `
            <div class="section">
              <h3>Project Notes</h3>
              ${project.notes.map(note => `
                <div style="margin: 15px 0; padding: 10px; border-left: 3px solid #333;">
                  <strong>${note.timestamp.toLocaleDateString()}</strong> - ${note.author}<br>
                  <em>${note.type}</em><br>
                  ${note.content}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }

  private generateDXFContent(measurements: RoofMeasurement[], options: CADExportOptions): string {
    // Basic DXF file structure (simplified)
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1014
0
ENDSEC
0
SECTION
2
ENTITIES
${measurements.map(measurement => 
  measurement.planes.map(plane => 
    plane.boundaries.map((point, index) => {
      const nextPoint = plane.boundaries[(index + 1) % plane.boundaries.length];
      return `0
LINE
8
ROOFLINES
10
${point.x.toFixed(options.precision)}
20
${point.y.toFixed(options.precision)}
30
${point.z.toFixed(options.precision)}
11
${nextPoint.x.toFixed(options.precision)}
21
${nextPoint.y.toFixed(options.precision)}
31
${nextPoint.z.toFixed(options.precision)}`;
    }).join('\n')
  ).join('\n')
).join('\n')}
0
ENDSEC
0
EOF`;
  }

  private generateSVGContent(measurements: RoofMeasurement[], options: CADExportOptions): string {
    const width = 800;
    const height = 600;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .roof-outline { fill: none; stroke: #333; stroke-width: 2; }
      .roof-fill { fill: rgba(100, 150, 200, 0.3); stroke: #333; stroke-width: 1; }
      .dimension { font-family: Arial; font-size: 12px; fill: #666; }
    </style>
  </defs>
  
  <g transform="translate(50, 50)">
    ${measurements.map((measurement, mIndex) => 
      measurement.planes.map((plane, pIndex) => {
        const color = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][pIndex % 5];
        const points = plane.boundaries.map(point => 
          `${point.x * 10},${point.y * 10}`
        ).join(' ');
        
        return `
          <polygon points="${points}" class="roof-fill" fill="${color}" opacity="0.5"/>
          <polygon points="${points}" class="roof-outline"/>
          <text x="${plane.boundaries[0].x * 10}" y="${plane.boundaries[0].y * 10 - 5}" class="dimension">
            ${plane.type} - ${plane.area.toFixed(1)} m²
          </text>
        `;
      }).join('')
    ).join('')}
  </g>
  
  <text x="20" y="30" style="font-family: Arial; font-size: 16px; font-weight: bold;">
    Roof Measurement Export - ${new Date().toLocaleDateString()}
  </text>
</svg>`;
  }

  private generateMeasurementDiagram(measurement: RoofMeasurement, options: ExportOptions): string {
    return this.generateSVGContent([measurement], options as CADExportOptions);
  }

  private getMimeTypeFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dxf: 'application/dxf',
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      html: 'text/html',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

// Singleton instance
export const enhancedExportService = new EnhancedExportService();