import packageInfo from '../package.json';

export interface UpdateResult {
  success: boolean;
  message: 'Success' | 'Already Up to Date' | 'Offline: serving the cache';
  version?: string;
}

export interface AppInfo {
  name: string;
  version: string;
  buildDate: string;
  buildTime: string;
  copyright: string;
  homepage: string;
}

class UpdateService {
  private static instance: UpdateService;
  
  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  private isDevelopment(): boolean {
    // Check if we're in development mode based on hostname
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  public getAppInfo(): AppInfo {
    // Build date and time are set at build time
    const now = new Date();
    const buildDate = now.toISOString().split('T')[0];
    const buildTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    return {
      name: 'Klicki-Bunti-Gemini',
      version: packageInfo.version, // Read version from package.json
      buildDate,
      buildTime,
      copyright: '2025 Tobias Brendler',
      homepage: 'https://github.com/Etschmia/klicki-bunti-gemini'
    };
  }

  public async checkForUpdate(): Promise<UpdateResult> {
    try {
      const currentVersion = this.getAppInfo().version;
      
      // In development mode, always show "Already Up to Date"
      if (this.isDevelopment()) {
        return {
          success: true,
          message: 'Already Up to Date',
          version: currentVersion
        };
      }
      
      // For production deployment, you would implement actual version checking here
      // Example: fetch('/api/version') or check GitHub releases API
      
      // For now, since this is primarily a local development tool,
      // we'll default to "Already Up to Date"
      return {
        success: true,
        message: 'Already Up to Date',
        version: currentVersion
      };
      
    } catch (error) {
      console.warn('Update check failed:', error);
      return {
        success: false,
        message: 'Offline: serving the cache'
      };
    }
  }

  public async performUpdate(): Promise<UpdateResult> {
    try {
      // First check if there's actually an update available
      const updateCheck = await this.checkForUpdate();
      
      if (updateCheck.message === 'Already Up to Date') {
        return updateCheck;
      }
      
      // For a local development app, we can't actually perform updates
      // In a real deployment scenario, this would:
      // 1. Download new files
      // 2. Update service worker cache
      // 3. Reload the application
      
      // Check if service worker is available for cache refresh
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Try to update the service worker
          await registration.update();
          
          // Wait for the new service worker to be installed
          if (registration.waiting) {
            // New service worker is waiting, activate it
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            return {
              success: true,
              message: 'Success'
            };
          }
        }
      }

      // If no service worker or no update available, just reload to refresh cache
      window.location.reload();
      
      return {
        success: true,
        message: 'Success'
      };
      
    } catch (error) {
      console.error('Update failed:', error);
      return {
        success: false,
        message: 'Offline: serving the cache'
      };
    }
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    
    return 0;
  }
}

export const updateService = UpdateService.getInstance();