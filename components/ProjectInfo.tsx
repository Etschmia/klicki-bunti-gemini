import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { ProjectInfo as ProjectInfoType, FileSystemItem } from '../types';
import { parsePackageJson, parseReadme, detectProjectType } from '../utils/fileUtils';
import ReactMarkdown from 'react-markdown';

interface ProjectInfoProps {
  fileTree: FileSystemItem | null;
  rootName: string | null;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ fileTree, rootName }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfoType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'readme' | 'dependencies'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const findFileInTree = (tree: FileSystemItem, fileName: string): any => {
    if (tree.kind === 'file' && tree.name === fileName) {
      return tree.handle;
    }
    if (tree.kind === 'directory' && tree.children) {
      for (const child of tree.children) {
        const found = findFileInTree(child, fileName);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllFileNames = (tree: FileSystemItem): string[] => {
    if (tree.kind === 'file') {
      return [tree.name];
    }
    if (tree.kind === 'directory' && tree.children) {
      return tree.children.flatMap(child => getAllFileNames(child));
    }
    return [];
  };

  useEffect(() => {
    const analyzeProject = async () => {
      if (!fileTree || !rootName) {
        setProjectInfo(null);
        return;
      }

      setIsLoading(true);
      try {
        const packageHandle = findFileInTree(fileTree, 'package.json');
        const readmeHandle = findFileInTree(fileTree, 'README.md') || findFileInTree(fileTree, 'readme.md');
        const allFiles = getAllFileNames(fileTree);

        const [packageInfo, readme] = await Promise.all([
          packageHandle ? parsePackageJson(packageHandle) : Promise.resolve(undefined),
          readmeHandle ? parseReadme(readmeHandle) : Promise.resolve(undefined)
        ]);

        const projectType = detectProjectType(packageInfo, allFiles);

        const info: ProjectInfoType = {
          name: packageInfo?.name || rootName,
          type: projectType,
          packageInfo,
          readme,
        };

        setProjectInfo(info);
      } catch (error) {
        console.error('Error analyzing project:', error);
        setProjectInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeProject();
  }, [fileTree, rootName]);

  if (!projectInfo && !isLoading) {
    return null;
  }

  const getProjectIcon = (type: ProjectInfoType['type']) => {
    switch (type) {
      case 'react': return '⚛️';
      case 'node': return '🟢';
      case 'typescript': return '🔷';
      case 'javascript': return '💛';
      default: return '📁';
    }
  };

  const formatDependencyCount = (deps: Record<string, string>) => {
    const count = Object.keys(deps).length;
    return count > 0 ? `${count} dependencies` : 'No dependencies';
  };

  return (
    <div className="mt-4 border-t border-gray-700/50 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-700/30 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-lg">{getProjectIcon(projectInfo?.type || 'unknown')}</span>
          )}
          <span className="text-sm font-medium text-gray-300">Project Info</span>
        </div>
        <Icon 
          name={isExpanded ? 'minus' : 'plus'} 
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {isExpanded && projectInfo && (
        <div className="mt-3 space-y-3">
          {/* Tabs */}
          <div className="flex text-xs border-b border-gray-700">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'readme', label: 'README', disabled: !projectInfo.readme },
              { id: 'dependencies', label: 'Deps', disabled: !projectInfo.packageInfo }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                className={`px-3 py-1 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b border-blue-400'
                    : tab.disabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="text-xs space-y-2">
            {activeTab === 'overview' && (
              <>
                <div>
                  <span className="text-gray-400">Name:</span>{' '}
                  <span className="text-gray-200">{projectInfo.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>{' '}
                  <span className="text-gray-200 capitalize">{projectInfo.type}</span>
                </div>
                {projectInfo.packageInfo && (
                  <div>
                    <span className="text-gray-400">Version:</span>{' '}
                    <span className="text-gray-200">{projectInfo.packageInfo.version}</span>
                  </div>
                )}
                {projectInfo.packageInfo && (
                  <>
                    <div>
                      <span className="text-gray-400">Dependencies:</span>{' '}
                      <span className="text-gray-200">
                        {formatDependencyCount(projectInfo.packageInfo.dependencies)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Dev Dependencies:</span>{' '}
                      <span className="text-gray-200">
                        {formatDependencyCount(projectInfo.packageInfo.devDependencies)}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'readme' && projectInfo.readme && (
              <div className="max-h-64 overflow-y-auto">
                <ReactMarkdown 
                  className="prose prose-xs prose-invert max-w-none"
                  components={{
                    h1: ({ children }) => <h1 className="text-sm font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xs font-semibold mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xs font-medium mb-1">{children}</h3>,
                    p: ({ children }) => <p className="text-xs mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="text-xs list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="text-xs list-decimal list-inside mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    code: ({ children }) => <code className="bg-gray-800 px-1 rounded text-xs">{children}</code>,
                  }}
                >
                  {projectInfo.readme.slice(0, 1000) + (projectInfo.readme.length > 1000 ? '...' : '')}
                </ReactMarkdown>
              </div>
            )}

            {activeTab === 'dependencies' && projectInfo.packageInfo && (
              <div className="space-y-2">
                {Object.keys(projectInfo.packageInfo.dependencies).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Dependencies</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(projectInfo.packageInfo.dependencies).map(([name, version]) => (
                        <div key={name} className="flex justify-between">
                          <span className="text-gray-400 truncate">{name}</span>
                          <span className="text-gray-500 text-xs">{version}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {Object.keys(projectInfo.packageInfo.devDependencies).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-1">Dev Dependencies</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(projectInfo.packageInfo.devDependencies).map(([name, version]) => (
                        <div key={name} className="flex justify-between">
                          <span className="text-gray-400 truncate">{name}</span>
                          <span className="text-gray-500 text-xs">{version}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInfo;