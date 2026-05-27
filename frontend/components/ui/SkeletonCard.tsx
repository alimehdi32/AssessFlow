export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="flex gap-2 mb-3">
        <div className="h-3 bg-gray-100 rounded-full w-16"></div>
        <div className="h-3 bg-gray-100 rounded-full w-14"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>
    </div>
  );
}
