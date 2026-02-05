import React, { useState, useEffect, useCallback } from 'react';
import type { SchoolClass, Student } from '../types';
import { db } from '../db';
import { downloadImagesAsZip } from '../utils/imageUtils';
import Modal from './Modal';
import CameraView from './CameraView';
import { PlusIcon, DownloadIcon, CameraIcon, SpinnerIcon, TrashIcon } from './icons';

interface StudentManagerProps {
  schoolClass: SchoolClass;
}

const StudentManager: React.FC<StudentManagerProps> = ({ schoolClass }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [studentToPhotograph, setStudentToPhotograph] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [withNames, setWithNames] = useState(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await db.getStudentsByClass(schoolClass.id);
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setIsLoading(false);
    }
  }, [schoolClass.id]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAddStudent = async () => {
    if (newStudentName.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await db.addStudent(newStudentName.trim(), schoolClass.id);
        setNewStudentName('');
        setIsModalOpen(false);
        await loadStudents();
      } catch (error) {
        console.error("Failed to add student:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSavePhoto = async (studentId: number, photoDataUrl: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const updatedStudent = { ...student, photo: photoDataUrl };
      await db.updateStudent(updatedStudent);
      setStudentToPhotograph(null);
      await loadStudents();
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (deletingStudentId) return;
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.')) {
        setDeletingStudentId(studentId);
        try {
            await db.deleteStudent(studentId);
            await loadStudents();
        } catch (error) {
            console.error("Failed to delete student:", error);
        } finally {
            setDeletingStudentId(null);
        }
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadImagesAsZip(students, withNames, schoolClass.name);
    // FIX: Added curly braces to the catch block to fix a syntax error.
    } catch (error) {
      console.error("Failed to download zip:", error);
      alert('حدث خطأ أثناء تحضير الملف.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadSingleImage = (student: Student) => {
    if (!student.photo) return;
    const link = document.createElement('a');
    link.href = student.photo;
    link.download = `${student.name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 drop-shadow-lg">طلاب الشُعبة</h2>
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                <input type="checkbox" id="withNames" checked={withNames} onChange={(e) => setWithNames(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"/>
                <label htmlFor="withNames" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">تضمين الأسماء</label>
            </div>
            <button onClick={handleDownloadZip} disabled={isDownloadingZip || students.filter(s => s.photo).length === 0} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
                {isDownloadingZip ? <SpinnerIcon className="w-5 h-5"/> : <DownloadIcon className="w-5 h-5" />}
                <span>{isDownloadingZip ? 'جاري التحضير...' : 'تحميل الكل (ZIP)'}</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>إضافة طالب</span>
            </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
            <SpinnerIcon className="w-8 h-8 mx-auto text-teal-500" />
            <p className="mt-2 drop-shadow-sm">جاري تحميل الطلاب...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg shadow">
          <p className="text-lg text-gray-600 dark:text-gray-300">لم يتم إضافة أي طالب لهذه الشُعبة بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="relative aspect-w-1 aspect-h-1">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setImageToView(student.photo)}/>
                ) : (
                  <div className="w-full h-full bg-gray-200/50 dark:bg-gray-700/50 flex items-center justify-center">
                    <CameraIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                 <button onClick={() => handleDeleteStudent(student.id)} disabled={deletingStudentId === student.id} className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors disabled:bg-red-400">
                    {deletingStudentId === student.id ? <SpinnerIcon className="w-4 h-4"/> : <TrashIcon className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-center text-lg text-gray-800 dark:text-gray-200 flex-grow mb-4">{student.name}</h3>
                <div className="mt-auto">
                  {student.photo ? (
                    <div className="flex items-stretch gap-2">
                      <button onClick={() => setStudentToPhotograph(student)} className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">
                        <CameraIcon className="w-5 h-5" />
                        <span>إعادة التصوير</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingleImage(student)}
                        className="flex-shrink-0 p-2.5 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                        title="تحميل الصورة"
                        aria-label="تحميل الصورة"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setStudentToPhotograph(student)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
                      <CameraIcon className="w-5 h-5" />
                      <span>تصوير</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {imageToView && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center backdrop-blur-md" onClick={() => setImageToView(null)}>
            <img src={imageToView} alt="معاينة" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة طالب جديد">
        <div className="space-y-4">
          <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="اسم الطالب الكامل" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600" autoFocus />
          <button onClick={handleAddStudent} disabled={isSaving || !newStudentName.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors">
            {isSaving && <SpinnerIcon className="w-5 h-5" />}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>
        </div>
      </Modal>

      {studentToPhotograph && (
        <CameraView student={studentToPhotograph} onClose={() => setStudentToPhotograph(null)} onSave={handleSavePhoto}/>
      )}
    </div>
  );
};

export default StudentManager;