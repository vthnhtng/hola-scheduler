# ScheduleExcelExporter

A TypeScript class for exporting schedule data to Excel format with Vietnamese session mapping and team-based layout.

## Features

- ✅ Export schedule data to Excel with Vietnamese session mapping (S/C/T)
- ✅ Support for 7 teams (C1-C7) with customizable team names
- ✅ Vietnamese date formatting (dd/MM/yyyy)
- ✅ Automatic cell styling and borders
- ✅ Support for both file export and buffer export (for APIs)
- ✅ Compatible with existing codebase structure
- ✅ TypeScript support with full type safety

## Installation

The class uses existing dependencies from your project:
- `exceljs` - For Excel file generation
- `fs/promises` - For file operations

## Usage

### Basic Usage

```typescript
import { ScheduleExcelExporter } from '../lib/ScheduleExcelExporter.js';
import { ScheduleData } from '../types/ExcelExportTypes.js';

// Sample data
const scheduleData: ScheduleData[] = [
  {
    week: 1,
    teamId: 1,
    subjectId: 1,
    date: "2025-05-19",
    dayOfWeek: "Mon",
    session: "morning",
    lecturerId: null,
    locationId: null
  },
  // ... more data
];

// Create exporter
const exporter = new ScheduleExcelExporter({
  outputPath: 'exports/schedule.xlsx',
  teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)']
});

// Export to file
await exporter.export(scheduleData);
```

### API Usage

```typescript
import { ScheduleExcelExporter } from '../lib/ScheduleExcelExporter.js';

// For API responses, use exportToBuffer
const exporter = new ScheduleExcelExporter({
  outputPath: 'temp/schedule.xlsx', // Not used for buffer export
  teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)']
});

const excelBuffer = await exporter.exportToBuffer(scheduleData);

// Return as API response
return new Response(excelBuffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="schedule.xlsx"'
  }
});
```

## Configuration Options

```typescript
interface ScheduleExcelConfig {
  templatePath?: string;    // Path to Excel template (optional)
  outputPath: string;       // Output file path
  dataPath?: string;        // Path to JSON data file (optional)
  worksheetIndex?: number;  // Worksheet index (default: 1)
  teams?: string[];         // Team names (default: C1-C7 with Vietnamese names)
  dateFormat?: string;      // Date format (default: 'dd/MM/yyyy')
}
```

## Session Mapping

The class automatically maps session values to Vietnamese abbreviations:

- `morning` → `S` (Sáng)
- `afternoon` → `C` (Chiều)  
- `evening` → `T` (Tối)

## Output Format

The Excel file will have the following structure:

| Ngày       | Buổi | C1 (Nghĩa) | C2 (Nghĩa) | C3 (Đức) | C4 (TG.Tùng) | C5 (Việt Anh) | C6 (Đức) | C7 (TG.Lâm) |
|------------|------|-------------|-------------|----------|--------------|---------------|----------|-------------|
| 19/5/2025  | S    | Subject 1   | Subject 2   | Subject 3| Subject 4    | Subject 5     | Subject 6| Subject 7   |
|            | C    | Subject 8   | Subject 9   | Subject 10| Subject 11   | Subject 12    | Subject 13| Subject 14  |
|            | T    | Tự học      | Tự học      | Tự học   | Tự học       | Tự học        | Tự học   | Tự học      |

## Methods

### `export(data?: ScheduleData[]): Promise<void>`
Exports schedule data to Excel file.

### `exportToBuffer(data?: ScheduleData[]): Promise<Buffer>`
Exports schedule data to Excel buffer (useful for API responses).

### `readData(data?: ScheduleData[]): Promise<ScheduleData[]>`
Reads data from file or accepts provided data.

### `createWorkbook(): Promise<void>`
Creates or loads Excel workbook.

### `saveWorkbook(): Promise<void>`
Saves workbook to file.

## Testing

Run the test file to see the exporter in action:

```bash
# Create test output directory
mkdir -p test-output

# Run the test
npx ts-node test/schedule-excel-exporter.test.ts
```

## Integration with Existing Codebase

The class is designed to work seamlessly with your existing codebase:

1. **Uses existing types**: Leverages `ScheduleData` from `types/ExcelExportTypes.ts`
2. **Follows existing patterns**: Similar structure to `lib/ExcelExporter.ts`
3. **Compatible with existing data**: Works with your current JSON data format
4. **API ready**: Can be easily integrated into Next.js API routes

## Customization

### Custom Team Names

```typescript
const exporter = new ScheduleExcelExporter({
  outputPath: 'exports/schedule.xlsx',
  teams: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G']
});
```

### Custom Date Format

```typescript
const exporter = new ScheduleExcelExporter({
  outputPath: 'exports/schedule.xlsx',
  dateFormat: 'MM/dd/yyyy'
});
```

### Using Template

```typescript
const exporter = new ScheduleExcelExporter({
  templatePath: 'templates/schedule-template.xlsx',
  outputPath: 'exports/schedule.xlsx'
});
```

## Error Handling

The class includes comprehensive error handling:

```typescript
try {
  await exporter.export(scheduleData);
  console.log('Export successful!');
} catch (error) {
  console.error('Export failed:', error.message);
}
```

## Future Enhancements

- [ ] Support for subject name mapping (currently shows Subject IDs)
- [ ] Support for lecturer name mapping
- [ ] Support for location name mapping
- [ ] Custom styling options
- [ ] Support for multiple worksheets
- [ ] Support for different date ranges

## Dependencies

- `exceljs`: Excel file generation
- `fs/promises`: File system operations
- TypeScript types from `types/ExcelExportTypes.ts` 