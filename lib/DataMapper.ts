import { SubjectMapping, LecturerMapping, LocationMapping } from '../types/ExcelExportTypes.js';

export interface Subject {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface Lecturer {
  id: number;
  name: string;
  email?: string;
  department?: string;
}

export interface Location {
  id: number;
  name: string;
  building?: string;
  capacity?: number;
}

export class DataMapper {
  private subjectMapping: SubjectMapping = {};
  private lecturerMapping: LecturerMapping = {};
  private locationMapping: LocationMapping = {};

  /**
   * Set subject mapping
   */
  setSubjectMapping(mapping: SubjectMapping): void {
    this.subjectMapping = mapping;
  }

  /**
   * Set lecturer mapping
   */
  setLecturerMapping(mapping: LecturerMapping): void {
    this.lecturerMapping = mapping;
  }

  /**
   * Set location mapping
   */
  setLocationMapping(mapping: LocationMapping): void {
    this.locationMapping = mapping;
  }

  /**
   * Get subject name by ID
   */
  getSubjectName(id: number): string {
    return this.subjectMapping[id] || `Subject ${id}`;
  }

  /**
   * Get lecturer name by ID
   */
  getLecturerName(id: number | null): string {
    if (id === null) return 'TBD';
    return this.lecturerMapping[id] || `Lecturer ${id}`;
  }

  /**
   * Get location name by ID
   */
  getLocationName(id: number | null): string {
    if (id === null) return 'TBD';
    return this.locationMapping[id] || `Location ${id}`;
  }

  /**
   * Create mapping from array of subjects
   */
  createSubjectMapping(subjects: Subject[]): SubjectMapping {
    const mapping: SubjectMapping = {};
    subjects.forEach(subject => {
      mapping[subject.id] = subject.name;
    });
    return mapping;
  }

  /**
   * Create mapping from array of lecturers
   */
  createLecturerMapping(lecturers: Lecturer[]): LecturerMapping {
    const mapping: LecturerMapping = {};
    lecturers.forEach(lecturer => {
      mapping[lecturer.id] = lecturer.name;
    });
    return mapping;
  }

  /**
   * Create mapping from array of locations
   */
  createLocationMapping(locations: Location[]): LocationMapping {
    const mapping: LocationMapping = {};
    locations.forEach(location => {
      mapping[location.id] = location.name;
    });
    return mapping;
  }

  /**
   * Load mappings from static data (for demo purposes)
   */
  loadStaticMappings(): void {
    // Sample subject mappings
    const subjects: Subject[] = [
      { id: 1, name: 'Mathematics', code: 'MATH101' },
      { id: 2, name: 'Physics', code: 'PHYS101' },
      { id: 6, name: 'Chemistry', code: 'CHEM101' },
      { id: 7, name: 'Biology', code: 'BIO101' },
      { id: 9, name: 'Computer Science', code: 'CS101' },
      { id: 10, name: 'English Literature', code: 'ENG101' },
      { id: 12, name: 'History', code: 'HIST101' },
      { id: 13, name: 'Geography', code: 'GEO101' },
      { id: 14, name: 'Economics', code: 'ECON101' },
      { id: 15, name: 'Psychology', code: 'PSYCH101' },
      { id: 16, name: 'Philosophy', code: 'PHIL101' },
      { id: 17, name: 'Sociology', code: 'SOC101' },
      { id: 18, name: 'Political Science', code: 'POL101' },
      { id: 19, name: 'Art History', code: 'ART101' }
    ];

    // Sample lecturer mappings
    const lecturers: Lecturer[] = [
      { id: 1, name: 'Dr. John Smith', department: 'Mathematics' },
      { id: 2, name: 'Prof. Sarah Johnson', department: 'Physics' },
      { id: 3, name: 'Dr. Michael Brown', department: 'Chemistry' },
      { id: 4, name: 'Prof. Emily Davis', department: 'Biology' },
      { id: 5, name: 'Dr. Robert Wilson', department: 'Computer Science' }
    ];

    // Sample location mappings
    const locations: Location[] = [
      { id: 1, name: 'Room 101', building: 'Main Hall', capacity: 30 },
      { id: 2, name: 'Room 102', building: 'Main Hall', capacity: 25 },
      { id: 3, name: 'Lab A', building: 'Science Building', capacity: 20 },
      { id: 4, name: 'Lab B', building: 'Science Building', capacity: 20 },
      { id: 5, name: 'Auditorium', building: 'Main Hall', capacity: 100 }
    ];

    this.setSubjectMapping(this.createSubjectMapping(subjects));
    this.setLecturerMapping(this.createLecturerMapping(lecturers));
    this.setLocationMapping(this.createLocationMapping(locations));
  }

  /**
   * Get all mappings for ExcelExporter
   */
  getMappings() {
    return {
      subjectMapping: this.subjectMapping,
      lecturerMapping: this.lecturerMapping,
      locationMapping: this.locationMapping
    };
  }
} 