export interface SchoolClass {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  name: string;
  class_id: number;
  photo_data_url?: string | null;
}

declare global {
  interface Window {
    JSZip: any;
  }
}