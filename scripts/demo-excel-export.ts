import { ExcelExporter } from '../lib/ExcelExporter.js';
import { DataMapper } from '../lib/DataMapper.js';

/**
 * Demonstration of the TypeScript class-based Excel export system
 * This script shows the architecture and usage patterns without requiring actual files
 */
async function demonstrateExcelExport() {
  console.log('🚀 Demonstrating TypeScript Class-Based Excel Export System');
  console.log('=' .repeat(60));

  try {
    // 1. Initialize Data Mapper
    console.log('\n📊 Step 1: Initializing Data Mapper');
    const dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    console.log('✅ Subject mappings loaded:', Object.keys(mappings.subjectMapping).length, 'subjects');
    console.log('✅ Lecturer mappings loaded:', Object.keys(mappings.lecturerMapping).length, 'lecturers');
    console.log('✅ Location mappings loaded:', Object.keys(mappings.locationMapping).length, 'locations');

    // 2. Create Excel Exporter with Configuration
    console.log('\n📋 Step 2: Creating Excel Exporter');
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

    console.log('✅ Excel Exporter configured with custom settings');

    // 3. Set Data Mappings
    console.log('\n🔗 Step 3: Setting Data Mappings');
    exporter.setSubjectMapping(mappings.subjectMapping);
    exporter.setLecturerMapping(mappings.lecturerMapping);
    exporter.setLocationMapping(mappings.locationMapping);

    console.log('✅ Data mappings applied to exporter');

    // 4. Demonstrate Configuration
    console.log('\n⚙️  Step 4: Configuration Overview');
    console.log('Template Path:', 'excel_export/template.xlsx');
    console.log('Output Path:', 'excel_export/output_ts.xlsx');
    console.log('Data Path:', 'excel_export/data.json');
    console.log('Time Slots:', ['S', 'C', 'T']);
    console.log('Day Column:', 'A');
    console.log('Time Slot Column:', 'B');

    // 5. Show Sample Data Processing
    console.log('\n📈 Step 5: Sample Data Processing');
    const sampleData = [
      {
        week: 1,
        teamId: 1,
        subjectId: 16,
        date: "2025-09-01",
        dayOfWeek: "Mon",
        session: "morning",
        lecturerId: null,
        locationId: null
      },
      {
        week: 1,
        teamId: 1,
        subjectId: 1,
        date: "2025-09-01",
        dayOfWeek: "Mon",
        session: "afternoon",
        lecturerId: 1,
        locationId: 1
      }
    ];

    console.log('Sample data entries:', sampleData.length);
    console.log('Date range:', sampleData[0].date, 'to', sampleData[sampleData.length - 1].date);

    // 6. Demonstrate Data Mapping
    console.log('\n🔄 Step 6: Data Mapping Demonstration');
    sampleData.forEach((entry, index) => {
      const subjectName = mappings.subjectMapping[entry.subjectId] || `Subject ${entry.subjectId}`;
      const lecturerName = entry.lecturerId ? 
        (mappings.lecturerMapping[entry.lecturerId] || `Lecturer ${entry.lecturerId}`) : 
        'TBD';
      const locationName = entry.locationId ? 
        (mappings.locationMapping[entry.locationId] || `Location ${entry.locationId}`) : 
        'TBD';

      console.log(`Entry ${index + 1}:`);
      console.log(`  Subject: ${entry.subjectId} → ${subjectName}`);
      console.log(`  Lecturer: ${entry.lecturerId} → ${lecturerName}`);
      console.log(`  Location: ${entry.locationId} → ${locationName}`);
      console.log(`  Session: ${entry.session} (${entry.dayOfWeek})`);
    });

    // 7. Show Export Process Steps
    console.log('\n📝 Step 7: Export Process Overview');
    console.log('1. Read JSON data from file');
    console.log('2. Load Excel template');
    console.log('3. Fill days and time slots');
    console.log('4. Fill period data (subjects, lecturers, locations)');
    console.log('5. Save workbook to file');

    console.log('\n✅ Demonstration completed successfully!');
    console.log('\n🎯 Key Benefits of the TypeScript Implementation:');
    console.log('• Type safety with compile-time error checking');
    console.log('• Object-oriented design with clear separation of concerns');
    console.log('• Configurable and extensible architecture');
    console.log('• Comprehensive error handling');
    console.log('• Easy testing and maintenance');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  }
}

/**
 * Show advanced usage patterns
 */
function demonstrateAdvancedUsage() {
  console.log('\n🔧 Advanced Usage Patterns');
  console.log('=' .repeat(40));

  // Custom configuration
  const customExporter = new ExcelExporter({
    templatePath: 'custom_template.xlsx',
    outputPath: 'custom_output.xlsx',
    dataPath: 'custom_data.json',
    timeSlots: ['Morning', 'Afternoon', 'Evening'],
    dayColumn: 'A',
    timeSlotColumn: 'B',
    firstTimeSlotRow: 5,
    rowPerTimeSlot: 2
  });

  console.log('✅ Custom exporter created with different time slots and layout');

  // Step-by-step process
  console.log('\n📋 Step-by-Step Process Available:');
  console.log('• await exporter.readData()');
  console.log('• await exporter.loadTemplate()');
  console.log('• exporter.fillDays()');
  console.log('• exporter.fillPeriodData()');
  console.log('• await exporter.saveWorkbook()');
}

// Run demonstration
demonstrateExcelExport().then(() => {
  demonstrateAdvancedUsage();
}).catch(console.error);

export { demonstrateExcelExport, demonstrateAdvancedUsage }; 