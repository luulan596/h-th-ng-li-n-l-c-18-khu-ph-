import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded-full w-16"></div>
      </div>
      <div className="h-5 bg-slate-300 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="h-3 bg-slate-100 rounded w-full"></div>
      <div className="flex gap-2 pt-2">
        <div className="h-8 bg-slate-200 rounded-lg flex-1"></div>
        <div className="h-8 bg-slate-200 rounded-lg w-10"></div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-8"></div>
            <div className="h-4 bg-slate-300 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            <div className="h-6 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
