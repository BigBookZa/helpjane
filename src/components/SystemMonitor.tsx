import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  Database,
  Cloud,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: 'online' | 'offline' | 'slow';
  apiStatus: 'healthy' | 'degraded' | 'down';
  queueHealth: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
}

const SystemMonitor: React.FC = () => {
  const { dashboardData, settings, isLoading } = useStore();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    storage: 78,
    network: 'online',
    apiStatus: 'healthy',
    queueHealth: 'healthy',
    lastUpdate: new Date().toISOString()
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Безопасное получение данных с fallback значениями
  const queueStats = dashboardData?.queueStats || {
    totalInQueue: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    queueStatus: 'idle'
  };

  const systemHealth = dashboardData?.systemHealth || {
    status: 'unknown',
    uptime: 0,
    memoryUsage: { heapUsed: 0, heapTotal: 0 },
    lastUpdate: new Date().toISOString()
  };

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 8)),
        storage: Math.max(50, Math.min(95, prev.storage + (Math.random() - 0.5) * 2)),
        network: Math.random() > 0.95 ? 'slow' : 'online',
        apiStatus: settings?.openai_api_key ? (Math.random() > 0.9 ? 'degraded' : 'healthy') : 'down',
        queueHealth: queueStats.failed > 5 ? 'critical' : queueStats.failed > 2 ? 'warning' : 'healthy',
        lastUpdate: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [settings?.openai_api_key, queueStats.failed]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-500';
      case 'warning':
      case 'degraded':
      case 'slow':
        return 'text-orange-500';
      case 'critical':
      case 'down':
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
      case 'degraded':
      case 'slow':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'down':
      case 'offline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getMetricTrend = (value: number, threshold: { warning: number; critical: number }) => {
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'healthy';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));
    setRefreshing(false);
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Monitor</h3>
              <p className="text-sm text-gray-600">
                Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-1 mb-1 ${getStatusColor(metrics.apiStatus)}`}>
              {getStatusIcon(metrics.apiStatus)}
              <span className="text-sm font-medium">API</span>
            </div>
            <p className="text-xs text-gray-600 capitalize">{metrics.apiStatus}</p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-1 mb-1 ${getStatusColor(metrics.network)}`}>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <p className="text-xs text-gray-600 capitalize">{metrics.network}</p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-1 mb-1 ${getStatusColor(metrics.queueHealth)}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Queue</span>
            </div>
            <p className="text-xs text-gray-600 capitalize">{metrics.queueHealth}</p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-1 mb-1 ${getStatusColor(queueStats.queueStatus === 'running' ? 'healthy' : 'warning')}`}>
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Processing</span>
            </div>
            <p className="text-xs text-gray-600 capitalize">{queueStats.queueStatus}</p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Resource Usage */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resource Usage</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">CPU Usage</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getMetricTrend(metrics.cpu, { warning: 70, critical: 85 }) === 'critical' ? 'bg-red-500' :
                      getMetricTrend(metrics.cpu, { warning: 70, critical: 85 }) === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${metrics.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">Memory Usage</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.memory.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getMetricTrend(metrics.memory, { warning: 75, critical: 90 }) === 'critical' ? 'bg-red-500' :
                      getMetricTrend(metrics.memory, { warning: 75, critical: 90 }) === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.memory}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-700">Storage Usage</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.storage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getMetricTrend(metrics.storage, { warning: 80, critical: 95 }) === 'critical' ? 'bg-red-500' :
                      getMetricTrend(metrics.storage, { warning: 80, critical: 95 }) === 'warning' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${metrics.storage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">API Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Response Time</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">1.2s</div>
                <div className="text-xs text-gray-500">Average</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Success Rate</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">98.5%</div>
                <div className="text-xs text-gray-500">Last 24h</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Requests/min</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {dashboardData?.apiUsage?.requestsToday || 0}
                </div>
                <div className="text-xs text-gray-500">Today</div>
              </div>
            </div>
          </div>

          {/* Queue Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Queue Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{queueStats.totalInQueue}</div>
                <div className="text-xs text-gray-600">In Queue</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{queueStats.processing}</div>
                <div className="text-xs text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{queueStats.completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{queueStats.failed}</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(metrics.cpu > 85 || metrics.memory > 90 || metrics.storage > 95 || queueStats.failed > 5) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">System Alerts</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {metrics.cpu > 85 && <li>• High CPU usage detected ({metrics.cpu.toFixed(1)}%)</li>}
                    {metrics.memory > 90 && <li>• High memory usage detected ({metrics.memory.toFixed(1)}%)</li>}
                    {metrics.storage > 95 && <li>• Storage space running low ({metrics.storage.toFixed(1)}%)</li>}
                    {queueStats.failed > 5 && <li>• Multiple processing failures detected ({queueStats.failed} failed)</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;