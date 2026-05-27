'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Sparkles, FileText, LayoutGrid, BookMarked, ClipboardList } from 'lucide-react';

const tools = [
  {
    icon: ClipboardList,
    title: 'Rubric Generator',
    description: 'Create detailed marking rubrics for any assignment automatically.',
    badge: 'Popular',
    badgeColor: 'bg-orange-100 text-orange-700',
    comingSoon: false,
  },
  {
    icon: FileText,
    title: 'Lesson Plan Creator',
    description: 'Generate structured lesson plans aligned to curriculum standards.',
    badge: 'New',
    badgeColor: 'bg-green-100 text-green-700',
    comingSoon: false,
  },
  {
    icon: LayoutGrid,
    title: 'Bloom\'s Taxonomy Mapper',
    description: 'Map your questions to Bloom\'s taxonomy levels for balanced assessments.',
    badge: null,
    badgeColor: '',
    comingSoon: true,
  },
  {
    icon: BookMarked,
    title: 'Curriculum Aligner',
    description: 'Align your content to CBSE, ICSE, or State Board curricula.',
    badge: null,
    badgeColor: '',
    comingSoon: true,
  },
];

export default function ToolkitPage() {
  return (
    <DashboardLayout title="AI Teacher's Toolkit">
      <div className="p-4 lg:p-6">
        <div className="flex items-start gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">AI Teacher&apos;s Toolkit</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Powerful AI tools to supercharge your teaching workflow.
            </p>
          </div>
        </div>

        {/* Feature banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} />
            <span className="font-bold text-sm">AI-Powered Teaching Tools</span>
          </div>
          <p className="text-xs text-purple-100 leading-relaxed">
            Save hours of preparation time with AI-generated rubrics, lesson plans, and more.
            Everything tailored to your curriculum and students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map(({ icon: Icon, title, description, badge, badgeColor, comingSoon }) => (
            <div
              key={title}
              className={`bg-white rounded-xl border border-gray-100 shadow-card p-5 ${
                comingSoon ? 'opacity-60' : 'hover:shadow-card-hover cursor-pointer'
              } transition-shadow duration-200 relative`}
            >
              {badge && (
                <span
                  className={`absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}
                >
                  {badge}
                </span>
              )}
              {comingSoon && (
                <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                  Coming Soon
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Icon size={20} className="text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
