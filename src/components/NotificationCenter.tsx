import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Trash2, Settings, Filter, BookMarked as MarkAsRead, Archive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelativeTime } from '../utils/dateUtils';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  category: 'processing' | 'system' | 'project' | 'api' | 'storage';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const NotificationCenter: React.FC = () => {
  const notifications = useStore((state) => state.notifications);
  const addNotification = useStore((state) => state.addNotification);
  const markNotificationAsRead = useStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useStore((state) => state.markAllAsRead);
  const deleteNotification = useStore((state) => state.deleteNotification);
  const clearNotifications = useStore((state) => state.clearNotifications);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'archived' && !notification.archived) return false;
    if (filter !== 'archived' && notification.archived) return false;
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'system':
        return 'bg-gray-100 text-gray-700';
      case 'project':
        return 'bg-green-100 text-green-700';
      case 'api':
        return 'bg-purple-100 text-purple-700';
      case 'storage':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Categories</option>
                <option value="processing">Processing</option>
                <option value="system">System</option>
                <option value="project">Project</option>
                <option value="api">API</option>
                <option value="storage">Storage</option>
              </select>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => clearNotifications()}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(notification.category)}`}>
                              {notification.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                // Open notification settings
                setIsOpen(false);
              }}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Notification Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;