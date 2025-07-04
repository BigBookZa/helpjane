import React, { useEffect, useState } from 'react';
import { 
  FolderOpen, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import StatsCard from '../components/StatsCard';
import RecentProjects from '../components/RecentProjects';
import QueueMonitor from '../components/QueueMonitor';
import SystemMonitor from '../components/SystemMonitor';
import ActivityLog from '../components/ActivityLog';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    dashboardData, 
    loadDashboardData, 
    loadProjects, 
    loadSettings,
    isLoading, 
    error 
  } = useStore();

  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Load all dashboard data on mount
    const loadData = async () => {
      if (!isOnline) return;
      
      try {
        await Promise.allSettled([
          loadDashboardData(),
          loadProjects(),
          loadSettings()
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, [loadDashboardData, loadProjects, loadSettings, isOnline, retryCount]);

  const handleRefresh = async () => {
    if (!isOnline) {
      alert('You are currently offline. Please check your internet connection.');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await loadDashboardData();
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Offline state
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">You're offline</h2>
          <p className="text-gray-600 mb-4">
            Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !dashboardData && retryCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={handleRetry}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Retrying...' : 'Try Again'}</span>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Check Settings
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700">
                Error: {error}
                <br />
                Retry Count: {retryCount}
                <br />
                Online: {isOnline ? 'Yes' : 'No'}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Fallback data for when API is unavailable but we want to show the UI
  const stats = dashboardData?.stats || {
    totalProjects: 0,
    activeProjects: 0,
    totalFiles: 0,
    processedFiles: 0,
    successRate: 0,
    avgProcessingTime: '0s'
  };

  const queueStats = dashboardData?.queueStats || {
    totalInQueue: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    queueStatus: 'idle'
  };

  const apiUsage = dashboardData?.apiUsage || {
    tokensUsedToday: 0,
    requestsToday: 0,
    costToday: 0,
    tokensLimit: 50000
  };

  const systemHealth = dashboardData?.systemHealth || {
    status: 'unknown',
    uptime: 0,
    memoryUsage: { heapUsed: 0, heapTotal: 0 },
    lastUpdate: new Date().toISOString()
  };

  const statsCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects.toString(),
      change: `${stats.activeProjects} active`,
      changeType: 'neutral' as const,
      icon: FolderOpen,
      color: 'blue' as const
    },
    {
      title: 'Files Processed',
      value: stats.processedFiles.toLocaleString(),
      change: `${stats.totalFiles} total`,
      changeType: 'positive' as const,
      icon: Image,
      color: 'emerald' as const
    },
    {
      title: 'Success Rate',
      value: stats.successRate.toFixed(1) + '%',
      change: stats.avgProcessingTime + ' avg',
      changeType: stats.successRate > 90 ? 'positive' : 'neutral' as const,
      icon: CheckCircle,
      color: 'green' as const
    },
    {
      title: 'Queue Status',
      value: queueStats.totalInQueue.toString(),
      change: queueStats.queueStatus,
      changeType: 'neutral' as const,
      icon: Clock,
      color: 'orange' as const
    }
  ];

  const tokensPercentage = (apiUsage.tokensUsedToday / apiUsage.tokensLimit) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your AI image processing activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span>Status: </span>
            <span className={`font-medium ${
              isOnline && systemHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {!isOnline ? 'Offline' : systemHealth.status}
            </span>
          </div>
          
          {error && (
            <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              API Error
            </div>
          )}
          
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>
        <div>
          <QueueMonitor onOpenSettings={() => navigate('/settings')} />
        </div>
      </div>

      {/* System Monitoring Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemMonitor />
        <ActivityLog />
      </div>

      {/* API Usage and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">API Usage</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tokens Used Today</span>
              <span className="text-sm font-medium">
                {apiUsage.tokensUsedToday.toLocaleString()} / {apiUsage.tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  tokensPercentage > 90 ? 'bg-red-500' : 
                  tokensPercentage > 70 ? 'bg-orange-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(tokensPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{tokensPercentage.toFixed(1)}% used</span>
              <span>Resets at midnight</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Requests Today</span>
                <span className="font-medium">{apiUsage.requestsToday}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Cost Today</span>
                <span className="font-medium">${apiUsage.costToday.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Processing Time</span>
              <span className="text-sm font-medium">{stats.avgProcessingTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Queue Wait Time</span>
              <span className="text-sm font-medium">
                {queueStats.totalInQueue > 0 ? 'Processing...' : 'No queue'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className={`text-sm font-medium ${
                stats.successRate > 90 ? 'text-green-600' : 
                stats.successRate > 70 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {stats.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Uptime</span>
              <span className="text-sm font-medium">
                {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message for New Users */}
      {stats.totalProjects === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Helper for Jane!</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first project and uploading images for AI analysis.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={() => navigate('/projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Project</span>
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg"
            >
              Configure Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;