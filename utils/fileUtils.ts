import { FileMetadata, ProjectInfo } from '../types';

// File type configurations
const CONFIG_FILES = new Set([
  'package.json', 'tsconfig.json', 'vite.config.ts', 'vite.config.js',
  'webpack.config.js', 'rollup.config.js', 'babel.config.js',
  '.eslintrc.json', '.eslintrc.js', 'prettier.config.js',
  'jest.config.js', 'vitest.config.ts', 'tailwind.config.js',
  '.env', '.env.local', '.env.production', '.gitignore'
]);

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.dart': 'dart',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.md': 'markdown',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.html': 'html',
  '.sql': 'sql',
  '.sh': 'bash',
  '.ps1': 'powershell',
  '.r': 'r',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.elm': 'elm',
  '.ex': 'elixir',
  '.fs': 'fsharp',
  '.hs': 'haskell',
  '.lua': 'lua',
  '.ml': 'ocaml',
  '.pl': 'perl',
  '.proto': 'protobuf',
  '.thrift': 'thrift',
  '.dockerfile': 'dockerfile'
};

/**
 * Get file metadata including size, type, and language detection
 */
export async function getFileMetadata(fileHandle: FileSystemFileHandle): Promise<FileMetadata> {
  try {
    const file = await fileHandle.getFile();
    const extension = getFileExtension(fileHandle.name);
    const language = LANGUAGE_EXTENSIONS[extension];
    
    return {
      size: file.size,
      type: file.type || 'unknown',
      isConfig: CONFIG_FILES.has(fileHandle.name),
      language,
      lastModified: file.lastModified,
    };
  } catch (error) {
    console.warn(`Failed to get metadata for ${fileHandle.name}:`, error);
    return {
      size: 0,
      type: 'unknown',
      isConfig: false,
      lastModified: 0,
    };
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
}

/**
 * Check if file should be hidden based on patterns
 */
export function shouldHideFile(filename: string, showHiddenFiles: boolean): boolean {
  if (showHiddenFiles) return false;
  
  // Hide dot files and common build/cache directories
  const hiddenPatterns = [
    /^\./,  // Dot files
    /^node_modules$/,
    /^\.git$/,
    /^dist$/,
    /^build$/,
    /^coverage$/,
    /^\.next$/,
    /^\.nuxt$/,
    /^\.output$/,
    /^__pycache__$/,
    /\.pyc$/,
    /\.cache$/,
  ];
  
  return hiddenPatterns.some(pattern => pattern.test(filename));
}

/**
 * Parse .gitignore file and return patterns
 */
export async function parseGitignore(gitignoreHandle?: FileSystemFileHandle): Promise<string[]> {
  if (!gitignoreHandle) return [];
  
  try {
    const file = await gitignoreHandle.getFile();
    const content = await file.text();
    
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.replace(/\/$/, '')); // Remove trailing slashes
  } catch (error) {
    console.warn('Failed to parse .gitignore:', error);
    return [];
  }
}

/**
 * Check if file matches gitignore patterns
 */
export function isIgnoredByGitignore(filePath: string, gitignorePatterns: string[]): boolean {
  if (gitignorePatterns.length === 0) return false;
  
  return gitignorePatterns.some(pattern => {
    if (pattern.includes('*')) {
      // Simple glob pattern matching
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath) || regex.test(filePath.split('/').pop() || '');
    }
    
    // Exact match or directory match
    return filePath === pattern || 
           filePath.startsWith(pattern + '/') ||
           filePath.split('/').pop() === pattern;
  });
}

/**
 * Parse package.json and extract project information
 */
export async function parsePackageJson(packageHandle?: FileSystemFileHandle): Promise<ProjectInfo['packageInfo']> {
  if (!packageHandle) return undefined;
  
  try {
    const file = await packageHandle.getFile();
    const content = await file.text();
    const packageData = JSON.parse(content);
    
    return {
      name: packageData.name || 'Unknown',
      version: packageData.version || '0.0.0',
      dependencies: packageData.dependencies || {},
      devDependencies: packageData.devDependencies || {},
      scripts: packageData.scripts || {},
    };
  } catch (error) {
    console.warn('Failed to parse package.json:', error);
    return undefined;
  }
}

/**
 * Parse README.md content
 */
export async function parseReadme(readmeHandle?: FileSystemFileHandle): Promise<string | undefined> {
  if (!readmeHandle) return undefined;
  
  try {
    const file = await readmeHandle.getFile();
    return await file.text();
  } catch (error) {
    console.warn('Failed to parse README.md:', error);
    return undefined;
  }
}

/**
 * Detect project type based on files and package.json
 */
export function detectProjectType(
  packageInfo?: ProjectInfo['packageInfo'],
  fileNames: string[] = []
): ProjectInfo['type'] {
  if (!packageInfo) {
    // Fallback to file-based detection
    if (fileNames.some(name => name.endsWith('.tsx') || name.endsWith('.jsx'))) {
      return 'react';
    }
    if (fileNames.includes('tsconfig.json')) {
      return 'typescript';
    }
    if (fileNames.some(name => name.endsWith('.js'))) {
      return 'javascript';
    }
    return 'unknown';
  }
  
  const { dependencies, devDependencies } = packageInfo;
  const allDeps = { ...dependencies, ...devDependencies };
  
  // Check for React
  if (allDeps.react || allDeps['@types/react']) {
    return 'react';
  }
  
  // Check for Node.js specific packages
  if (allDeps.express || allDeps.fastify || allDeps.koa || allDeps.hapi) {
    return 'node';
  }
  
  // Check for TypeScript
  if (allDeps.typescript || allDeps['@types/node']) {
    return 'typescript';
  }
  
  return 'javascript';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Get language icon/color based on file extension
 */
export function getLanguageInfo(filename: string): { language?: string; icon: string; color: string } {
  const extension = getFileExtension(filename);
  const language = LANGUAGE_EXTENSIONS[extension];
  
  const languageConfig: Record<string, { icon: string; color: string }> = {
    typescript: { icon: 'typescript', color: '#3178c6' },
    javascript: { icon: 'javascript', color: '#f7df1e' },
    python: { icon: 'python', color: '#3776ab' },
    java: { icon: 'java', color: '#ed8b00' },
    cpp: { icon: 'cpp', color: '#00599c' },
    c: { icon: 'c', color: '#a8b9cc' },
    csharp: { icon: 'csharp', color: '#239120' },
    php: { icon: 'php', color: '#777bb4' },
    ruby: { icon: 'ruby', color: '#cc342d' },
    go: { icon: 'go', color: '#00add8' },
    rust: { icon: 'rust', color: '#dea584' },
    swift: { icon: 'swift', color: '#fa7343' },
    kotlin: { icon: 'kotlin', color: '#7f52ff' },
    dart: { icon: 'dart', color: '#0175c2' },
    vue: { icon: 'vue', color: '#4fc08d' },
    svelte: { icon: 'svelte', color: '#ff3e00' },
    markdown: { icon: 'markdown', color: '#083fa1' },
    json: { icon: 'json', color: '#292929' },
    yaml: { icon: 'yaml', color: '#cb171e' },
    xml: { icon: 'xml', color: '#0060ac' },
    css: { icon: 'css', color: '#1572b6' },
    scss: { icon: 'scss', color: '#cf649a' },
    sass: { icon: 'sass', color: '#cf649a' },
    less: { icon: 'less', color: '#1d365d' },
    html: { icon: 'html', color: '#e34f26' },
    sql: { icon: 'sql', color: '#336791' },
    bash: { icon: 'bash', color: '#4eaa25' },
    powershell: { icon: 'powershell', color: '#012456' },
  };
  
  return languageConfig[language || 'unknown'] || { icon: 'file', color: '#6b7280' };
}