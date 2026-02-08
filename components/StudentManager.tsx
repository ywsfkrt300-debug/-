import React, { useState, useEffect, useCallback } from 'react';
import type { SchoolClass, Student } from '../types';
import { getStudentsByClass, addStudent, deleteStudent, updateStudentPhoto, deleteStudentPhoto } from '../db';
import { downloadImagesAsZip } from '../utils/imageUtils';
import Modal from './Modal';
import CameraView from './CameraView';
import { PlusIcon, DownloadIcon, CameraIcon, SpinnerIcon, TrashIcon, EyeIcon, CheckCircleIcon } from './icons';

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
  const [studentIdForPhotoDeleteConfirm, setStudentIdForPhotoDeleteConfirm] = useState<number | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [withNames, setWithNames] = useState(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudentsByClass(schoolClass.id);
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
        await addStudent(newStudentName.trim(), schoolClass.id);
        await loadStudents();
        setNewStudentName('');
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to add student:", error);
        alert('حدث خطأ أثناء إضافة الطالب.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSavePhoto = async (studentId: number, photoDataUrl: string) => {
    try {
      await updateStudentPhoto(studentId, photoDataUrl);
      setStudentToPhotograph(null);
      await loadStudents();
    } catch (error) {
      console.error("Failed to save photo:", error);
      alert('فشل حفظ الصورة. يرجى المحاولة مرة أخرى.');
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
      await deleteStudent(studentToDelete.id);
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
    if (isDeletingPhoto) return;
    setStudentIdForPhotoDeleteConfirm(studentId);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!studentIdForPhotoDeleteConfirm) return;
    setIsDeletingPhoto(true);
    try {
        await deleteStudentPhoto(studentIdForPhotoDeleteConfirm);
        await loadStudents();
    } catch (error) {
        console.error("Failed to delete student photo:", error);
        alert('حدث خطأ أثناء حذف الصورة.');
    } finally {
        setStudentIdForPhotoDeleteConfirm(null);
        setIsDeletingPhoto(false);
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
  
  const handleDownloadSingleImage = async (student: Student) => {
    if (!student.photo_data_url) return;
    try {
        const link = document.createElement('a');
        link.href = student.photo_data_url;
        link.download = `${student.name}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to download image:", error);
        alert("فشل تحميل الصورة.");
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
            <button onClick={handleDownloadZip} disabled={isDownloadingZip || students.filter(s => s.photo_data_url).length === 0} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400">
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
        <div className="space-y-3 fade-in">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                  {student.photo_data_url ? (
// FIX: Wrap icon in a span with a title attribute for tooltip functionality.
                      <span title="تم التصوير">
                        <CheckCircleIcon className="w-7 h-7 text-green-500"/>
                      </span>
                  ) : (
// FIX: Wrap icon in a span with a title attribute for tooltip functionality.
                      <span title="لم يتم التصوير">
                        <CameraIcon className="w-7 h-7 text-gray-400"/>
                      </span>
                  )}
                  <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{student.name}</span>
              </div>
              <div className="flex items-center gap-2">
                  {student.photo_data_url && (
                      <>
                          <button onClick={() => handleDownloadSingleImage(student)} className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="حفظ الصورة على الجهاز">
                              <DownloadIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => setImageToView(student.photo_data_url!)} className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="عرض الصورة">
                              <EyeIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => openDeletePhotoConfirm(student.id)} className="p-2 text-gray-600 hover:text-yellow-600 dark:text-gray-300 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="حذف الصورة فقط">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </>
                  )}
                  <button onClick={() => setStudentToPhotograph(student)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 transition-colors">
                      <CameraIcon className="w-4 h-4" />
                      <span>{student.photo_data_url ? 'إعادة التصوير' : 'تصوير'}</span>
                  </button>
                  <button onClick={() => openDeleteStudentModal(student)} className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-500 transition-colors rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title={`حذف الطالب ${student.name}`}>
                      <TrashIcon className="w-5 h-5" />
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

       <Modal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} title="تأكيد حذف الطالب" isLoading={isDeleting}>
        {studentToDelete && (
            <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">
                هل أنت متأكد من حذف الطالب <span className="font-bold text-red-600 dark:text-red-400">{studentToDelete.name}</span>؟
            </p>
            <p className="font-semibold text-red-600 dark:text-red-400">
                سيتم حذف الطالب وجميع بياناته بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-4">
                <button onClick={() => setStudentToDelete(null)} disabled={isDeleting} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">إلغاء</button>
                <button onClick={handleConfirmDeleteStudent} disabled={isDeleting} className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[110px]">
                    {isDeleting && <SpinnerIcon className="w-5 h-5"/>}
                    <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}</span>
                </button>
            </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={studentIdForPhotoDeleteConfirm !== null} onClose={() => setStudentIdForPhotoDeleteConfirm(null)} title="تأكيد حذف الصورة" isLoading={isDeletingPhoto}>
        <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">هل أنت متأكد من حذف صورة هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-4">
                <button onClick={() => setStudentIdForPhotoDeleteConfirm(null)} disabled={isDeletingPhoto} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">إلغاء</button>
                <button onClick={handleConfirmDeletePhoto} disabled={isDeletingPhoto} className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[110px]">
                    {isDeletingPhoto ? <SpinnerIcon className="w-5 h-5"/> : null}
                    <span>{isDeletingPhoto ? 'جاري الحذف...' : 'نعم، احذف'}</span>
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