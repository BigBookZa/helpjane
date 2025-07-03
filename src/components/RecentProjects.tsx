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

const RecentProjects: React.FC = () => {
  const projects = [
    {
      id: 1,
      name: 'E-commerce Product Photos',
      description: 'AI descriptions for online store items',
      created: '2 days ago',
      filesCount: 156,
      processed: 142,
      errors: 3,
      status: 'processing',
      storage: 'local'
    },
    {
      id: 2,
      name: 'Nature Photography Collection',
      description: 'Wildlife and landscape categorization',
      created: '5 days ago',
      filesCount: 89,
      processed: 89,
      errors: 0,
      status: 'completed',
      storage: 'yandex'
    },
    {
      id: 3,
      name: 'Real Estate Listings',
      description: 'Property descriptions and highlights',
      created: '1 week ago',
      filesCount: 234,
      processed: 198,
      errors: 12,
      status: 'processing',
      storage: 'local'
    }
  ];

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
        return 'Pending';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        <p className="text-sm text-gray-600 mt-1">Your latest AI processing projects</p>
      </div>
      
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
                    <span>{project.created}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Image className="w-3 h-3" />
                    <span>{project.filesCount} files</span>
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
                      {project.processed}/{project.filesCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(project.processed / project.filesCount) * 100}%` }}
                    ></div>
                  </div>
                  {project.errors > 0 && (
                    <p className="text-xs text-red-600 mt-1">{project.errors} errors</p>
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
    </div>
  );
};

export default RecentProjects;