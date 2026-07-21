import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'row' | 'detail';
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="h-5 bg-gray-200 rounded-full w-16" />
      <div className="h-3 bg-gray-200 rounded w-12" />
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  if (type === 'detail') return <SkeletonDetail />;
  if (type === 'row') return <div className="space-y-3">{[...Array(count)].map((_, i) => <SkeletonRow key={i} />)}</div>;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(count)].map((_, i) => <SkeletonCard key={i} />)}</div>;
}
