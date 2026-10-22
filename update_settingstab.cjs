const fs = require('fs');
let code = fs.readFileSync('src/components/Tabs/SettingsTab.tsx', 'utf8');

const imports = `import { useState } from 'react';
import { useGameContext } from '../../GameContext';
import { useAuth } from '../../hooks/useAuth';
`;

code = code.replace(
    /import \{ useGameContext \} from '\.\.\/\.\.\/GameContext';/,
    imports
);

const hooks = `  const { state, setState } = useGameContext();
  const { user, signIn, signOut } = useAuth();
  const [backupStatus, setBackupStatus] = useState('');
  
  const handleCloudBackup = async () => {
      if (!user) return;
      setBackupStatus('Saving...');
      try {
          const token = await user.getIdToken();
          const res = await fetch('/api/save', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify(state)
          });
          if (res.ok) {
              setBackupStatus('Backed up securely!');
              setTimeout(() => setBackupStatus(''), 3000);
          } else {
              setBackupStatus('Failed to backup.');
          }
      } catch (err) {
          console.error(err);
          setBackupStatus('Error occurred.');
      }
  };
`;

code = code.replace(
    /  const \{ state, setState \} = useGameContext\(\);/,
    hooks
);

const newButtons = `      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 space-y-4">
        <div>
            <h3 className="font-bold text-apple-text text-lg flex items-center gap-2">
                <i className="ph-fill ph-cloud-arrow-up text-blue-500"></i> Cloud Backup & Updates
            </h3>
            <p className="text-xs text-apple-subtext mt-1">
                We no longer auto-save to the cloud every second to save your bandwidth and prevent data loss during updates.
                Please backup manually, especially before game updates!
            </p>
        </div>
        
        {user ? (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-apple-subtext">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="ph-fill ph-user text-blue-500"></i>
                    </div>
                    <span>Signed in as <strong>{user.email}</strong></span>
                </div>
                <button 
                    onClick={handleCloudBackup}
                    className="w-full bg-blue-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform cursor-pointer"
                >
                    {backupStatus || 'Backup to Cloud Now'}
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            if (window.confirm("Make sure you backed up first! Reload to get the latest game update?")) {
                                window.location.reload();
                            }
                        }}
                        className="flex-1 bg-apple-text text-apple-bg font-bold py-3 rounded-2xl active:scale-95 transition-transform cursor-pointer"
                    >
                        Check for Updates
                    </button>
                    <button 
                        onClick={signOut}
                        className="flex-1 bg-gray-100 text-apple-text font-bold py-3 rounded-2xl active:scale-95 transition-transform cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        ) : (
            <button 
                onClick={signIn}
                className="w-full bg-white text-apple-text border border-apple-border shadow-sm font-bold py-3 rounded-2xl active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
                <i className="ph-fill ph-google-logo text-lg"></i> Sign in with Google to Backup
            </button>
        )}
      </div>

      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 text-center mt-6">`;

code = code.replace(
    /      <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border\/50 text-center mt-6">/,
    newButtons
);

fs.writeFileSync('src/components/Tabs/SettingsTab.tsx', code);
