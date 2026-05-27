'use client';
import { Minus, Plus, X } from 'lucide-react';
import { QuestionTypeRow as RowType, useAssignmentStore, QUESTION_TYPE_OPTIONS } from '@/store/assignmentStore';

interface Props {
  row: RowType;
  isMobile?: boolean;
}

export default function QuestionTypeRowComponent({ row, isMobile }: Props) {
  const { updateQuestionType, removeQuestionType } = useAssignmentStore();

  const Counter = ({
    field,
    value,
  }: {
    field: 'quantity' | 'marks';
    value: number;
  }) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => updateQuestionType(row.id, field, Math.max(1, value - 1))}
        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0"
      >
        <Minus size={11} />
      </button>
      <span className="w-7 text-center text-sm font-semibold text-gray-800">{value}</span>
      <button
        type="button"
        onClick={() => updateQuestionType(row.id, field, value + 1)}
        className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0"
      >
        <Plus size={11} />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2.5">
          <select
            value={row.type}
            onChange={(e) => updateQuestionType(row.id, 'type', e.target.value)}
            className="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none flex-1 mr-2 appearance-none cursor-pointer"
          >
            {QUESTION_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeQuestionType(row.id)}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-gray-400 mb-1.5">No. of Questions</p>
            <Counter field="quantity" value={row.quantity} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1.5">Marks Each</p>
            <Counter field="marks" value={row.marks} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1">
        <select
          value={row.type}
          onChange={(e) => updateQuestionType(row.id, 'type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white cursor-pointer"
        >
          {QUESTION_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <Counter field="quantity" value={row.quantity} />
      <Counter field="marks" value={row.marks} />
      <button
        type="button"
        onClick={() => removeQuestionType(row.id)}
        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
