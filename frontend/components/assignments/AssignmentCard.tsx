'use client';
import { useState } from 'react';
import { MoreVertical, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  createdAt: string;
  dueDate?: string;
  status: string;
  subject?: string;
  class?: string;
}

interface Props {
  assignment: Assignment;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700',
  GENERATING: 'bg-yellow-50 text-yellow-700',
  PENDING: 'bg-gray-50 text-gray-500',
  FAILED: 'bg-red-50 text-red-600',
};

export default function AssignmentCard({ assignment, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 relative hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/assignments/${assignment.id}`}
          className="font-semibold text-gray-900 text-sm hover:text-gray-700 flex-1 pr-2 leading-tight"
        >
          {assignment.title}
        </Link>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreVertical size={14} className="text-gray-400" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-7 z-50 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[150px] py-1 overflow-hidden"
                >
                  <Link
                    href={`/assignments/${assignment.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={13} /> View Assignment
                  </Link>
                  <button
                    onClick={() => {
                      onDelete(assignment.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subject / Class tags */}
      {(assignment.subject || assignment.class) && (
        <div className="flex items-center gap-2 mb-2.5">
          {assignment.subject && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {assignment.subject}
            </span>
          )}
          {assignment.class && (
            <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              Class {assignment.class}
            </span>
          )}
          {assignment.status && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                statusColors[assignment.status] || 'bg-gray-50 text-gray-500'
              }`}
            >
              {assignment.status.toLowerCase()}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span>
          Assigned on:{' '}
          <span className="font-medium text-gray-600">{formatDate(assignment.createdAt)}</span>
        </span>
        {assignment.dueDate && (
          <span>
            Due:{' '}
            <span className="font-medium text-gray-600">{formatDate(assignment.dueDate)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
