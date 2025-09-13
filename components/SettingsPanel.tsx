import React, { useState } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeMode, ColorScheme, ViewMode, FontSize } from '../types';
import { updateService, UpdateResult } from '../services/updateService';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, settings, updateTheme, updateSettings, resetSettings } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'chat' | 'files' | 'about'>('appearance');
  const [updateStatus, setUpdateStatus] = useState<UpdateResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleThemeModeChange = (mode: ThemeMode) => {
    updateTheme({ mode });
  };

  const handleColorSchemeChange = (colorScheme: ColorScheme) => {
    updateTheme({ colorScheme });
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    updateTheme({ viewMode });
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    updateTheme({ fontSize });
  };

  const handleSidebarWidthChange = (width: number) => {
    updateTheme({ sidebarWidth: width });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus(null);
    
    try {
      const result = await updateService.performUpdate();
      setUpdateStatus(result);
      
      // If update was successful, show message for a moment then reload
      if (result.message === 'Success') {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setUpdateStatus({
        success: false,
        message: 'Offline: serving the cache'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'appearance', label: 'Appearance', icon: 'theme' },
            { id: 'chat', label: 'Chat', icon: 'user' },
            { id: 'files', label: 'Files', icon: 'folder' },
            { id: 'about', label: 'About', icon: 'info' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon name={tab.icon as any} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Theme Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light' as ThemeMode, label: 'Light', icon: '☀️' },
                    { value: 'dark' as ThemeMode, label: 'Dark', icon: '🌙' },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => handleThemeModeChange(mode.value)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        theme.mode === mode.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{mode.icon}</div>
                      <div className="font-medium">{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Color Scheme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'default' as ColorScheme, label: 'Default' },
                    { value: 'vscode' as ColorScheme, label: 'VS Code' },
                    { value: 'github' as ColorScheme, label: 'GitHub' },
                    { value: 'monokai' as ColorScheme, label: 'Monokai' },
                  ].map((scheme) => (
                    <button
                      key={scheme.value}
                      onClick={() => handleColorSchemeChange(scheme.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        theme.colorScheme === scheme.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium">{scheme.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">View Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'compact' as ViewMode, label: 'Compact', desc: 'Tighter spacing' },
                    { value: 'comfortable' as ViewMode, label: 'Comfortable', desc: 'More spacing' },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => handleViewModeChange(mode.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        theme.viewMode === mode.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-sm text-gray-400">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Font Size</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'small' as FontSize, label: 'Small' },
                    { value: 'medium' as FontSize, label: 'Medium' },
                    { value: 'large' as FontSize, label: 'Large' },
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleFontSizeChange(size.value)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        theme.fontSize === size.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium">{size.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Width */}
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">
                  Sidebar Width: {theme.sidebarWidth}px
                </h3>
                <input
                  type="range"
                  min="240"
                  max="480"
                  step="20"
                  value={theme.sidebarWidth}
                  onChange={(e) => handleSidebarWidthChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>240px</span>
                  <span>480px</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Chat Settings</h3>
                
                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-200">Enable Chat History</div>
                    <div className="text-sm text-gray-400">Save chat messages between sessions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.chatSettings.enableHistory}
                    onChange={(e) => updateSettings({
                      chatSettings: {
                        ...settings.chatSettings,
                        enableHistory: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg mt-3">
                  <div>
                    <div className="font-medium text-gray-200">Auto-save Messages</div>
                    <div className="text-sm text-gray-400">Automatically save messages as you type</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.chatSettings.autoSave}
                    onChange={(e) => updateSettings({
                      chatSettings: {
                        ...settings.chatSettings,
                        autoSave: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                </label>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Max History Size: {settings.chatSettings.maxHistorySize}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={settings.chatSettings.maxHistorySize}
                    onChange={(e) => updateSettings({
                      chatSettings: {
                        ...settings.chatSettings,
                        maxHistorySize: Number(e.target.value)
                      }
                    })}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>10</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">File Settings</h3>
                
                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-200">Show Hidden Files</div>
                    <div className="text-sm text-gray-400">Display files starting with . (dot)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.fileSettings.showHiddenFiles}
                    onChange={(e) => updateSettings({
                      fileSettings: {
                        ...settings.fileSettings,
                        showHiddenFiles: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg mt-3">
                  <div>
                    <div className="font-medium text-gray-200">Respect .gitignore</div>
                    <div className="text-sm text-gray-400">Hide files listed in .gitignore</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.fileSettings.respectGitignore}
                    onChange={(e) => updateSettings({
                      fileSettings: {
                        ...settings.fileSettings,
                        respectGitignore: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                </label>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Max File Size: {Math.round(settings.fileSettings.maxFileSize / 1024 / 1024)}MB
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={settings.fileSettings.maxFileSize / 1024 / 1024}
                    onChange={(e) => updateSettings({
                      fileSettings: {
                        ...settings.fileSettings,
                        maxFileSize: Number(e.target.value) * 1024 * 1024
                      }
                    })}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>1MB</span>
                    <span>50MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-6">About Klicki-Bunti-Gemini</h3>
                
                {/* App Information */}
                <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Icon name="gemini" className="w-12 h-12 text-blue-400" />
                    <div>
                      <h4 className="text-xl font-semibold text-gray-100">{updateService.getAppInfo().name}</h4>
                      <p className="text-gray-400">Desktop AI Assistant for Developers</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Version</div>
                      <div className="text-gray-200 font-mono">{updateService.getAppInfo().version}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Build Date</div>
                      <div className="text-gray-200 font-mono">{updateService.getAppInfo().buildDate}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Copyright</div>
                    <div className="text-gray-200">{updateService.getAppInfo().copyright}</div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Homepage</div>
                    <a 
                      href={updateService.getAppInfo().homepage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {updateService.getAppInfo().homepage}
                    </a>
                  </div>
                </div>

                {/* Support Section */}
                <div className="bg-gray-700/50 rounded-lg p-6 mt-6">
                  <h4 className="text-lg font-medium text-gray-200 mb-4">Support Development</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-300 mb-2">
                        If you find this software helpful, consider supporting its development
                      </div>
                      <div className="text-sm text-gray-400">
                        Your support helps maintain and improve Klicki-Bunti-Gemini
                      </div>
                    </div>
                    <a
                      href="https://paypal.me/Etschmia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ml-4"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a9.36 9.36 0 0 1-.077.437c-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287z"/>
                      </svg>
                      Support via PayPal
                    </a>
                  </div>
                </div>

                {/* Update Section */}
                <div className="bg-gray-700/50 rounded-lg p-6 mt-6">
                  <h4 className="text-lg font-medium text-gray-200 mb-4">Software Update</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400">
                      Check for and install software updates
                    </div>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isUpdating
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Icon 
                        name="refresh" 
                        className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} 
                      />
                      {isUpdating ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                  
                  {/* Update Status */}
                  {updateStatus && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                      updateStatus.message === 'Success'
                        ? 'bg-green-900/50 border border-green-700 text-green-300'
                        : updateStatus.message === 'Already Up to Date'
                        ? 'bg-blue-900/50 border border-blue-700 text-blue-300'
                        : 'bg-orange-900/50 border border-orange-700 text-orange-300'
                    }`}>
                      <Icon 
                        name={updateStatus.message === 'Success' ? 'check' : 'info'} 
                        className="w-4 h-4" 
                      />
                      <span>{updateStatus.message}</span>
                      {updateStatus.message === 'Success' && (
                        <span className="text-sm opacity-75 ml-2">
                          (Reloading in 2 seconds...)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;