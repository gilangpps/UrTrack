import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  stalled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  critical: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-yellow-600',
  low: 'text-gray-500',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-urtrack-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{project.title}</h3>
          {project.organization && (
            <p className="text-sm text-gray-500 mt-0.5">{project.organization.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3">
          {project.status && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors.active}`}>
              {project.status}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {project.description || 'No description'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {project.priority && (
            <span className={`font-medium ${priorityColors[project.priority] || priorityColors.medium}`}>
              {project.priority.toUpperCase()}
            </span>
          )}
          {project.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(parseISO(project.deadline), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
