import React, { useState, useEffect, useCallback } from 'react';
import type { SchoolClass } from '../types';
import { getClassesWithStudentCounts, addClass, deleteClass } from '../db';
import Modal from './Modal';
import { PlusIcon, SpinnerIcon, TrashIcon } from './icons';

interface ClassManagerProps {
  onClassSelect: (schoolClass: SchoolClass) => void;
}

type ClassWithCount = SchoolClass & { studentCount: number };

const ClassManager: React.FC<ClassManagerProps> = ({ onClassSelect }) => {
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClassesWithStudentCounts();
      setClasses(data);
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleAddClass = async () => {
    if (newClassName.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await addClass(newClassName.trim());
        await loadClasses();
        setNewClassName('');
        setIsModalOpen(false);
      } catch (error: any) {
        console.error("Failed to add class:", error);
        alert(error.message === 'Class name already exists' ? 'اسم الشعبة موجود بالفعل. يرجى اختيار اسم آخر.' : 'حدث خطأ أثناء إضافة الشُعبة.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleOpenDeleteModal = (schoolClass: ClassWithCount) => {
    setClassToDelete(schoolClass);
  };

  const handleConfirmDelete = async () => {
    if (classToDelete) {
      setIsDeleting(true);
      try {
        await deleteClass(classToDelete.id);
        await loadClasses();
        setClassToDelete(null);
      } catch (error) {
        console.error("Failed to delete class:", error);
        alert('حدث خطأ أثناء حذف الشُعبة.');
      } finally {
        setIsDeleting(false);
      }
    }
  };


  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 drop-shadow-lg">الشُعب الدراسية</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <PlusIcon className="w-5 h-5" />
          <span>إضافة شُعبة</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
            <SpinnerIcon className="w-8 h-8 mx-auto text-teal-500" />
            <p className="mt-2 drop-shadow-sm">جاري تحميل الشُعب...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg shadow">
          <p className="text-lg text-gray-600 dark:text-gray-300">لم يتم إضافة أي شُعبة بعد.</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">انقر على "إضافة شُعبة" للبدء.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {classes.map((c) => (
            <div
              key={c.id}
              className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300 group"
            >
              <div onClick={() => onClassSelect(c)} className="cursor-pointer p-6 flex items-center justify-center">
                <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-200">{c.name}</h3>
              </div>
              <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow pointer-events-none">
                  {c.studentCount} طالب
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteModal(c);
                }}
                className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`حذف شُعبة ${c.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة شُعبة جديدة" isLoading={isSaving}>
        <div className="space-y-4">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="اسم الشُعبة (مثال: أول ابتدائي - أ)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
            autoFocus
          />
          <button
            onClick={handleAddClass}
            disabled={isSaving || !newClassName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
          >
            {isSaving && <SpinnerIcon className="w-5 h-5" />}
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!classToDelete} onClose={() => setClassToDelete(null)} title="تأكيد حذف الشُعبة" isLoading={isDeleting}>
        {classToDelete && (
            <div className="space-y-6">
            <p className="text-lg text-gray-700 dark:text-gray-300">
                هل أنت متأكد من حذف شُعبة <span className="font-bold text-red-600 dark:text-red-400">{classToDelete.name}</span>؟
            </p>
            <p className="font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">
                سيتم حذف جميع الطلاب المسجلين في هذه الشُعبة بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-4">
                <button 
                    onClick={() => setClassToDelete(null)}
                    disabled={isDeleting}
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                    إلغاء
                </button>
                <button 
                    onClick={handleConfirmDelete}
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
    </div>
  );
};

export default ClassManager;