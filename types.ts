export interface SchoolClass {
  id: number;
  name: string;
  user_id: string;
  students?: { count: number }[]; // From Supabase count
}

export interface Student {
  id: number;
  name: string;
  class_id: number;
  photo_url?: string | null;
}

declare global {
  interface Window {
    JSZip: any;
  }
}