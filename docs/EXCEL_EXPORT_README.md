# Excel Export System - TypeScript Implementation

This document describes the new TypeScript class-based implementation of the Excel export functionality, which provides a more robust, maintainable, and extensible solution compared to the original JavaScript implementation.

## 🏗️ Architecture Overview

The new implementation follows Object-Oriented Programming (OOP) principles with the following key components:

### Core Classes

1. **`ExcelExporter`** - Main class responsible for Excel operations
2. **`DataMapper`** - Handles data mapping and transformations
3. **TypeScript Interfaces** - Type-safe data structures

### File Structure

```
lib/
├── ExcelExporter.ts     # Main Excel export functionality
└── DataMapper.ts        # Data mapping and transformation

types/
└── ExcelExportTypes.ts  # TypeScript interfaces

scripts/
└── excel-export.ts      # Usage examples and main script

test/
└── excel-export.test.ts # Unit tests
```

## 🚀 Key Features

### 1. Type Safety
- Full TypeScript support with strict typing
- Compile-time error checking
- IntelliSense support for better development experience

### 2. Object-Oriented Design
- Encapsulation of related functionality
- Clear separation of concerns
- Easy to extend and maintain

### 3. Configuration Management
- Flexible configuration system
- Default values with override capability
- Environment-specific settings

### 4. Error Handling
- Comprehensive error handling
- Detailed error messages
- Graceful failure recovery

### 5. Data Mapping
- Automatic ID to name conversion
- Support for subject, lecturer, and location mappings
- Fallback values for missing data

## 📋 Usage Examples

### Basic Usage

```typescript
import { ExcelExporter } from '../lib/ExcelExporter';
import { DataMapper } from '../lib/DataMapper';

async function basicExport() {
  // Initialize data mapper
  const dataMapper = new DataMapper();
  dataMapper.loadStaticMappings();
  const mappings = dataMapper.getMappings();

  // Create exporter
  const exporter = new ExcelExporter({
    templatePath: 'excel_export/template.xlsx',
    outputPath: 'excel_export/output.xlsx',
    dataPath: 'excel_export/data.json'
  });

  // Set mappings
  exporter.setSubjectMapping(mappings.subjectMapping);
  exporter.setLecturerMapping(mappings.lecturerMapping);
  exporter.setLocationMapping(mappings.locationMapping);

  // Perform export
  await exporter.export();
}
```

### Advanced Usage with Custom Configuration

```typescript
const exporter = new ExcelExporter({
  templatePath: 'custom_template.xlsx',
  outputPath: 'custom_output.xlsx',
  dataPath: 'custom_data.json',
  worksheetIndex: 1,
  dayColumn: 'A',
  timeSlotColumn: 'B',
  firstTimeSlotRow: 4,
  rowPerTimeSlot: 1,
  timeSlots: ['S', 'C', 'T']
});
```

### Step-by-Step Export Process

```typescript
// Load data
await exporter.readData();

// Load template
await exporter.loadTemplate();

// Fill days and time slots
exporter.fillDays();

// Fill period data (subjects, lecturers, locations)
exporter.fillPeriodData();

// Save workbook
await exporter.saveWorkbook();
```

## 🔧 Configuration Options

### ExcelConfig Interface

```typescript
interface ExcelConfig {
  templatePath: string;      // Path to Excel template
  outputPath: string;        // Output file path
  dataPath: string;          // JSON data file path
  worksheetIndex: number;    // Worksheet index (1-based)
  dayColumn: string;         // Column for day headers
  timeSlotColumn: string;    // Column for time slots
  firstTimeSlotRow: number;  // Starting row for time slots
  rowPerTimeSlot: number;    // Rows per time slot
  timeSlots: string[];       // Time slot labels
}
```

## 📊 Data Mapping

### Subject Mapping
```typescript
const subjectMapping = {
  1: 'Mathematics',
  2: 'Physics',
  6: 'Chemistry',
  // ... more subjects
};
```

### Lecturer Mapping
```typescript
const lecturerMapping = {
  1: 'Dr. John Smith',
  2: 'Prof. Sarah Johnson',
  // ... more lecturers
};
```

### Location Mapping
```typescript
const locationMapping = {
  1: 'Room 101',
  2: 'Room 102',
  // ... more locations
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test test/excel-export.test.ts
```

### Test Coverage

The test suite covers:
- Data mapping functionality
- Excel exporter initialization
- Date calculations
- Error handling
- Integration scenarios

## 🔄 Migration from JavaScript

### Before (JavaScript)
```javascript
// Procedural approach
async function main() {
  const excelTemplate = await getExcelTemplate('template.xlsx');
  const worksheet = excelTemplate.getWorksheet(1);
  const data = await readJSON('data.json');

  fillDays(worksheet, data);
  saveExcel(excelTemplate, 'output.xlsx');
}
```

### After (TypeScript)
```typescript
// Object-oriented approach
const exporter = new ExcelExporter({
  templatePath: 'template.xlsx',
  outputPath: 'output.xlsx',
  dataPath: 'data.json'
});

await exporter.export();
```

## 🎯 Benefits Over Original Implementation

### 1. **Type Safety**
- Compile-time error detection
- Better IDE support
- Reduced runtime errors

### 2. **Maintainability**
- Clear class structure
- Separation of concerns
- Easy to extend and modify

### 3. **Reusability**
- Modular design
- Configurable components
- Multiple usage patterns

### 4. **Error Handling**
- Comprehensive error messages
- Graceful failure handling
- Better debugging experience

### 5. **Testing**
- Unit test support
- Mock data capabilities
- Test-driven development

## 🚀 Running the Export

### Using the Script

```bash
# Basic export
npx ts-node scripts/excel-export.ts

# Custom configuration
npx ts-node scripts/excel-export.ts custom

# Database integration (demo)
npx ts-node scripts/excel-export.ts db
```

### Programmatic Usage

```typescript
import { exportScheduleToExcel } from './scripts/excel-export';

// Run export
await exportScheduleToExcel();
```

## 📝 Data Format

The system expects JSON data in the following format:

```json
[
  {
    "week": 1,
    "teamId": 1,
    "subjectId": 16,
    "date": "2025-09-01",
    "dayOfWeek": "Mon",
    "session": "morning",
    "lecturerId": null,
    "locationId": null
  }
]
```

## 🔮 Future Enhancements

### Planned Features
1. **Database Integration** - Direct database queries
2. **Multiple Templates** - Support for different Excel formats
3. **Batch Processing** - Export multiple schedules
4. **Validation** - Data validation before export
5. **Logging** - Comprehensive logging system
6. **Caching** - Template and mapping caching

### Extension Points
- Custom cell formatters
- Dynamic column mapping
- Conditional formatting
- Chart generation
- PDF export

## 🤝 Contributing

When contributing to this system:

1. Follow TypeScript best practices
2. Add unit tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Follow the existing code style

## 📞 Support

For issues or questions:
1. Check the test files for usage examples
2. Review the TypeScript interfaces
3. Examine the error messages for debugging
4. Use the step-by-step export process for troubleshooting 