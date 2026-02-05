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
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotoStudentId, setDeletingPhotoStudentId] = useState<number | null>(null);
  const [studentIdForPhotoDeleteConfirm, setStudentIdForPhotoDeleteConfirm] = useState<number | null>(null);
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
        await loadStudents();
        setNewStudentName('');
        setIsModalOpen(false);
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

  const openDeleteStudentModal = (student: Student) => {
    if (isDeleting) return;
    setStudentToDelete(student);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
        await db.deleteStudent(studentToDelete.id);
        await loadStudents();
        setStudentToDelete(null);
    } catch (error) {
        console.error("Failed to delete student:", error);
        alert('حدث خطأ أثناء حذف الطالب.');
    } finally {
        setIsDeleting(false);
    }
  };

  const openDeletePhotoConfirm = (studentId: number) => {
    if (deletingPhotoStudentId) return;
    setStudentIdForPhotoDeleteConfirm(studentId);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!studentIdForPhotoDeleteConfirm) return;

    setDeletingPhotoStudentId(studentIdForPhotoDeleteConfirm);
    try {
        const student = students.find(s => s.id === studentIdForPhotoDeleteConfirm);
        if (student) {
            const { photo, ...studentWithoutPhoto } = student;
            await db.updateStudent(studentWithoutPhoto as Student);
            await loadStudents();
        }
    } catch (error) {
        console.error("Failed to delete student photo:", error);
        alert('حدث خطأ أثناء حذف الصورة.');
    } finally {
        setStudentIdForPhotoDeleteConfirm(null);
        setDeletingPhotoStudentId(null);
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadImagesAsZip(students, withNames, schoolClass.name);
    } catch (error) {
      console.error("Failed to download zip:", error);
      alert('حدث خطأ أثناء تحضير الملف.');
    } finally {
      setIsDownloadingZip(false);
    }
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
            <div key={student.id} className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="relative aspect-[3/4]">
                {student.photo ? (
                  <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200/50 dark:bg-gray-700/50 flex items-center justify-center">
                    <CameraIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => student.photo && setImageToView(student.photo)}
                />

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 group-hover:opacity-0">
                  <h3 className="font-semibold text-lg text-white text-center truncate">{student.name}</h3>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-3 text-white">
                    <h3 className="font-bold text-xl text-center">{student.name}</h3>
                    <div className="flex flex-col items-stretch gap-2 w-full max-w-[150px]">
                        {student.photo ? (
                            <>
                                <button onClick={() => setStudentToPhotograph(student)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm">
                                    <CameraIcon className="w-4 h-4" />
                                    <span>إعادة التصوير</span>
                                </button>
                                <button onClick={() => openDeletePhotoConfirm(student.id)} disabled={deletingPhotoStudentId === student.id} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-400 text-sm">
                                    {deletingPhotoStudentId === student.id ? <SpinnerIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
                                    <span>حذف الصورة</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setStudentToPhotograph(student)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">
                                <CameraIcon className="w-5 h-5" />
                                <span>تصوير</span>
                            </button>
                        )}
                    </div>
                </div>

                <button onClick={() => openDeleteStudentModal(student)} className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-all opacity-0 group-hover:opacity-100" title={`حذف الطالب ${student.name}`}>
                    <TrashIcon className="w-4 h-4" />
                </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة طالب جديد" isLoading={isSaving}>
        <div className="space-y-4">
          <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="اسم الطالب الكامل" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600" autoFocus />
          <button onClick={handleAddStudent} disabled={isSaving || !newStudentName.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors">
            {isSaving && <SpinnerIcon className="w-5 h-5" />}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>
        </div>
      </Modal>

       <Modal 
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="تأكيد حذف الطالب"
        isLoading={isDeleting}
      >
        {studentToDelete && (
            <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">
                هل أنت متأكد من حذف الطالب <span className="font-bold text-red-600 dark:text-red-400">{studentToDelete.name}</span>؟
            </p>
            <p className="font-semibold text-red-600 dark:text-red-400">
                سيتم حذف الطالب وجميع بياناته بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-4">
                <button 
                    onClick={() => setStudentToDelete(null)}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                    إلغاء
                </button>
                <button 
                    onClick={handleConfirmDeleteStudent}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[110px]"
                >
                    {isDeleting && <SpinnerIcon className="w-5 h-5"/>}
                    <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}</span>
                </button>
            </div>
            </div>
        )}
      </Modal>

      <Modal 
        isOpen={studentIdForPhotoDeleteConfirm !== null} 
        onClose={() => setStudentIdForPhotoDeleteConfirm(null)} 
        title="تأكيد حذف الصورة"
        isLoading={deletingPhotoStudentId !== null}
      >
        <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">هل أنت متأكد من حذف صورة هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-4">
                <button 
                    onClick={() => setStudentIdForPhotoDeleteConfirm(null)}
                    disabled={deletingPhotoStudentId !== null}
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                    إلغاء
                </button>
                <button 
                    onClick={handleConfirmDeletePhoto}
                    disabled={deletingPhotoStudentId !== null}
                    className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[110px]"
                >
                    {deletingPhotoStudentId === studentIdForPhotoDeleteConfirm ? <SpinnerIcon className="w-5 h-5"/> : null}
                    <span>{deletingPhotoStudentId === studentIdForPhotoDeleteConfirm ? 'جاري الحذف...' : 'نعم، احذف'}</span>
                </button>
            </div>
        </div>
      </Modal>

      {studentToPhotograph && (
        <CameraView student={studentToPhotograph} onClose={() => setStudentToPhotograph(null)} onSave={handleSavePhoto}/>
      )}
    </div>
  );
};

export default StudentManager;