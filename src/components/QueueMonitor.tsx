import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { queueManager } from '../services/queue';

interface QueueMonitorProps {
  onOpenSettings?: () => void;
}

const QueueMonitor: React.FC<QueueMonitorProps> = ({ onOpenSettings }) => {
  const queueStats = useStore((state) => state.queueStats);
  const files = useStore((state) => state.files);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePause = () => {
    queueManager.pause();
  };

  const handleResume = () => {
    queueManager.start();
  };

  const handleStop = () => {
    queueManager.stop();
  };

  const handleRetryFailed = () => {
    queueManager.retryFailedFiles();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600';
      case 'paused':
        return 'text-orange-600';
      case 'stopped':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-green-600 animate-pulse" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-orange-600" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const tokensPercentage = (queueStats.tokensUsedToday / queueStats.tokensLimit) * 100;

  // Get recent activity
  const recentFiles = files
    .filter(f => f.status === 'completed' || f.status === 'error')
    .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(queueStats.queueStatus)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Queue Monitor</h3>
              <p className="text-sm text-gray-600">
                Processing status: <span className={`font-medium ${getStatusColor(queueStats.queueStatus)}`}>
                  {queueStats.queueStatus}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{queueStats.totalInQueue}</div>
            <div className="text-xs text-gray-600">In Queue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{queueStats.processing}</div>
            <div className="text-xs text-gray-600">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {queueStats.queueStatus === 'running' ? (
              <button
                onClick={handlePause}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
            
            {queueStats.failed > 0 && (
              <button
                onClick={handleRetryFailed}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Failed ({queueStats.failed})</span>
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            ETA: {queueStats.estimatedTimeRemaining}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Performance</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{queueStats.avgProcessingTime}</div>
              <div className="text-xs text-gray-600">Avg. processing time</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Throughput</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(queueStats.completed / Math.max(1, Math.ceil((Date.now() - Date.now()) / (1000 * 60 * 60))))}
                /hour
              </div>
              <div className="text-xs text-gray-600">Files processed</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {queueStats.completed + queueStats.failed > 0 
                  ? ((queueStats.failed / (queueStats.completed + queueStats.failed)) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-xs text-gray-600">Current session</div>
            </div>
          </div>

          {/* Token Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">API Token Usage Today</span>
              <span className="text-sm text-gray-600">
                {queueStats.tokensUsedToday.toLocaleString()} / {queueStats.tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  tokensPercentage > 90 ? 'bg-red-500' : 
                  tokensPercentage > 70 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(tokensPercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{tokensPercentage.toFixed(1)}% used</span>
              <span>Resets at midnight</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    file.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">
                    {new Date(file.uploaded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-gray-900">
                    {file.status === 'completed' ? 'Completed' : 'Failed'}: {file.filename}
                  </span>
                </div>
              ))}
              {recentFiles.length === 0 && (
                <div className="text-xs text-gray-500 italic">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueMonitor;