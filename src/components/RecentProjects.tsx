import React from 'react';
import { 
  MoreHorizontal, 
  Calendar, 
  Image, 
  CheckCircle, 
  AlertCircle,
  Clock,
  HardDrive,
  Cloud
} from 'lucide-react';
import { useStore } from '../store/useStore';

const RecentProjects: React.FC = () => {
  const { dashboardData, isLoading } = useStore();

  // Безопасное получение проектов с fallback значениями
  const projects = dashboardData?.projects || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Active';
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
          <p className="text-sm text-gray-600 mt-1">Your latest AI processing projects</p>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        <p className="text-sm text-gray-600 mt-1">Your latest AI processing projects</p>
      </div>
      
      {projects.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
          <p className="text-gray-600 mb-4">Create your first project to get started with AI image processing</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {projects.map((project) => (
            <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(project.status)}
                      <span className="text-xs font-medium text-gray-600">
                        {getStatusText(project.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{project.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Image className="w-3 h-3" />
                      <span>{project.files_count} files</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {project.storage === 'local' ? (
                        <HardDrive className="w-3 h-3" />
                      ) : (
                        <Cloud className="w-3 h-3" />
                      )}
                      <span>{project.storage === 'local' ? 'Local' : 'Yandex Disk'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900 font-medium">
                        {project.processed_count}/{project.files_count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${project.files_count > 0 ? (project.processed_count / project.files_count) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    {project.error_count > 0 && (
                      <p className="text-xs text-red-600 mt-1">{project.error_count} errors</p>
                    )}
                  </div>
                </div>
                
                <button className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentProjects;