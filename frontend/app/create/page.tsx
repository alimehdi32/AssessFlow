'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuestionTypeRowComponent from '@/components/create/QuestionTypeRow';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useAuthStore } from '@/store/authStore';
import { connectSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Plus, Upload, Calendar, Mic, ArrowLeft, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePage() {
  const router = useRouter();
  const store = useAssignmentStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState('Starting generation...');
  const [genDone, setGenDone] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
        store.setUploadedFile(file);
      }
    },
    [store]
  );

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title', store.title || 'Assignment');
      formData.append('subject', store.subject || 'General');
      formData.append('class', store.class || '10th');
      if (store.dueDate) formData.append('dueDate', store.dueDate);
      if (store.additionalInfo) formData.append('additionalInfo', store.additionalInfo);
      formData.append('questionTypes', JSON.stringify(store.questionTypes));
      if (store.uploadedFile) formData.append('file', store.uploadedFile);

      const res = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { assignment } = res.data.data;
      setGeneratingId(assignment.id);
      setGenStatus('AI is generating your questions...');

      // Socket connection for real-time updates
      if (user?.id) {
        const socket = connectSocket(user.id);
        socket.on('generation_started', () => setGenStatus('Generation started...'));
        socket.on('generation_progress', ({ message }: { message: string }) =>
          setGenStatus(message)
        );
        socket.on('generation_completed', () => {
          setGenDone(true);
          setGenStatus('Assignment created successfully!');
          store.reset();
          setTimeout(() => router.push(`/assignments/${assignment.id}`), 1200);
        });
        socket.on('generation_failed', ({ error: err }: { error: string }) => {
          setError(`Generation failed: ${err}`);
          setGeneratingId(null);
          setSubmitting(false);
        });
      } else {
        // If no socket, just navigate
        setTimeout(() => {
          store.reset();
          router.push('/assignments');
        }, 1500);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to create assignment. Please try again.');
      setSubmitting(false);
    }
  };

  const canProceedStep1 = store.title.trim().length > 0;

  return (
    <DashboardLayout title="Assignment" showBack backHref="/assignments">
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        {/* Page Header */}
        <div className="flex items-start gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Create Assignment</h1>
            <p className="text-xs text-gray-400 mt-0.5">Set up a new assignment for your students</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-[#1E1E2E] rounded-full"
            animate={{ width: step === 1 ? '50%' : '100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          <span className={step === 1 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
            Step 1
          </span>
          <div className="w-6 h-px bg-gray-200"></div>
          <span className={step === 2 ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
            Step 2
          </span>
        </div>

        {/* Generating overlay */}
        <AnimatePresence>
          {generatingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl"
              >
                {genDone ? (
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                ) : (
                  <div className="w-12 h-12 border-4 border-[#1E1E2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                )}
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {genDone ? 'Assignment Ready!' : 'Generating Assignment'}
                </h3>
                <p className="text-sm text-gray-500">{genStatus}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="border-2 border-blue-300 rounded-2xl p-5 bg-white"
            >
              <h2 className="font-bold text-gray-900 mb-0.5">Assignment Details</h2>
              <p className="text-xs text-gray-400 mb-4">Basic information about your assignment</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Assignment Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={store.title}
                    onChange={(e) => store.setTitle(e.target.value)}
                    placeholder="e.g. Quiz on Electricity and Magnetism"
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      Subject
                    </label>
                    <input
                      value={store.subject}
                      onChange={(e) => store.setSubject(e.target.value)}
                      placeholder="e.g. Physics"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      Class
                    </label>
                    <input
                      value={store.class}
                      onChange={(e) => store.setClass(e.target.value)}
                      placeholder="e.g. 10th"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => canProceedStep1 && setStep(2)}
                  disabled={!canProceedStep1}
                  className="flex items-center gap-2 bg-[#1E1E2E] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2D2D40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="border-2 border-blue-300 rounded-2xl p-5 bg-white"
            >
              <h2 className="font-bold text-gray-900 mb-0.5">Assignment Details</h2>
              <p className="text-xs text-gray-400 mb-4">Upload material and set question types</p>

              {/* File Upload */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all duration-200 ${
                  dragging
                    ? 'border-purple-400 bg-purple-50'
                    : store.uploadedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <Upload
                  size={22}
                  className={`mx-auto mb-2 ${
                    store.uploadedFile ? 'text-green-500' : 'text-gray-400'
                  }`}
                />
                {store.uploadedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-semibold text-green-700">{store.uploadedFile.name}</p>
                    <button
                      type="button"
                      onClick={() => store.setUploadedFile(null)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      Choose a file or drag &amp; drop it here
                    </p>
                    <p className="text-xs text-gray-400 mb-3">(PDF, TXT up to 10MB)</p>
                    <label className="inline-block cursor-pointer border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors font-medium">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) store.setUploadedFile(f);
                        }}
                      />
                    </label>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-2.5">
                  Upload images of your preferred document/image
                </p>
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={store.dueDate}
                    onChange={(e) => store.setDueDate(e.target.value)}
                    className="input-field pr-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Question Types */}
              <div className="mb-4">
                <div className="hidden lg:flex items-center gap-3 mb-2 px-0.5">
                  <span className="flex-1 text-xs font-semibold text-gray-600">Question Type</span>
                  <span className="text-xs font-semibold text-gray-600 w-[88px] text-center">
                    No. of Questions
                  </span>
                  <span className="text-xs font-semibold text-gray-600 w-[88px] text-center">
                    Marks Each
                  </span>
                  <span className="w-4"></span>
                </div>

                <div className="space-y-2">
                  {store.questionTypes.map((row) => (
                    <div key={row.id}>
                      <div className="hidden lg:block">
                        <QuestionTypeRowComponent row={row} />
                      </div>
                      <div className="lg:hidden">
                        <QuestionTypeRowComponent row={row} isMobile />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => store.addQuestionType()}
                  className="flex items-center gap-2 mt-3 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <Plus size={12} className="text-white" />
                  </div>
                  Add Question Type
                </button>

                <div className="flex justify-end gap-6 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <span>
                    Total Questions :{' '}
                    <strong className="text-gray-900">{store.totalQuestions()}</strong>
                  </span>
                  <span>
                    Total Marks :{' '}
                    <strong className="text-gray-900">{store.totalMarks()}</strong>
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Additional Information{' '}
                  <span className="text-gray-400 font-normal">(For better output)</span>
                </label>
                <div className="relative">
                  <textarea
                    value={store.additionalInfo}
                    onChange={(e) => store.setAdditionalInfo(e.target.value)}
                    placeholder="e.g. Generate a question paper for a 3 hour exam duration. Focus on chapters 3 and 4..."
                    rows={3}
                    className="input-field resize-none pr-10"
                  />
                  <Mic
                    size={15}
                    className="absolute right-3 bottom-3 text-gray-300 cursor-pointer hover:text-gray-500 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5 mb-4">
                  {error}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-between mt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#1E1E2E] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2D2D40] transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
