import { create } from 'zustand';

export interface QuestionTypeRow {
  id: string;
  type: string;
  quantity: number;
  marks: number;
}

interface AssignmentWizardState {
  step: number;
  title: string;
  subject: string;
  class: string;
  dueDate: string;
  questionTypes: QuestionTypeRow[];
  additionalInfo: string;
  uploadedFile: File | null;
  generatingAssignmentId: string | null;
  setStep: (step: number) => void;
  setTitle: (title: string) => void;
  setSubject: (subject: string) => void;
  setClass: (cls: string) => void;
  setDueDate: (date: string) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, field: keyof QuestionTypeRow, value: string | number) => void;
  setAdditionalInfo: (info: string) => void;
  setUploadedFile: (file: File | null) => void;
  setGeneratingAssignmentId: (id: string | null) => void;
  reset: () => void;
  totalQuestions: () => number;
  totalMarks: () => number;
}

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
];

const defaultRows: QuestionTypeRow[] = [
  { id: '1', type: QUESTION_TYPES[0], quantity: 4, marks: 1 },
  { id: '2', type: QUESTION_TYPES[1], quantity: 3, marks: 2 },
];

export const useAssignmentStore = create<AssignmentWizardState>((set, get) => ({
  step: 1,
  title: '',
  subject: '',
  class: '',
  dueDate: '',
  questionTypes: defaultRows,
  additionalInfo: '',
  uploadedFile: null,
  generatingAssignmentId: null,
  setStep: (step) => set({ step }),
  setTitle: (title) => set({ title }),
  setSubject: (subject) => set({ subject }),
  setClass: (cls) => set({ class: cls }),
  setDueDate: (dueDate) => set({ dueDate }),
  addQuestionType: () =>
    set((state) => ({
      questionTypes: [
        ...state.questionTypes,
        {
          id: Date.now().toString(),
          type: QUESTION_TYPES[state.questionTypes.length % QUESTION_TYPES.length],
          quantity: 5,
          marks: 5,
        },
      ],
    })),
  removeQuestionType: (id) =>
    set((state) => ({ questionTypes: state.questionTypes.filter((qt) => qt.id !== id) })),
  updateQuestionType: (id, field, value) =>
    set((state) => ({
      questionTypes: state.questionTypes.map((qt) =>
        qt.id === id ? { ...qt, [field]: value } : qt
      ),
    })),
  setAdditionalInfo: (additionalInfo) => set({ additionalInfo }),
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setGeneratingAssignmentId: (generatingAssignmentId) => set({ generatingAssignmentId }),
  reset: () =>
    set({
      step: 1,
      title: '',
      subject: '',
      class: '',
      dueDate: '',
      questionTypes: defaultRows,
      additionalInfo: '',
      uploadedFile: null,
      generatingAssignmentId: null,
    }),
  totalQuestions: () => get().questionTypes.reduce((sum, qt) => sum + qt.quantity, 0),
  totalMarks: () => get().questionTypes.reduce((sum, qt) => sum + qt.quantity * qt.marks, 0),
}));

export const QUESTION_TYPE_OPTIONS = QUESTION_TYPES;
