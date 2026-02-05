
export interface SchoolClass {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  name: string;
  classId: number;
  photo?: string; // Raw photo as base64 data URL
}

declare global {
  interface Window {
    JSZip: any;
  }
}
