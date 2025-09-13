export interface UpdateResult {
  success: boolean;
  message: 'Success' | 'Already Up to Date' | 'Offline: serving the cache';
  version?: string;
}

export interface AppInfo {
  name: string;
  version: string;
  buildDate: string;
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

  public getAppInfo(): AppInfo {
    // Build date is set at build time - for now using current date
    const buildDate = new Date().toISOString().split('T')[0];
    
    return {
      name: 'Klicki-Bunti-Gemini',
      version: '0.0.1', // This should match package.json version
      buildDate,
      copyright: '2025 Tobias Brendler',
      homepage: 'https://github.com/Etschmia/klicki-bunti-gemini'
    };
  }

  public async checkForUpdate(): Promise<UpdateResult> {
    try {
      // Try to fetch the latest version info from the server
      const response = await fetch('/api/version', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add a timeout to handle offline scenarios
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error('Server response not ok');
      }

      const serverInfo = await response.json();
      const currentVersion = this.getAppInfo().version;

      if (this.compareVersions(serverInfo.version, currentVersion) > 0) {
        // Server has newer version
        return {
          success: true,
          message: 'Success',
          version: serverInfo.version
        };
      } else {
        // Already up to date
        return {
          success: true,
          message: 'Already Up to Date',
          version: currentVersion
        };
      }
    } catch (error) {
      console.warn('Update check failed:', error);
      // Offline or server error
      return {
        success: false,
        message: 'Offline: serving the cache'
      };
    }
  }

  public async performUpdate(): Promise<UpdateResult> {
    try {
      // Check if service worker is available
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

      // If no service worker, try to reload the page to get fresh content
      const updateResult = await this.checkForUpdate();
      
      if (updateResult.message === 'Success') {
        // Reload the page to get the updated version
        window.location.reload();
        return updateResult;
      }
      
      return updateResult;
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