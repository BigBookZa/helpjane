import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Play, 
  Pause, 
  Settings,
  Filter,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '../utils/dateUtils';
import { useStore } from '../store/useStore';

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'file' | 'project' | 'system' | 'user' | 'api';
  details: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

const ActivityLog: React.FC = () => {
  const { dashboardData } = useStore();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  // Получаем активность из dashboardData или используем пустой массив
  const activities: ActivityLogEntry[] = dashboardData?.activityLogs?.map((log: any) => ({
    id: log.id.toString(),
    timestamp: log.created_at,
    user: log.user_name || 'System',
    action: log.action,
    category: log.entity_type || 'system',
    details: log.details || '',
    severity: log.severity || 'low'
  })) || [];

  const getActionIcon = (action: string, category: string) => {
    if (action.includes('upload')) return <Upload className="w-4 h-4 text-blue-500" />;
    if (action.includes('download')) return <Download className="w-4 h-4 text-green-500" />;
    if (action.includes('edit') || action.includes('updated')) return <Edit3 className="w-4 h-4 text-orange-500" />;
    if (action.includes('delete')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes('processing') || action.includes('completed')) return <Play className="w-4 h-4 text-purple-500" />;
    if (action.includes('pause')) return <Pause className="w-4 h-4 text-gray-500" />;
    if (action.includes('settings')) return <Settings className="w-4 h-4 text-gray-600" />;
    
    switch (category) {
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <Activity className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all' && activity.category !== filter) return false;
    if (searchTerm && !activity.details.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !activity.action.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (dateRange.start || dateRange.end) {
      const activityDate = new Date(activity.timestamp);
      if (dateRange.start && activityDate < new Date(dateRange.start)) return false;
      if (dateRange.end && activityDate > new Date(dateRange.end)) return false;
    }
    
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
              <p className="text-sm text-gray-600">Recent system and user activities</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Categories</option>
                <option value="file">File Operations</option>
                <option value="project">Project Management</option>
                <option value="system">System Events</option>
                <option value="user">User Actions</option>
                <option value="api">API Events</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Search activities..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActivities.slice(0, isExpanded ? undefined : 5).map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(activity.action, activity.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(activity.severity)}`}>
                          {activity.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {activity.details}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          by {activity.user}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {activity.category}
                        </span>
                      </div>
                      
                      {activity.metadata?.url && (
                        <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                          <span>View details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isExpanded && filteredActivities.length > 5 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
          >
            View all {filteredActivities.length} activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;