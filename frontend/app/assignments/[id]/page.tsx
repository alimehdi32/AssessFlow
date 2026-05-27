'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import {
  Download,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  marks: number;
  difficulty: string;
  answer?: string | null;
  order: number;
}

interface Section {
  id: string;
  title: string;
  instruction?: string | null;
  order: number;
  questions: Question[];
}

interface Assignment {
  id: string;
  title: string;
  subject?: string;
  class?: string;
  dueDate?: string;
  createdAt: string;
  status: string;
  totalMarks?: number;
  sections: Section[];
  user?: {
    schoolName: string;
    schoolCity: string;
    name: string;
  };
}

const difficultyColors: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HARD: 'bg-red-100 text-red-700 border-red-200',
};

const difficultyLabel: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Moderate',
  HARD: 'Hard',
};

export default function AssignmentOutputPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('Regenerating questions...');
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const fetchAssignment = useCallback(async () => {
    const res = await api.get(`/assignments/${id}`);
    return res.data.data.assignment as Assignment;
  }, [id]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setAssignment(await fetchAssignment());
      } catch {
        setError('Failed to load assignment. It may not exist or you may not have access.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, fetchAssignment]);

  // Poll while generation is in progress (e.g. page refresh mid-generation)
  useEffect(() => {
    if (!assignment || !['PENDING', 'GENERATING'].includes(assignment.status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await fetchAssignment();
        setAssignment(updated);
      } catch {
        /* ignore poll errors */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [assignment?.status, fetchAssignment]);

  const handleDownloadPDF = async () => {
    if (!assignment) return;
    setDownloading(true);
    try {
      const res = await api.get(`/assignments/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!assignment || !user?.id) return;
    if (!confirm('Regenerate this assignment? Existing questions will be replaced.')) return;

    try {
      setRegenerating(true);
      setGenStatus('Starting regeneration...');
      await api.post(`/assignments/${id}/regenerate`);
      setAssignment((prev) => (prev ? { ...prev, status: 'GENERATING', sections: [] } : prev));

      const socket = connectSocket(user.id);
      const onProgress = ({ message }: { message: string }) => setGenStatus(message);
      const onComplete = async () => {
        socket.off('generation_progress', onProgress);
        socket.off('generation_completed', onComplete);
        socket.off('generation_failed', onFailed);
        setAssignment(await fetchAssignment());
        setRegenerating(false);
      };
      const onFailed = ({ error: err }: { error: string }) => {
        socket.off('generation_progress', onProgress);
        socket.off('generation_completed', onComplete);
        socket.off('generation_failed', onFailed);
        alert(`Regeneration failed: ${err}`);
        setRegenerating(false);
      };

      socket.on('generation_progress', onProgress);
      socket.on('generation_completed', onComplete);
      socket.on('generation_failed', onFailed);
    } catch {
      alert('Failed to start regeneration. Please try again.');
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Assignment" showBack backHref="/assignments">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading assignment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assignment) {
    return (
      <DashboardLayout title="Assignment" showBack backHref="/assignments">
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900 mb-2">Assignment Not Found</h2>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <Link
              href="/assignments"
              className="inline-flex items-center gap-2 bg-[#1E1E2E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2D2D40] transition-colors"
            >
              <ArrowLeft size={14} /> Back to Assignments
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (assignment.status === 'GENERATING' || assignment.status === 'PENDING' || regenerating) {
    return (
      <DashboardLayout title="Assignment" showBack backHref="/assignments">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-[#1E1E2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-gray-900 mb-1">Generating Questions...</h2>
            <p className="text-sm text-gray-500">{genStatus}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sections = assignment.sections || [];
  const totalMarks =
    assignment.totalMarks ??
    sections.reduce(
      (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.marks, 0),
      0
    );
  const schoolName = assignment.user?.schoolName || 'Delhi Public School';
  const schoolCity = assignment.user?.schoolCity || 'Bokaro Steel City';

  return (
    <DashboardLayout title="Assignment" showBack backHref="/assignments">
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{assignment.title}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                {assignment.subject && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} /> {assignment.subject}
                  </span>
                )}
                {assignment.class && <span>Class {assignment.class}</span>}
                {assignment.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Due{' '}
                    {new Date(assignment.dueDate).toLocaleDateString('en-GB')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Award size={11} /> Total Marks: {totalMarks}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="hidden sm:flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
              Regenerate
            </button>
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="hidden sm:flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              {showAnswerKey ? 'Hide' : 'Show'} Answer Key
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 bg-[#1E1E2E] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#2D2D40] transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {/* Exam Paper */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* School Header */}
          <div className="bg-gray-900 text-white px-6 py-5 text-center">
            <h2 className="text-base font-bold tracking-wide uppercase mb-0.5">{schoolName}</h2>
            <p className="text-xs text-gray-300">{schoolCity}, Jharkhand</p>
          </div>

          {/* Exam Info */}
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                {assignment.title}
              </h3>
              {assignment.subject && (
                <p className="text-sm text-gray-500 mt-0.5">Subject: {assignment.subject}</p>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
              <span>Class: {assignment.class || 'N/A'}</span>
              <span>Total Marks: {totalMarks}</span>
              <span>
                Date:{' '}
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleDateString('en-GB')
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </label>
                <div className="mt-1 border-b border-gray-300 pb-1 min-h-[28px]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Roll Number
                </label>
                <div className="mt-1 border-b border-gray-300 pb-1 min-h-[28px]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Section
                </label>
                <div className="mt-1 border-b border-gray-300 pb-1 min-h-[28px]" />
              </div>
            </div>
          </div>

          {/* General Instructions */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-1">General Instructions:</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>All questions are compulsory unless otherwise mentioned.</li>
              <li>Read each question carefully before attempting.</li>
              <li>Write your answers clearly and legibly.</li>
            </ul>
          </div>

          {/* Sections */}
          <div className="px-6 py-5 space-y-8">
            {sections.map((section, sectionIndex) => {
              const sectionMarks = section.questions.reduce((s, q) => s + q.marks, 0);
              return (
                <div key={section.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {String.fromCharCode(65 + sectionIndex)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">{section.title}</h4>
                      {section.instruction && (
                        <p className="text-xs text-gray-500 mt-0.5">{section.instruction}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {section.questions.length} question
                        {section.questions.length !== 1 ? 's' : ''} · {sectionMarks} marks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-10">
                    {section.questions.map((q, qi) => (
                      <div key={q.id} className="pb-4 border-b border-gray-50 last:border-b-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-sm font-bold text-gray-500 flex-shrink-0 mt-0.5">
                              {qi + 1}.
                            </span>
                            <p className="text-sm text-gray-800 leading-relaxed font-medium">
                              {q.text}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {q.difficulty && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                  difficultyColors[q.difficulty] || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {difficultyLabel[q.difficulty] || q.difficulty}
                              </span>
                            )}
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold border border-gray-200">
                              {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                            </span>
                          </div>
                        </div>

                        {showAnswerKey && q.answer && (
                          <div className="ml-6 mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-green-700 mb-0.5">Answer:</p>
                            <p className="text-xs text-green-800">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {sections.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No questions generated yet.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">
              Generated by VedaAI · {new Date(assignment.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="sm:hidden mt-4 flex flex-col gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors bg-white disabled:opacity-60"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
            Regenerate
          </button>
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors bg-white"
          >
            {showAnswerKey ? 'Hide' : 'Show'} Answer Key
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
