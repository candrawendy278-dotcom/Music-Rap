import React, { useState } from 'react';
import { useGameContext } from '../../GameContext';
import { getEnsuredSkillState, PlayerSkillState, SubSkill } from '../../data/skillSystemEngine';
import { formatNumFull } from '../../constants';
import { saveGameStateSafely } from '../../utils/saveStateOptimizer';

// Secret developer/testing codes — never displayed in the UI!
const SECRET_DEV_CODES = ['GODMODE', 'MAXALL', 'EMPIRE', 'CHEATMAX'];

export default function RedeemCodeWidget() {
  const { state, setState } = useGameContext();
  const [codeInput, setCodeInput] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(
    Boolean((state as any).cheatUnlocked)
  );
  const [customFansInput, setCustomFansInput] = useState<string>(
    String(state.fans ?? 250)
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const buildMaxedSkills = (currentSkills?: PlayerSkillState): PlayerSkillState => {
    const safe = getEnsuredSkillState(currentSkills);
    const maxCategory = <T extends Record<string, SubSkill>>(catObj: T): T => {
      const nextCat: Record<string, SubSkill> = {};
      Object.entries(catObj).forEach(([k, sub]) => {
        nextCat[k] = {
          ...sub,
          level: sub.maxLevel || 10,
          training: undefined
        };
      });
      return nextCat as T;
    };

    return {
      ...safe,
      songwriting: maxCategory(safe.songwriting),
      recording: maxCategory(safe.recording),
      production: maxCategory(safe.production)
    };
  };

  const applyMaxSkillsPopHype = (customFansValue?: number) => {
    setState(prev => {
      const maxedSkills = buildMaxedSkills(prev.skills);
      const nextFans =
        customFansValue !== undefined && !isNaN(customFansValue)
          ? Math.max(0, Math.round(customFansValue))
          : prev.fans ?? 250;

      const updated = {
        ...prev,
        popularity: 100,
        hype: 100,
        popDelta: 0,
        hypeDelta: 0,
        fans: nextFans,
        skills: maxedSkills,
        cheatUnlocked: true,
        artist: prev.artist
          ? {
              ...prev.artist,
              popularity: 100,
              hype: 100
            }
          : prev.artist
      };
      saveGameStateSafely(updated).catch(console.error);
      return updated;
    });
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = codeInput.trim().toUpperCase();

    if (!normalized) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid promo code.'
      });
      return;
    }

    if (SECRET_DEV_CODES.includes(normalized)) {
      setIsDevUnlocked(true);
      applyMaxSkillsPopHype();
      setCustomFansInput(String(state.fans ?? 250));
      setStatusMessage({
        type: 'success',
        text: 'Special code redeemed successfully! Bonus perks have been unlocked.'
      });
      setCodeInput('');
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Invalid or expired redeem code. Please check your code and try again.'
      });
    }
  };

  const handleApplyFans = (targetFans: number) => {
    const cleanFans = Math.max(0, Math.min(999999999, Math.round(targetFans)));
    setCustomFansInput(String(cleanFans));
    setState(prev => {
      const updated = {
        ...prev,
        fans: cleanFans
      };
      saveGameStateSafely(updated).catch(console.error);
      return updated;
    });
    setStatusMessage({
      type: 'success',
      text: `Dedicated Fans updated to ${formatNumFull(cleanFans)}.`
    });
  };

  return (
    <div className="bg-apple-card rounded-3xl p-6 shadow-ios border border-apple-border/50 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-apple-text text-lg tracking-tight">
            Redeem Code
          </h3>
          <p className="text-xs text-apple-subtext mt-0.5">
            Have a promotional or event gift code? Enter it below to claim your exclusive in-game rewards.
          </p>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
          <i className="ph-fill ph-ticket text-lg"></i>
        </div>
      </div>

      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          type="text"
          value={codeInput}
          onChange={e => setCodeInput(e.target.value)}
          placeholder="Enter promo code..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-apple-bg border border-apple-border/60 rounded-2xl px-4 py-3 text-sm font-bold text-apple-text placeholder:font-normal placeholder:text-apple-subtext focus:outline-none focus:border-neutral-900 uppercase tracking-wider"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-2xl active:scale-95 transition cursor-pointer shrink-0"
        >
          Redeem
        </button>
      </form>

      {statusMessage && (
        <div
          className={`text-xs p-3 rounded-2xl border font-medium flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <i className="ph-bold ph-x text-xs"></i>
          </button>
        </div>
      )}

      {/* Secret Developer Controls (Only visible AFTER entering the secret code!) */}
      {isDevUnlocked && (
        <div className="pt-4 border-t border-apple-border/50 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-apple-text">
                Max All Studio Skills & Stats
              </div>
              <div className="text-[11px] text-apple-subtext">
                Set all 22 skills to Lv.10, Popularity 100%, and Hype 100%
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  applyMaxSkillsPopHype();
                  setStatusMessage({
                    type: 'success',
                    text: 'All 22 Skills (Lv.10), Popularity (100%), and Hype (100%) maxed!'
                  });
                }}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer"
              >
                Max All
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDevUnlocked(false);
                  setState(prev => ({ ...prev, cheatUnlocked: false } as any));
                }}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl transition cursor-pointer"
                title="Hide Sandbox Panel"
              >
                <i className="ph-bold ph-eye-slash text-sm"></i>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-apple-text">
                Custom Dedicated Fans
              </label>
              <span className="text-xs font-mono font-bold text-apple-subtext tabular-nums">
                Current: {formatNumFull(state.fans ?? 250)}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={999999999}
                value={customFansInput}
                onChange={e => setCustomFansInput(e.target.value)}
                placeholder="Enter fan count..."
                className="flex-1 bg-apple-bg border border-apple-border/60 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-apple-text focus:outline-none focus:border-neutral-900 tabular-nums"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = parseInt(customFansInput, 10);
                  if (!isNaN(parsed)) {
                    handleApplyFans(parsed);
                  }
                }}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl active:scale-95 transition cursor-pointer shrink-0"
              >
                Set Fans
              </button>
            </div>

            {/* Quick Fan Presets */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: '50K', val: 50000 },
                { label: '500K', val: 500000 },
                { label: '2.5M', val: 2500000 },
                { label: '15M', val: 15000000 },
                { label: '50M', val: 50000000 }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyFans(preset.val)}
                  className="py-1.5 px-2 rounded-lg bg-apple-bg hover:bg-neutral-200/70 text-apple-text text-[11px] font-mono font-bold transition cursor-pointer border border-apple-border/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
