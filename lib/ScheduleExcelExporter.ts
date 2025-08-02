import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { ScheduleData } from '../types/ExcelExportTypes';

export interface ScheduleExcelConfig {
  templatePath?: string;
  outputPath: string;
  dataPath?: string;
  worksheetIndex?: number;
  teams?: string[];
  dateFormat?: string;
}

export class ScheduleExcelExporter {
  private config: Required<ScheduleExcelConfig>;
  private workbook: ExcelJS.Workbook | null = null;
  private worksheet: ExcelJS.Worksheet | null = null;
  private data: ScheduleData[] = [];

  constructor(config: ScheduleExcelConfig) {
    this.config = {
      templatePath: 'excel_export/template.xlsx',
      dataPath: 'excel_export/data.json',
      worksheetIndex: 1,
      teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)'],
      dateFormat: 'dd/MM/yyyy',
      ...config
    };
  }

  /**
   * Read JSON data from file or use provided data
   */
  async readData(data?: ScheduleData[]): Promise<ScheduleData[]> {
    if (data) {
      this.data = data;
      return this.data;
    }

    try {
      const jsonString = await fs.readFile(this.config.dataPath, 'utf8');
      this.data = JSON.parse(jsonString);
      return this.data;
    } catch (error) {
      console.error('Error reading JSON file:', error);
      throw new Error(`Failed to read data file: ${this.config.dataPath}`);
    }
  }

  /**
   * Create a new workbook or load template
   */
  async createWorkbook(): Promise<void> {
    try {
      this.workbook = new ExcelJS.Workbook();
      
      // Try to load template if exists
      try {
        await this.workbook.xlsx.readFile(this.config.templatePath);
        this.worksheet = this.workbook.getWorksheet(this.config.worksheetIndex);
      } catch (error) {
        // If template doesn't exist, create new worksheet
        this.worksheet = this.workbook.addWorksheet('Schedule');
      }
      
      if (!this.worksheet) {
        throw new Error(`Worksheet at index ${this.config.worksheetIndex} not found`);
      }
    } catch (error) {
      console.error('Error creating workbook:', error);
      throw new Error('Failed to create workbook');
    }
  }

  /**
   * Map session to Vietnamese abbreviation
   */
  private mapSessionToVietnamese(session: string): string {
    const sessionMap: Record<string, string> = {
      'morning': 'S',
      'afternoon': 'C',
      'evening': 'T'
    };
    return sessionMap[session] || session;
  }

  /**
   * Format date to Vietnamese format
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Create header row with team names
   */
  private createHeader(): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }

    // Set header row
    const headerRow = this.worksheet.getRow(1);
    headerRow.getCell('A').value = 'Ngày';
    headerRow.getCell('B').value = 'Buổi';
    
    // Add team columns
    this.config.teams.forEach((team, index) => {
      const column = String.fromCharCode(67 + index); // C, D, E, F, G, H, I
      headerRow.getCell(column).value = team;
    });

    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  /**
   * Group data by date and session
   */
  private groupDataByDateAndSession(): Record<string, Record<string, ScheduleData[]>> {
    const grouped: Record<string, Record<string, ScheduleData[]>> = {};

    this.data.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = {};
      }
      if (!grouped[item.date][item.session]) {
        grouped[item.date][item.session] = [];
      }
      grouped[item.date][item.session].push(item);
    });

    return grouped;
  }

  /**
   * Fill schedule data into worksheet
   */
  private fillScheduleData(): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }

    const groupedData = this.groupDataByDateAndSession();
    const dates = Object.keys(groupedData).sort();
    let currentRow = 2; // Start after header

    dates.forEach((date, dateIndex) => {
      const sessions = ['morning', 'afternoon', 'evening'];
      let isFirstSession = true;

      sessions.forEach((session, sessionIndex) => {
        const row = this.worksheet!.getRow(currentRow);
        const sessionData = groupedData[date]?.[session] || [];

        // Fill date (only for first session of the day)
        if (isFirstSession) {
          row.getCell('A').value = this.formatDate(date);
          row.getCell('A').alignment = { vertical: 'middle' };
        }

        // Fill session
        row.getCell('B').value = this.mapSessionToVietnamese(session);

        // Fill team data
        this.config.teams.forEach((team, teamIndex) => {
          const column = String.fromCharCode(67 + teamIndex); // C, D, E, F, G, H, I
          const cell = row.getCell(column);
          
          // Find data for this team
          const teamData = sessionData.find(item => item.teamId === teamIndex + 1);
          
          if (teamData) {
            // For now, just show subject ID as requested
            cell.value = `Subject ${teamData.subjectId}`;
          } else {
            // Default value for empty slots
            if (session === 'evening') {
              cell.value = 'Tự học';
            } else {
              cell.value = '';
            }
          }
        });

        // Style the row
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        currentRow++;
        isFirstSession = false;
      });

      // Add separator row between days (except for last day)
      if (dateIndex < dates.length - 1) {
        const separatorRow = this.worksheet.getRow(currentRow);
        separatorRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        currentRow++;
      }
    });
  }

  /**
   * Auto-adjust column widths
   */
  private adjustColumnWidths(): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }

    // Set specific widths for better formatting
    this.worksheet.getColumn('A').width = 12; // Date column
    this.worksheet.getColumn('B').width = 8;  // Session column
    
    // Team columns
    this.config.teams.forEach((_, index) => {
      const column = String.fromCharCode(67 + index);
      this.worksheet!.getColumn(column).width = 15;
    });
  }

  /**
   * Export schedule to Excel
   */
  async export(data?: ScheduleData[]): Promise<void> {
    try {
      console.log('Starting schedule Excel export...');
      
      // Read data
      await this.readData(data);
      console.log(`Loaded ${this.data.length} schedule entries`);
      
      // Create workbook
      await this.createWorkbook();
      console.log('Workbook created successfully');
      
      // Create header
      this.createHeader();
      console.log('Header created');
      
      // Fill schedule data
      this.fillScheduleData();
      console.log('Schedule data filled');
      
      // Adjust column widths
      this.adjustColumnWidths();
      console.log('Column widths adjusted');
      
      // Save workbook
      await this.saveWorkbook();
      console.log('Export completed successfully');
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Save workbook to file
   */
  async saveWorkbook(): Promise<void> {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }

    try {
      await this.workbook.xlsx.writeFile(this.config.outputPath);
      console.log(`Excel file saved successfully: ${this.config.outputPath}`);
    } catch (error) {
      console.error('Error saving Excel file:', error);
      throw new Error(`Failed to save Excel file: ${this.config.outputPath}`);
    }
  }

  /**
   * Export to buffer (useful for API responses)
   */
  async exportToBuffer(data?: ScheduleData[]): Promise<Buffer> {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }

    try {
      // Read data if provided
      if (data) {
        await this.readData(data);
      }

      // Create workbook if not already created
      if (!this.worksheet) {
        await this.createWorkbook();
        this.createHeader();
        this.fillScheduleData();
        this.adjustColumnWidths();
      }

      return await this.workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Error creating buffer:', error);
      throw new Error('Failed to create Excel buffer');
    }
  }

  /**
   * Get the current worksheet for advanced operations
   */
  getWorksheet(): ExcelJS.Worksheet {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }
    return this.worksheet;
  }

  /**
   * Get the current workbook for advanced operations
   */
  getWorkbook(): ExcelJS.Workbook {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    return this.workbook;
  }
} 