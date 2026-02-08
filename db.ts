import type { SchoolClass, Student } from './types';

// Helper functions for getting and setting data in localStorage
const getClasses = (): SchoolClass[] => {
  try {
    return JSON.parse(localStorage.getItem('sawwirni_classes') || '[]');
  } catch (e) {
    return [];
  }
};

const saveClasses = (classes: SchoolClass[]): void => {
  localStorage.setItem('sawwirni_classes', JSON.stringify(classes));
};

const getStudents = (): Student[] => {
  try {
    return JSON.parse(localStorage.getItem('sawwirni_students') || '[]');
  } catch (e) {
    return [];
  }
};

const saveStudents = (students: Student[]): void => {
  localStorage.setItem('sawwirni_students', JSON.stringify(students));
};

// Public API for data management
export const getClassesWithStudentCounts = (): (SchoolClass & { studentCount: number })[] => {
  const classes = getClasses();
  const students = getStudents();
  return classes.map(c => ({
    ...c,
    studentCount: students.filter(s => s.class_id === c.id).length
  })).sort((a, b) => a.name.localeCompare(b.name));
};

export const addClass = async (name: string): Promise<void> => {
  const classes = getClasses();
  // Simple check for duplicate name
  if (classes.some(c => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
    throw new Error('Class name already exists');
  }
  const newClass: SchoolClass = { id: Date.now(), name };
  classes.push(newClass);
  saveClasses(classes);
};

export const deleteClass = async (classId: number): Promise<void> => {
    let classes = getClasses();
    classes = classes.filter(c => c.id !== classId);
    saveClasses(classes);

    let students = getStudents();
    students = students.filter(s => s.class_id !== classId);
    saveStudents(students);
};

export const getStudentsByClass = async (classId: number): Promise<Student[]> => {
    const students = getStudents();
    const classStudents = students.filter(s => s.class_id === classId).sort((a, b) => a.name.localeCompare(b.name));
    return classStudents;
};

export const addStudent = async (name: string, classId: number): Promise<void> => {
    const students = getStudents();
    const newStudent: Student = { id: Date.now(), name, class_id: classId };
    students.push(newStudent);
    saveStudents(students);
};

export const deleteStudent = async (studentId: number): Promise<void> => {
    let students = getStudents();
    students = students.filter(s => s.id !== studentId);
    saveStudents(students);
};

export const updateStudentPhoto = async (studentId: number, photoDataUrl: string): Promise<void> => {
    let students = getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex > -1) {
      students[studentIndex].photo_data_url = photoDataUrl;
      saveStudents(students);
    }
};

export const deleteStudentPhoto = async (studentId: number): Promise<void> => {
    let students = getStudents();
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex > -1) {
        students[studentIndex].photo_data_url = undefined; // Use undefined to clear it
        saveStudents(students);
    }
};
