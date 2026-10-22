import fs from 'fs';
import path from 'path';

interface StoredUser {
  uid: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredSave {
  userId: string;
  userEmail?: string;
  gameState: any;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers(): Record<string, StoredUser> {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return {};
}

function saveUsers(users: Record<string, StoredUser>) {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

function loadSaves(): Record<string, StoredSave> {
  try {
    ensureDataDir();
    if (fs.existsSync(SAVES_FILE)) {
      const content = fs.readFileSync(SAVES_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading saves file:', err);
  }
  return {};
}

function saveSaves(saves: Record<string, StoredSave>) {
  try {
    ensureDataDir();
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing saves file:', err);
  }
}

export const serverStorage = {
  findUserByEmail(email: string): StoredUser | null {
    const users = loadUsers();
    const normalized = email.toLowerCase().trim();
    for (const u of Object.values(users)) {
      if (u.email.toLowerCase().trim() === normalized) {
        return u;
      }
    }
    return null;
  },

  findUserByUid(uid: string): StoredUser | null {
    const users = loadUsers();
    return users[uid] || null;
  },

  saveUser(user: StoredUser) {
    const users = loadUsers();
    users[user.uid] = user;
    saveUsers(users);
  },

  updatePassword(email: string, newPasswordHash: string): boolean {
    const users = loadUsers();
    const normalized = email.toLowerCase().trim();
    for (const [uid, u] of Object.entries(users)) {
      if (u.email.toLowerCase().trim() === normalized) {
        users[uid] = { ...u, passwordHash: newPasswordHash };
        saveUsers(users);
        return true;
      }
    }
    return false;
  },

  saveGameState(uid: string, gameState: any, email?: string) {
    const saves = loadSaves();
    saves[uid] = {
      userId: uid,
      userEmail: email ? email.toLowerCase().trim() : (saves[uid]?.userEmail || ''),
      gameState,
      updatedAt: new Date().toISOString(),
    };
    saveSaves(saves);
  },

  getGameState(uid: string, email?: string): any | null {
    const saves = loadSaves();
    if (saves[uid]?.gameState) {
      return saves[uid].gameState;
    }
    // Fallback: check by email across saves
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      for (const save of Object.values(saves)) {
        if (save.userEmail && save.userEmail.toLowerCase().trim() === normalizedEmail) {
          return save.gameState;
        }
      }
      // Also look up stored user by email to match their registered UID
      const user = this.findUserByEmail(normalizedEmail);
      if (user && saves[user.uid]?.gameState) {
        return saves[user.uid].gameState;
      }
    }
    return null;
  }
};
