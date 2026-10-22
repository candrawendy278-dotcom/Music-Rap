import { GameState } from '../types';
import { initialState } from '../hooks/useGame';
import {
  SAVE_STORAGE_KEY,
  compactSaveState,
  saveGameStateSafely,
  cleanAndDecompressLoadedState,
  clearSaveDataCompletely
} from './saveStateOptimizer';

export const SAVE_KEY = SAVE_STORAGE_KEY;

export const cloudSync = {
  /**
   * Clears all local save data and stored tokens upon sign out
   */
  async clearLocalSaveOnSignOut(): Promise<void> {
    await clearSaveDataCompletely();
  },

  /**
   * Fetches the user's saved game state from the cloud and restores it locally
   */
  async fetchAndRestoreCloudSave(token: string): Promise<GameState | null> {
    if (!token || typeof token !== 'string' || token === 'undefined' || token === 'null' || token.trim() === '') {
      return null;
    }
    try {
      const res = await fetch('/api/load', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      });

      if (!res.ok) return null;
      const data = await res.json();
      const cloudState = data.state;

      if (cloudState && cloudState.artist) {
        // Automatically sanitize and compact the cloud state to <1MB
        const cleanedState = cleanAndDecompressLoadedState(cloudState, initialState);
        cleanedState.isStarted = true;

        // Save safely into IndexedDB
        await saveGameStateSafely(cleanedState);

        return cleanedState;
      }
    } catch (err) {
      console.error('Failed to fetch and restore cloud save:', err);
    }
    return null;
  },

  /**
   * Uploads the latest game state to the cloud (compacted to prevent large payload issues)
   */
  async uploadSaveToCloud(token: string, state: GameState): Promise<boolean> {
    if (!token || typeof token !== 'string' || token === 'undefined' || token === 'null' || token.trim() === '') {
      return false;
    }
    try {
      const compacted = compactSaveState(state);
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify(compacted)
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to upload save to cloud:', err);
      return false;
    }
  }
};
