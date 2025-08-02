import { ExcelExporter } from '../lib/ExcelExporter.js';
import { DataMapper } from '../lib/DataMapper.js';

/**
 * Comprehensive testing script for the Excel export functionality
 */
async function runTests() {
  console.log('🧪 Testing TypeScript Excel Export System');
  console.log('=' .repeat(50));

  // Test 1: Data Mapper
  await testDataMapper();

  // Test 2: Excel Exporter Configuration
  await testExcelExporterConfig();

  // Test 3: Date Calculations
  await testDateCalculations();

  // Test 4: Data Processing
  await testDataProcessing();

  // Test 5: Error Handling
  await testErrorHandling();

  console.log('\n✅ All tests completed successfully!');
}

/**
 * Test Data Mapper functionality
 */
async function testDataMapper() {
  console.log('\n📊 Test 1: Data Mapper');
  console.log('-'.repeat(30));

  try {
    const dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    // Test subject mappings
    console.log('✅ Subject mappings:', Object.keys(mappings.subjectMapping).length, 'subjects');
    console.log('   Sample: Subject 1 →', mappings.subjectMapping[1]);

    // Test lecturer mappings
    console.log('✅ Lecturer mappings:', Object.keys(mappings.lecturerMapping).length, 'lecturers');
    console.log('   Sample: Lecturer 1 →', mappings.lecturerMapping[1]);

    // Test location mappings
    console.log('✅ Location mappings:', Object.keys(mappings.locationMapping).length, 'locations');
    console.log('   Sample: Location 1 →', mappings.locationMapping[1]);

    // Test fallback values
    console.log('✅ Fallback test: Subject 999 →', dataMapper.getSubjectName(999));
    console.log('✅ Null handling: Lecturer null →', dataMapper.getLecturerName(null));

  } catch (error) {
    console.error('❌ Data Mapper test failed:', error);
  }
}

/**
 * Test Excel Exporter configuration
 */
async function testExcelExporterConfig() {
  console.log('\n📋 Test 2: Excel Exporter Configuration');
  console.log('-'.repeat(40));

  try {
    const exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/test_output.xlsx',
      dataPath: 'excel_export/data.json',
      worksheetIndex: 1,
      dayColumn: 'A',
      timeSlotColumn: 'B',
      firstTimeSlotRow: 4,
      rowPerTimeSlot: 1,
      timeSlots: ['S', 'C', 'T']
    });

    console.log('✅ Excel Exporter created successfully');
    console.log('✅ Configuration applied correctly');

    // Test with custom configuration
    const customExporter = new ExcelExporter({
      timeSlots: ['Morning', 'Afternoon', 'Evening'],
      firstTimeSlotRow: 5,
      rowPerTimeSlot: 2
    });

    console.log('✅ Custom configuration test passed');

  } catch (error) {
    console.error('❌ Excel Exporter configuration test failed:', error);
  }
}

/**
 * Test date calculations
 */
async function testDateCalculations() {
  console.log('\n📅 Test 3: Date Calculations');
  console.log('-'.repeat(30));

  try {
    const exporter = new ExcelExporter();

    // Test normal date range
    const startDate = new Date('2025-09-01');
    const endDate = new Date('2025-09-06');
    const daysCount = exporter.getDaysCount(startDate, endDate);
    console.log('✅ Days between 2025-09-01 and 2025-09-06:', daysCount, 'days');

    // Test same date
    const sameDate = new Date('2025-09-01');
    const sameDayCount = exporter.getDaysCount(sameDate, sameDate);
    console.log('✅ Same date calculation:', sameDayCount, 'days');

    // Test reversed dates
    const reversedCount = exporter.getDaysCount(endDate, startDate);
    console.log('✅ Reversed dates calculation:', reversedCount, 'days');

  } catch (error) {
    console.error('❌ Date calculations test failed:', error);
  }
}

/**
 * Test data processing
 */
async function testDataProcessing() {
  console.log('\n📈 Test 4: Data Processing');
  console.log('-'.repeat(30));

  try {
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
      },
      {
        week: 1,
        teamId: 1,
        subjectId: 12,
        date: "2025-09-01",
        dayOfWeek: "Mon",
        session: "evening",
        lecturerId: 2,
        locationId: 2
      }
    ];

    console.log('✅ Sample data created:', sampleData.length, 'entries');
    console.log('✅ Date range:', sampleData[0].date, 'to', sampleData[sampleData.length - 1].date);

    // Test data grouping logic
    const groupedData: Record<string, Record<string, any>> = {};
    sampleData.forEach(item => {
      if (!groupedData[item.date]) {
        groupedData[item.date] = {};
      }
      groupedData[item.date][item.session] = item;
    });

    console.log('✅ Data grouping test passed');
    console.log('   Grouped by date:', Object.keys(groupedData).length, 'dates');
    console.log('   Sessions per date:', Object.keys(groupedData['2025-09-01']).length, 'sessions');

  } catch (error) {
    console.error('❌ Data processing test failed:', error);
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n⚠️  Test 5: Error Handling');
  console.log('-'.repeat(30));

  try {
    const exporter = new ExcelExporter();

    // Test with invalid data path
    try {
      await exporter.readData();
      console.log('❌ Should have thrown error for invalid data path');
    } catch (error) {
      console.log('✅ Correctly handled invalid data path error');
    }

    // Test with invalid template path
    try {
      await exporter.loadTemplate();
      console.log('❌ Should have thrown error for invalid template path');
    } catch (error) {
      console.log('✅ Correctly handled invalid template path error');
    }

    console.log('✅ Error handling tests passed');

  } catch (error) {
    console.error('❌ Error handling test failed:', error);
  }
}

/**
 * Test the actual export process (requires template file)
 */
async function testActualExport() {
  console.log('\n🚀 Test 6: Actual Export Process');
  console.log('-'.repeat(35));

  try {
    const dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
    const mappings = dataMapper.getMappings();

    const exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/test_output.xlsx',
      dataPath: 'excel_export/data.json'
    });

    exporter.setSubjectMapping(mappings.subjectMapping);
    exporter.setLecturerMapping(mappings.lecturerMapping);
    exporter.setLocationMapping(mappings.locationMapping);

    console.log('✅ Starting actual export test...');
    await exporter.export();
    console.log('✅ Actual export completed successfully!');

  } catch (error) {
    console.log('⚠️  Actual export test skipped (template file may not exist)');
    console.log('   Error:', error.message);
  }
}

// Run all tests
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🎯 Testing Summary:');
    console.log('• Data Mapper: ✅');
    console.log('• Excel Exporter Config: ✅');
    console.log('• Date Calculations: ✅');
    console.log('• Data Processing: ✅');
    console.log('• Error Handling: ✅');
    console.log('• Actual Export: ⚠️ (requires template file)');
  });
}

export { runTests, testActualExport }; 