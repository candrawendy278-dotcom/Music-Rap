import React, { useState, useEffect, useMemo } from 'react';
import {
  getNpcCollabExpectations,
  evaluateCollabOffer,
  CollabOfferEvaluation
} from '../../data/collabNegotiationAndRoyaltyEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { formatNumFull } from '../../constants';

export interface SignedCollabContract {
  npcName: string;
  agreedFee: number;
  agreedRoyaltyPercent: number;
  qualityBonus: number;
  signed: boolean;
}

interface CollabOfferNegotiationPanelProps {
  selectedNpcName: string;
  playerPopularity: number;
  playerMoney: number;
  contract: SignedCollabContract | null;
  onContractChange: (contract: SignedCollabContract | null) => void;
}

export const CollabOfferNegotiationPanel: React.FC<CollabOfferNegotiationPanelProps> = ({
  selectedNpcName,
  playerPopularity,
  playerMoney,
  contract,
  onContractChange
}) => {
  const expectations = useMemo(
    () => getNpcCollabExpectations(selectedNpcName, playerPopularity),
    [selectedNpcName, playerPopularity]
  );

  const [offeredFee, setOfferedFee] = useState<number>(expectations.standardFee);
  const [offeredRoyalty, setOfferedRoyalty] = useState<number>(expectations.standardRoyaltyPercent);
  const [submittedEval, setSubmittedEval] = useState<CollabOfferEvaluation | null>(null);

  // Reset offer defaults when switching NPC artist
  useEffect(() => {
    setOfferedFee(expectations.standardFee);
    setOfferedRoyalty(expectations.standardRoyaltyPercent);
    setSubmittedEval(null);
    onContractChange(null);
  }, [selectedNpcName, expectations.standardFee, expectations.standardRoyaltyPercent]);

  const livePreviewEval = useMemo(
    () =>
      evaluateCollabOffer({
        npcName: selectedNpcName,
        playerPopularity,
        offeredFee,
        offeredRoyaltyPercent: offeredRoyalty
      }),
    [selectedNpcName, playerPopularity, offeredFee, offeredRoyalty]
  );

  const handleSendOffer = () => {
    const result = evaluateCollabOffer({
      npcName: selectedNpcName,
      playerPopularity,
      offeredFee,
      offeredRoyaltyPercent: offeredRoyalty
    });
    setSubmittedEval(result);

    if (result.accepted) {
      onContractChange({
        npcName: expectations.npcName,
        agreedFee: offeredFee,
        agreedRoyaltyPercent: offeredRoyalty,
        qualityBonus: result.qualityBonus,
        signed: true
      });
    } else {
      onContractChange(null);
    }
  };

  const handleApplyCounterRoyalty = () => {
    const nextRoyalty = livePreviewEval.recommendedRoyaltyPercent;
    setOfferedRoyalty(nextRoyalty);
    const result = evaluateCollabOffer({
      npcName: selectedNpcName,
      playerPopularity,
      offeredFee,
      offeredRoyaltyPercent: nextRoyalty
    });
    setSubmittedEval(result);
    if (result.accepted) {
      onContractChange({
        npcName: expectations.npcName,
        agreedFee: offeredFee,
        agreedRoyaltyPercent: nextRoyalty,
        qualityBonus: result.qualityBonus,
        signed: true
      });
    }
  };

  const handleApplyCounterFee = () => {
    const nextFee = livePreviewEval.recommendedFee;
    setOfferedFee(nextFee);
    const result = evaluateCollabOffer({
      npcName: selectedNpcName,
      playerPopularity,
      offeredFee: nextFee,
      offeredRoyaltyPercent: offeredRoyalty
    });
    setSubmittedEval(result);
    if (result.accepted) {
      onContractChange({
        npcName: expectations.npcName,
        agreedFee: nextFee,
        agreedRoyaltyPercent: offeredRoyalty,
        qualityBonus: result.qualityBonus,
        signed: true
      });
    }
  };

  const canAffordFee = playerMoney >= offeredFee;
  const feePresets = useMemo(() => {
    const std = expectations.standardFee;
    return Array.from(new Set([0, Math.round(std * 0.5), std, Math.round(std * 1.5)]));
  }, [expectations.standardFee]);

  return (
    <div className="bg-white rounded-xl border border-neutral-300 shadow-sm p-4 space-y-3.5 animate-in fade-in duration-150">
      {/* Artist Header & Standard Asking Rate */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-3 min-w-0">
          <OfficialArtworkImg
            artist={expectations.npcName}
            explicitSrc={expectations.npcAvatar}
            isArtistPortrait={true}
            alt={expectations.npcName}
            className="w-11 h-11 rounded-full object-cover border border-neutral-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-neutral-900 truncate">
                {expectations.npcName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                {expectations.tierLabel}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Standard Ask: <strong className="text-neutral-800">${formatNumFull(expectations.standardFee)} Fee</strong> +{' '}
              <strong className="text-neutral-800">{expectations.standardRoyaltyPercent}% Royalty</strong> • +{expectations.qualityBonus} Qual
            </div>
          </div>
        </div>

        {contract?.signed ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
            <i className="ph-fill ph-seal-check text-emerald-600 text-xs"></i>
            Signed
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0">
            Offer Required
          </span>
        )}
      </div>

      {/* 1. Upfront Feature Fee ($) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            1. Upfront Feature Fee ($)
          </label>
          <span className={`text-xs font-black ${canAffordFee ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${formatNumFull(offeredFee)} {!canAffordFee && '(Insufficient Cash)'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {feePresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setOfferedFee(preset);
                onContractChange(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                offeredFee === preset
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              ${formatNumFull(preset)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-neutral-400">Custom $:</span>
          <input
            type="number"
            min={0}
            step={250}
            value={offeredFee}
            onChange={e => {
              setOfferedFee(Math.max(0, parseInt(e.target.value) || 0));
              onContractChange(null);
            }}
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* 2. Master Royalty Split (%) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            2. Master Royalty Split (%)
          </label>
          <span className="text-xs font-black text-purple-700">
            {offeredRoyalty}% to {expectations.npcName} • {100 - offeredRoyalty}% Yours
          </span>
        </div>

        <input
          type="range"
          min={5}
          max={50}
          step={1}
          value={offeredRoyalty}
          onChange={e => {
            setOfferedRoyalty(parseInt(e.target.value));
            onContractChange(null);
          }}
          className="w-full accent-neutral-900 cursor-pointer"
        />

        {/* Visual Split Bar */}
        <div className="w-full h-5 rounded-lg overflow-hidden flex text-[10px] font-black">
          <div
            className="bg-emerald-500 text-white flex items-center justify-center transition-all"
            style={{ width: `${100 - offeredRoyalty}%` }}
          >
            YOU ({100 - offeredRoyalty}%)
          </div>
          <div
            className="bg-purple-600 text-white flex items-center justify-center transition-all"
            style={{ width: `${offeredRoyalty}%` }}
          >
            {offeredRoyalty}%
          </div>
        </div>
        <p className="text-[10px] text-neutral-500 leading-snug">
          Tip: Offering a higher <strong>Royalty %</strong> lets you pay a lower (even $0) upfront fee. Offering a higher <strong>Upfront Fee</strong> lets you keep more daily streaming & sales royalties!
        </p>
      </div>

      {/* Deal Likelihood & Send Offer Action */}
      <div className="pt-1 flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
            <span className="text-neutral-500 uppercase">Management Interest</span>
            <span
              className={
                livePreviewEval.acceptanceScore >= 82
                  ? 'text-emerald-600 font-black'
                  : livePreviewEval.acceptanceScore >= 60
                  ? 'text-amber-600 font-black'
                  : 'text-rose-600 font-black'
              }
            >
              {livePreviewEval.acceptanceScore}% ({livePreviewEval.accepted ? 'Ready to Sign' : 'Needs Better Terms'})
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                livePreviewEval.acceptanceScore >= 82
                  ? 'bg-emerald-500'
                  : livePreviewEval.acceptanceScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${livePreviewEval.acceptanceScore}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendOffer}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold active:scale-95 transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
        >
          <i className="ph-fill ph-paper-plane-tilt"></i>
          <span>{contract?.signed ? 'Re-Send Offer' : 'Send Offer'}</span>
        </button>
      </div>

      {/* Artist Response Box */}
      {submittedEval && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-2 ${
            submittedEval.accepted
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/90 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <i
                className={`ph-fill ${
                  submittedEval.accepted ? 'ph-check-circle text-emerald-600' : 'ph-warning-circle text-amber-600'
                } text-sm`}
              ></i>
              {expectations.npcName}'s Management — {submittedEval.statusLabel}
            </span>
            {submittedEval.accepted && (
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                +{submittedEval.qualityBonus} Song Quality
              </span>
            )}
          </div>
          <p className="italic leading-relaxed text-[11px]">{submittedEval.artistQuote}</p>

          {!submittedEval.accepted && (
            <div className="flex flex-wrap gap-2 pt-1">
              {submittedEval.recommendedRoyaltyPercent <= 50 && (
                <button
                  type="button"
                  onClick={handleApplyCounterRoyalty}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[10px] font-bold hover:bg-neutral-800 transition cursor-pointer"
                >
                  Match Royalty Counter ({submittedEval.recommendedRoyaltyPercent}% + ${formatNumFull(offeredFee)})
                </button>
              )}
              <button
                type="button"
                onClick={handleApplyCounterFee}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-[10px] font-bold hover:bg-amber-100 transition cursor-pointer"
              >
                Match Fee Counter (${formatNumFull(submittedEval.recommendedFee)} + {offeredRoyalty}%)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
