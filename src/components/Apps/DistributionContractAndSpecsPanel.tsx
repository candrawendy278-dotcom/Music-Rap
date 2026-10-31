import React, { useMemo } from 'react';
import { Song, Project } from '../../types';
import { formatMoney } from '../../constants';
import {
  getRealDistributorById,
  getAudioDeliveryFormatById,
  getPhysicalRetailTierById,
  generateAuthenticISRC,
  generateAuthenticUPC,
  PRIORITY_TERRITORY_OPTIONS
} from '../../data/realWorldMusicDistributionEngine';

interface DistributionContractAndSpecsPanelProps {
  song: Song;
  parentProject?: Project | null;
  artistCountry: string;
}

export default function DistributionContractAndSpecsPanel({
  song,
  parentProject,
  artistCountry
}: DistributionContractAndSpecsPanelProps) {
  const contractMeta = useMemo(() => {
    const distroId =
      song.distributorId || parentProject?.distributorId || parentProject?.distributor || 'distrokid';
    const distro = getRealDistributorById(distroId);
    const audioSpec = getAudioDeliveryFormatById(
      song.audioFormat || parentProject?.audioFormat || 'standard'
    );
    const retailSpec = getPhysicalRetailTierById(
      song.physicalRetailPush || parentProject?.physicalRetailPush || 'none'
    );

    const artistShare =
      song.royaltyArtistShare ?? parentProject?.royaltyArtistShare ?? distro.artistRoyaltyPercent;
    const distributorShare = Math.max(0, 100 - artistShare);

    const isrc =
      song.isrcCode ||
      generateAuthenticISRC(song.id || 1, song.title || 'Track', artistCountry, distro.id, 2026);
    const upc =
      song.upcCode ||
      parentProject?.upcCode ||
      generateAuthenticUPC(
        parentProject?.id || song.id || 1,
        parentProject?.title || song.title || 'Release',
        distro.id
      );

    const advanceAmount = song.advanceAmount ?? parentProject?.advanceAmount ?? 0;
    const unrecoupedAdvance = song.unrecoupedAdvance ?? parentProject?.unrecoupedAdvance ?? 0;
    const recoupedAmount = Math.max(0, advanceAmount - unrecoupedAdvance);
    const recoupPercent =
      advanceAmount > 0 ? Math.min(100, Math.round((recoupedAmount / advanceAmount) * 100)) : 100;

    // Estimate cumulative gross royalties if totalRoyaltiesEarned wasn't tracked from Day 0
    const fallbackEarned =
      ((song.streams || 0) * 0.0038 + (song.pureSales || 0) * 0.7 + (song.views || 0) * 0.0022) *
      (artistShare / 100);
    const totalArtistRoyalties = Math.max(
      song.totalRoyaltiesEarned || 0,
      Math.round(fallbackEarned)
    );

    const priorityRegionRaw = song.priorityRegion || parentProject?.priorityRegion || 'auto';
    const priorityMeta =
      PRIORITY_TERRITORY_OPTIONS.find(p => p.id === priorityRegionRaw) ||
      PRIORITY_TERRITORY_OPTIONS[0];

    const contentIdActive = Boolean(song.contentIdEnabled ?? parentProject?.contentIdEnabled);

    return {
      distro,
      audioSpec,
      retailSpec,
      artistShare,
      distributorShare,
      isrc,
      upc,
      advanceAmount,
      unrecoupedAdvance,
      recoupedAmount,
      recoupPercent,
      totalArtistRoyalties,
      priorityMeta,
      contentIdActive
    };
  }, [song, parentProject, artistCountry]);

  return (
    <div className="p-4 rounded-xl bg-[#12151E] border border-white/[0.08] space-y-3.5">
      {/* Header Row: Distributor Partner & Royalty Split */}
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="text-[11px] text-zinc-400">
            <span>Distribution & DSP Delivery Contract</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="text-zinc-300">{contractMeta.distro.parentCompany}</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">
            {contractMeta.distro.name}
          </h4>
        </div>

        <div className="text-right font-mono tabular-nums">
          <div className="text-xs font-bold text-emerald-400">
            {contractMeta.artistShare}% Artist / {contractMeta.distributorShare}% Distro
          </div>
          <div className="text-[11px] text-zinc-400">
            Net Earned: {formatMoney(Math.round(contractMeta.totalArtistRoyalties))}
          </div>
        </div>
      </div>

      {/* Technical Delivery Registry Grid (ISRC, UPC, Audio Master, Retail & Territory Focus) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[11px] text-zinc-500 block">ISRC / UPC Registry</span>
          <span className="font-mono tabular-nums text-zinc-200 font-semibold block truncate mt-0.5">
            {contractMeta.isrc}
          </span>
          <span className="font-mono tabular-nums text-[10px] text-zinc-500 block">
            UPC {contractMeta.upc}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-zinc-500 block">Master Audio Format</span>
          <span className="text-zinc-200 font-semibold block truncate mt-0.5">
            {contractMeta.audioSpec.shortLabel}
          </span>
          <span className="text-[10px] text-zinc-400 block truncate">
            {contractMeta.contentIdActive ? 'Content ID Active' : 'Standard DSP Rights'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-zinc-500 block">Priority Territory Push</span>
          <span className="text-sky-400 font-semibold block truncate mt-0.5">
            {contractMeta.priorityMeta.shortBadge}
          </span>
          <span className="text-[10px] text-zinc-500 block truncate">
            {contractMeta.priorityMeta.id === 'auto' ? 'Worldwide Organic' : '+35% Region Weight'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-zinc-500 block">Physical & Store Allocation</span>
          <span className="text-zinc-200 font-semibold block truncate mt-0.5">
            {contractMeta.retailSpec.shortLabel}
          </span>
          <span className="text-[10px] text-zinc-500 block truncate">
            {contractMeta.distro.deliverySpeedLabel}
          </span>
        </div>
      </div>

      {/* Advance & Recoupment Ledger (shown when an Advance was taken or show 100% Recouped status) */}
      <div className="pt-2.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums mb-1.5">
          <span className="text-zinc-400">
            {contractMeta.advanceAmount > 0
              ? `Label Advance: ${formatMoney(contractMeta.advanceAmount)} (${contractMeta.recoupPercent}% Recouped)`
              : 'No Recoupable Advance · 100% Immediate Daily Payouts'}
          </span>
          <span
            className={
              contractMeta.unrecoupedAdvance > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'
            }
          >
            {contractMeta.unrecoupedAdvance > 0
              ? `Unrecouped: ${formatMoney(Math.round(contractMeta.unrecoupedAdvance))}`
              : 'Recouped · Paying Net Cash'}
          </span>
        </div>

        {contractMeta.advanceAmount > 0 && (
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                contractMeta.unrecoupedAdvance > 0 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${contractMeta.recoupPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
