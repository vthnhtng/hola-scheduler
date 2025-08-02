# Testing Guide for TypeScript Excel Export System

This guide explains how to test the TypeScript class-based Excel export functionality I created for you.

## 🧪 Testing Approaches

### 1. **Mock Testing (Recommended for Development)**

The mock testing approach allows you to test the logic without requiring actual Excel files:

```bash
# Run mock tests
node --loader ts-node/esm scripts/simple-test.ts
```

**What this tests:**
- ✅ Data Mapper functionality
- ✅ Excel Exporter configuration
- ✅ Date calculations
- ✅ Data processing logic
- ✅ Export process flow

### 2. **Unit Testing with Jest**

Run the unit tests to verify individual components:

```bash
# Run unit tests
npm test test/excel-export.test.ts
```

**What this tests:**
- ✅ DataMapper class methods
- ✅ ExcelExporter class methods
- ✅ Date calculation functions
- ✅ Error handling scenarios

### 3. **Integration Testing (Requires Template File)**

Test the complete export process with actual files:

```bash
# Run integration test
node --loader ts-node/esm scripts/excel-export.ts
```

**Requirements:**
- `excel_export/template.xlsx` file must exist
- `excel_export/data.json` file must exist
- ExcelJS library must be installed

## 🚀 How to Test Your Implementation

### **Step 1: Verify File Structure**

First, ensure you have the correct file structure:

```
hola-scheduler/
├── lib/
│   ├── ExcelExporter.ts
│   └── DataMapper.ts
├── types/
│   └── ExcelExportTypes.ts
├── scripts/
│   ├── excel-export.ts
│   ├── demo-excel-export.ts
│   └── simple-test.ts
├── test/
│   └── excel-export.test.ts
└── excel_export/
    ├── template.xlsx
    ├── data.json
    └── output.xlsx
```

### **Step 2: Run Mock Tests**

```bash
# This will test the core functionality without requiring Excel files
node --loader ts-node/esm scripts/simple-test.ts
```

**Expected Output:**
```
🧪 Testing Excel Export System (Mock Version)
==================================================

📊 Test 1: Data Mapper
✅ Subject mappings: 14 subjects
✅ Lecturer mappings: 5 lecturers
✅ Location mappings: 5 locations
✅ Fallback test: Subject 999 → Subject 999
✅ Null handling: Lecturer null → TBD

📋 Test 2: Excel Exporter Configuration
✅ Excel Exporter created successfully

📅 Test 3: Date Calculations
✅ Days between 2025-09-01 and 2025-09-06: 5 days
✅ Same date calculation: 0 days

📈 Test 4: Data Processing
✅ Sample data loaded: 3 entries
✅ Date range: 2025-09-01 to 2025-09-01

🚀 Test 5: Export Process
✅ All tests completed successfully!
```

### **Step 3: Test with Actual Files**

If you have the template and data files:

```bash
# Test the actual export process
node --loader ts-node/esm scripts/excel-export.ts
```

### **Step 4: Run Unit Tests**

```bash
# Run Jest unit tests
npm test
```

## 🔧 Testing Different Scenarios

### **Scenario 1: Basic Export**

```typescript
import { ExcelExporter } from '../lib/ExcelExporter.js';
import { DataMapper } from '../lib/DataMapper.js';

async function testBasicExport() {
  const dataMapper = new DataMapper();
  dataMapper.loadStaticMappings();
  const mappings = dataMapper.getMappings();

  const exporter = new ExcelExporter({
    templatePath: 'excel_export/template.xlsx',
    outputPath: 'excel_export/output_ts.xlsx',
    dataPath: 'excel_export/data.json'
  });

  exporter.setSubjectMapping(mappings.subjectMapping);
  exporter.setLecturerMapping(mappings.lecturerMapping);
  exporter.setLocationMapping(mappings.locationMapping);

  await exporter.export();
}
```

### **Scenario 2: Custom Configuration**

```typescript
const customExporter = new ExcelExporter({
  templatePath: 'custom_template.xlsx',
  outputPath: 'custom_output.xlsx',
  dataPath: 'custom_data.json',
  timeSlots: ['Morning', 'Afternoon', 'Evening'],
  firstTimeSlotRow: 5,
  rowPerTimeSlot: 2
});
```

### **Scenario 3: Step-by-Step Process**

```typescript
// Load data
await exporter.readData();

// Load template
await exporter.loadTemplate();

// Fill days and time slots
exporter.fillDays();

// Fill period data
exporter.fillPeriodData();

// Save workbook
await exporter.saveWorkbook();
```

## 🐛 Debugging Common Issues

### **Issue 1: Module Not Found**

**Error:** `Cannot find module 'lib/ExcelExporter.js'`

**Solution:** 
- Ensure you're using the correct import paths with `.js` extension
- Check that the TypeScript files are in the correct locations

### **Issue 2: Template File Not Found**

**Error:** `Failed to load template: excel_export/template.xlsx`

**Solution:**
- Verify the template file exists in the `excel_export/` directory
- Check file permissions
- Use mock testing if template is not available

### **Issue 3: Data File Not Found**

**Error:** `Failed to read data file: excel_export/data.json`

**Solution:**
- Verify the data file exists
- Check JSON format is valid
- Use mock data for testing

### **Issue 4: ES Module Issues**

**Error:** `require is not defined in ES module scope`

**Solution:**
- Use `node --loader ts-node/esm` instead of `npx ts-node`
- Remove `require.main` checks from ES modules
- Use `import` instead of `require`

## 📊 Test Coverage

The testing covers:

1. **Data Mapper Tests**
   - ✅ Static mapping loading
   - ✅ ID to name conversion
   - ✅ Fallback values
   - ✅ Null handling

2. **Excel Exporter Tests**
   - ✅ Configuration management
   - ✅ Date calculations
   - ✅ Data processing
   - ✅ Error handling

3. **Integration Tests**
   - ✅ Complete export process
   - ✅ File operations
   - ✅ Excel manipulation

## 🎯 Testing Best Practices

1. **Start with Mock Tests**
   - Use `scripts/simple-test.ts` for initial testing
   - Verify core logic without external dependencies

2. **Test Individual Components**
   - Test DataMapper separately
   - Test ExcelExporter configuration
   - Test date calculations

3. **Test Error Scenarios**
   - Invalid file paths
   - Missing data
   - Invalid configurations

4. **Test with Real Data**
   - Use actual template files when available
   - Verify output Excel files
   - Check data mapping accuracy

## 🚀 Quick Test Commands

```bash
# 1. Run mock tests (no files required)
node --loader ts-node/esm scripts/simple-test.ts

# 2. Run demonstration
node --loader ts-node/esm scripts/demo-excel-export.ts

# 3. Run actual export (requires files)
node --loader ts-node/esm scripts/excel-export.ts

# 4. Run unit tests
npm test

# 5. Test specific functionality
node --loader ts-node/esm scripts/excel-export.ts custom
```

## 📝 Expected Test Results

When all tests pass, you should see:

- ✅ All mock tests completed successfully
- ✅ Data mapping working correctly
- ✅ Date calculations accurate
- ✅ Export process functional
- ✅ Error handling working
- ✅ Configuration system working

This comprehensive testing approach ensures your TypeScript Excel export system is robust, maintainable, and ready for production use. 