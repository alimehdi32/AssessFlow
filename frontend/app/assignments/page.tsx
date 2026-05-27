'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Search, Filter, Plus, SearchX } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Assignment {
  id: string;
  title: string;
  createdAt: string;
  dueDate?: string;
  status: string;
  subject?: string;
  class?: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      setAssignments(res.data.data?.assignments || []);
    } catch {
      // If backend not available, show empty state gracefully
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete assignment.');
    }
  };

  return (
    <DashboardLayout title="Assignment" assignmentCount={assignments.length}>
      <div className="p-4 lg:p-6">
        {/* Page Header */}
        <div className="flex items-start gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Assignments</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        {/* Search + Filter (shown when not loading and has assignments) */}
        {!loading && assignments.length > 0 && (
          <div className="flex gap-3 mb-5">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0 bg-white">
              <Filter size={14} /> Filter By
            </button>
            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Assignment"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <SkeletonCard key={i} />
              ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assignments.length === 0 && (
          <div className="border-2 border-[#7C3AED] rounded-2xl bg-white flex flex-col items-center justify-center py-16 px-8 text-center">
            {/* Magnifier illustration */}
            <div className="relative w-28 h-28 mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-gray-300 bg-gray-100 flex items-center justify-center absolute top-2 left-2">
                <SearchX size={32} className="text-gray-300" />
              </div>
              {/* Magnifier handle */}
              <div className="absolute bottom-0 right-0 w-10 h-3 bg-gray-300 rounded-full rotate-45 origin-right"></div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-2">No assignments yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
              Create your first assignment to start collecting and grading student submissions. You
              can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            <Link
              href="/create"
              className="flex items-center gap-2 bg-[#1E1E2E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#2D2D40] transition-colors"
            >
              <Plus size={14} /> Create Your First Assignment
            </Link>
          </div>
        )}

        {/* Assignment Grid */}
        {!loading && assignments.length > 0 && (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {assignments.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <AssignmentCard assignment={a} onDelete={handleDelete} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Desktop "Create Assignment" bottom button */}
        {!loading && assignments.length > 0 && (
          <div className="hidden lg:flex justify-center mt-8">
            <Link
              href="/create"
              className="flex items-center gap-2 bg-[#1E1E2E] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#2D2D40] transition-colors shadow-lg"
            >
              <Plus size={14} /> Create Assignment
            </Link>
          </div>
        )}

        {/* Mobile FAB */}
        <Link
          href="/create"
          className="lg:hidden fixed bottom-20 right-5 w-12 h-12 bg-[#1E1E2E] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#2D2D40] transition-colors z-30"
        >
          <Plus size={20} />
        </Link>
      </div>
    </DashboardLayout>
  );
}
