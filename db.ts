import type { SchoolClass, Student } from './types';

const DB_NAME = 'SawwirniDB';
const DB_VERSION = 1;
const CLASSES_STORE = 'classes';
const STUDENTS_STORE = 'students';

class Database {
  private db: Promise<IDBDatabase>;

  constructor() {
    this.db = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CLASSES_STORE)) {
          db.createObjectStore(CLASSES_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
          const studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: 'id', autoIncrement: true });
          studentStore.createIndex('classId', 'classId', { unique: false });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode) {
    const db = await this.db;
    return db.transaction(storeName, mode).objectStore(storeName);
  }
  
  // Class Methods
  async addClass(name: string): Promise<void> {
    const store = await this.getStore(CLASSES_STORE, 'readwrite');
    store.add({ name });
  }

  async getClasses(): Promise<SchoolClass[]> {
    const store = await this.getStore(CLASSES_STORE, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteClass(classId: number): Promise<void> {
    const db = await this.db;
    const tx = db.transaction([CLASSES_STORE, STUDENTS_STORE], 'readwrite');
    const classesStore = tx.objectStore(CLASSES_STORE);
    const studentsStore = tx.objectStore(STUDENTS_STORE);
    const studentsIndex = studentsStore.index('classId');

    // 1. Delete the class itself
    classesStore.delete(classId);

    // 2. Find and delete all students in that class
    const getStudentsRequest = studentsIndex.openCursor(IDBKeyRange.only(classId));
    getStudentsRequest.onsuccess = () => {
        const cursor = getStudentsRequest.result;
        if (cursor) {
            studentsStore.delete(cursor.primaryKey);
            cursor.continue();
        }
    };

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  }

  // Student Methods
  async addStudent(name: string, classId: number): Promise<void> {
    const store = await this.getStore(STUDENTS_STORE, 'readwrite');
    store.add({ name, classId });
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    const store = await this.getStore(STUDENTS_STORE, 'readonly');
    const index = store.index('classId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(classId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getStudentCountByClass(classId: number): Promise<number> {
    const store = await this.getStore(STUDENTS_STORE, 'readonly');
    const index = store.index('classId');
    return new Promise((resolve, reject) => {
        const request = index.count(classId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
  }

  async updateStudent(student: Student): Promise<void> {
    const store = await this.getStore(STUDENTS_STORE, 'readwrite');
    store.put(student);
  }
  
  async deleteStudent(studentId: number): Promise<void> {
    const store = await this.getStore(STUDENTS_STORE, 'readwrite');
    store.delete(studentId);
  }
}

export const db = new Database();