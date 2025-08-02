import { ExcelExporter } from '../lib/ExcelExporter.js';
import { DataMapper } from '../lib/DataMapper.js';

/**
 * Main function to export schedule data to Excel
 */
async function exportScheduleToExcel(): Promise<void> {
  try {
    console.log('🚀 Starting schedule export to Excel...');

    // Initialize data mapper and load static mappings
    const dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    // Initialize Excel exporter with custom configuration
    const exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/output_ts.xlsx',
      dataPath: 'excel_export/data.json',
      worksheetIndex: 1,
      dayColumn: 'A',
      timeSlotColumn: 'B',
      firstTimeSlotRow: 4,
      rowPerTimeSlot: 1,
      timeSlots: ['S', 'C', 'T']
    });

    // Set mappings for subject, lecturer, and location names
    exporter.setSubjectMapping(mappings.subjectMapping);
    exporter.setLecturerMapping(mappings.lecturerMapping);
    exporter.setLocationMapping(mappings.locationMapping);

    // Perform the export
    await exporter.export();

    console.log('✅ Excel export completed successfully!');
    console.log(`📁 Output file: excel_export/output_ts.xlsx`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

/**
 * Advanced usage example with custom configuration
 */
async function exportWithCustomConfig(): Promise<void> {
  try {
    console.log('🚀 Starting custom export...');

    const dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    // Create exporter with custom configuration
    const exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/custom_output.xlsx',
      dataPath: 'excel_export/data.json',
      worksheetIndex: 1,
      dayColumn: 'A',
      timeSlotColumn: 'B',
      firstTimeSlotRow: 4,
      rowPerTimeSlot: 1,
      timeSlots: ['S', 'C', 'T']
    });

    // Set mappings
    exporter.setSubjectMapping(mappings.subjectMapping);
    exporter.setLecturerMapping(mappings.lecturerMapping);
    exporter.setLocationMapping(mappings.locationMapping);

    // Step-by-step export process
    await exporter.readData();
    console.log('📊 Data loaded successfully');

    await exporter.loadTemplate();
    console.log('📋 Template loaded successfully');

    exporter.fillDays();
    console.log('📅 Days filled successfully');

    exporter.fillPeriodData();
    console.log('📚 Period data filled successfully');

    await exporter.saveWorkbook();
    console.log('💾 File saved successfully');

    console.log('✅ Custom export completed!');

  } catch (error) {
    console.error('❌ Custom export failed:', error);
    process.exit(1);
  }
}

/**
 * Example with database integration (commented out for demo)
 */
async function exportWithDatabase(): Promise<void> {
  try {
    console.log('🚀 Starting database export...');

    const dataMapper = new DataMapper();
    
    // In a real application, you would fetch data from database
    // const subjects = await prisma.subject.findMany();
    // const lecturers = await prisma.lecturer.findMany();
    // const locations = await prisma.location.findMany();
    
    // dataMapper.setSubjectMapping(dataMapper.createSubjectMapping(subjects));
    // dataMapper.setLecturerMapping(dataMapper.createLecturerMapping(lecturers));
    // dataMapper.setLocationMapping(dataMapper.createLocationMapping(locations));

    // For demo purposes, use static mappings
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    const exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/db_output.xlsx',
      dataPath: 'excel_export/data.json'
    });

    exporter.setSubjectMapping(mappings.subjectMapping);
    exporter.setLecturerMapping(mappings.lecturerMapping);
    exporter.setLocationMapping(mappings.locationMapping);

    await exporter.export();
    console.log('✅ Database export completed!');

  } catch (error) {
    console.error('❌ Database export failed:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'custom':
      exportWithCustomConfig();
      break;
    case 'db':
      exportWithDatabase();
      break;
    default:
      exportScheduleToExcel();
      break;
  }
}

export { exportScheduleToExcel, exportWithCustomConfig, exportWithDatabase }; 