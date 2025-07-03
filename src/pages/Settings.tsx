import React, { useState } from 'react';
import { 
  Save, 
  TestTube, 
  Key, 
  MessageCircle, 
  Database, 
  Clock, 
  Zap, 
  Shield,
  Download,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ImportExportModal from '../components/ImportExportModal';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');

  const tabs = [
    { id: 'api', name: 'API Settings', icon: Key },
    { id: 'telegram', name: 'Telegram', icon: MessageCircle },
    { id: 'storage', name: 'Storage', icon: Database },
    { id: 'processing', name: 'Processing', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'backup', name: 'Backup', icon: Download }
  ];

  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleExportSettings = () => {
    setImportExportMode('export');
    setShowImportExportModal(true);
  };

  const handleImportSettings = () => {
    setImportExportMode('import');
    setShowImportExportModal(true);
  };

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ChatGPT Vision API</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex space-x-3">
              <input
                type="password"
                placeholder="sk-..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2">
                <TestTube className="w-4 h-4" />
                <span>Test</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your OpenAI API key for ChatGPT Vision access
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="gpt-4-vision-preview">GPT-4 Vision Preview</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                defaultValue="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              defaultValue="0.7"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Conservative (0)</span>
              <span>Balanced (1)</span>
              <span>Creative (2)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">API Usage Limits</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Daily Requests</div>
            <div className="text-lg font-semibold text-gray-900">1,247 / 5,000</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.9%' }}></div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Monthly Tokens</div>
            <div className="text-lg font-semibold text-gray-900">45.2K / 100K</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '45.2%' }}></div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Cost This Month</div>
            <div className="text-lg font-semibold text-gray-900">$23.45</div>
            <div className="text-xs text-gray-500 mt-1">Est. $52 total</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTelegramSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Telegram Bot Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bot Token
            </label>
            <input
              type="password"
              placeholder="123456789:ABC..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your bot token from @BotFather on Telegram
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat ID
            </label>
            <input
              type="text"
              placeholder="-1001234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Chat ID where notifications will be sent
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Notification Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Project completion notifications</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Error notifications</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Daily summary reports</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">API usage warnings</span>
          </label>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Test Connection</h4>
            <p className="text-sm text-blue-700 mt-1">
              Send a test message to verify your Telegram configuration
            </p>
            <button className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
              Send Test Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Configuration</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Default Storage</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="radio" name="storage" value="local" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Local Storage (WordPress uploads directory)</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="radio" name="storage" value="yandex" className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Yandex Disk</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Yandex Disk Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OAuth Token
            </label>
            <input
              type="password"
              placeholder="y0_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Yandex Disk OAuth token for API access
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Folder
            </label>
            <input
              type="text"
              defaultValue="/helper-for-jane"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Base folder path on Yandex Disk for storing project files
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">File Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              defaultValue="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Formats
            </label>
            <select multiple className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20">
              <option value="jpg" selected>JPG</option>
              <option value="jpeg" selected>JPEG</option>
              <option value="png" selected>PNG</option>
              <option value="webp" selected>WebP</option>
              <option value="heic">HEIC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concurrent Processing
            </label>
            <input
              type="number"
              defaultValue="3"
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of files to process simultaneously
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Queue Check Interval (seconds)
            </label>
            <input
              type="number"
              defaultValue="30"
              min="10"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              How often to check for new files to process
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Retry Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Retries
            </label>
            <input
              type="number"
              defaultValue="3"
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Delay (seconds)
            </label>
            <input
              type="number"
              defaultValue="60"
              min="10"
              max="3600"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (seconds)
            </label>
            <input
              type="number"
              defaultValue="120"
              min="30"
              max="600"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Thumbnail Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Thumbnail Size
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="small">Small (150x150)</option>
              <option value="medium" selected>Medium (300x300)</option>
              <option value="large">Large (500x500)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Quality
            </label>
            <input
              type="range"
              min="50"
              max="100"
              defaultValue="85"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50%</span>
              <span>85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Control</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Require authentication for all API endpoints</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Enable IP whitelist</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Log all file operations</span>
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Data Protection</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period (days)
            </label>
            <input
              type="number"
              defaultValue="365"
              min="30"
              max="3650"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              How long to keep processed files and data
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Encrypt sensitive data at rest</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Anonymize API logs</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Export Settings</h4>
            <div className="space-y-3">
              <button 
                onClick={handleExportSettings}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Export Plugin Settings</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download className="w-4 h-4" />
                <span>Export All Projects</span>
              </button>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Download className="w-4 h-4" />
                <span>Export Templates</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Import Settings</h4>
            <div className="space-y-3">
              <button 
                onClick={handleImportSettings}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Upload className="w-4 h-4" />
                <span>Import Settings</span>
              </button>
              <p className="text-xs text-gray-600">
                Import settings from a previously exported JSON file
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Automatic Backup</h4>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Enable automatic daily backups</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Retention (days)
            </label>
            <input
              type="number"
              defaultValue="30"
              min="7"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Backup Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Backups include plugin settings, project configurations, and templates. 
              Original image files are not included in backups and should be backed up separately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api':
        return renderApiSettings();
      case 'telegram':
        return renderTelegramSettings();
      case 'storage':
        return renderStorageSettings();
      case 'processing':
        return renderProcessingSettings();
      case 'security':
        return renderSecuritySettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderApiSettings();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your Helper for Jane plugin</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Save className="w-4 h-4" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        mode={importExportMode}
      />
    </div>
  );
};

export default Settings;