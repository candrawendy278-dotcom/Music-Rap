import React from 'react';
import { GameState } from '../../types';
import { ensureMerchStoreState, MerchProductItem } from '../../data/merchWebstoreEngine';
import { MerchVisualPreview } from './MerchVisualPreview';

interface SpotifyArtistMerchShelfProps {
  state: GameState;
  onOpenMerchStore: () => void;
}

export const SpotifyArtistMerchShelf: React.FC<SpotifyArtistMerchShelfProps> = ({
  state,
  onOpenMerchStore,
}) => {
  const store = ensureMerchStoreState(state);
  const items: MerchProductItem[] = store.items || [];
  const artistName = state.artist?.name || 'Artist';

  return (
    <div className="mb-8 px-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[20px] font-black text-white tracking-tight">Merch</h2>
          <p className="text-[11px] text-[#a7a7a7] font-medium">
            Official 180g vinyl, physical music & custom streetwear via {artistName} Official Store
          </p>
        </div>
        <button
          onClick={onOpenMerchStore}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Visit Official Store</span>
          <i className="ph-bold ph-arrow-up-right text-xs"></i>
        </button>
      </div>

      {items.length === 0 ? (
        <div
          onClick={onOpenMerchStore}
          className="rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 p-4 flex items-center justify-between cursor-pointer transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center border border-white/10">
              <i className="ph-fill ph-vinyl-record text-2xl text-[#1ed760]"></i>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white group-hover:text-[#1ed760] transition">
                Launch Official Vinyl & Streetwear Store
              </div>
              <div className="text-[11px] text-[#a7a7a7] mt-0.5">
                Press custom splatter LPs, CDs, cassettes, and custom Front & Back 480GSM streetwear.
              </div>
            </div>
          </div>
          <i className="ph-bold ph-caret-right text-[#a7a7a7] group-hover:text-white"></i>
        </div>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
          {items.slice(0, 8).map((item) => {
            const isSoldOut = item.stockRemaining <= 0;
            const isPreorder = item.isPreOrderRelease;

            return (
              <div
                key={item.id}
                onClick={onOpenMerchStore}
                className="w-[164px] shrink-0 rounded-xl bg-[#181818] hover:bg-[#242424] border border-white/5 p-3 cursor-pointer transition group flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full rounded-lg bg-gradient-to-b from-[#202028] to-[#111115] border border-white/5 flex items-center justify-center mb-2.5 overflow-hidden">
                    <MerchVisualPreview
                      formatId={item.formatId}
                      coverArt={item.coverArt}
                      title={item.linkedReleaseTitle || item.name}
                      artistName={artistName}
                      primaryColor={item.primaryColor}
                      secondaryColor={item.secondaryColor}
                      variantStyle={item.variantStyle}
                      isSigned={item.isSigned}
                      hasObiStrip={item.hasObiStrip}
                      hypeStickerText={item.hypeStickerText}
                      specTier={item.specTier}
                      apparelDesign={item.apparelDesign}
                      viewSide={item.apparelDesign?.defaultViewSide || 'front'}
                      size="sm"
                    />
                    {isSoldOut ? (
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-mono font-black uppercase tracking-wider text-rose-400">
                        SOLD OUT
                      </span>
                    ) : isPreorder ? (
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-mono font-black uppercase tracking-wider text-amber-400">
                        PRE-ORDER
                      </span>
                    ) : item.isLimitedEdition ? (
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-mono font-black uppercase tracking-wider text-purple-400">
                        LIMITED
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[12px] font-bold text-white truncate group-hover:text-[#1ed760] transition">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[#a7a7a7] truncate mt-0.5">
                    {item.formatLabel} · {item.colorwayName}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between font-mono tabular-nums">
                  <span className="text-[12px] font-black text-white">${item.retailPrice}</span>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-0.5">
                    Shop <i className="ph-bold ph-arrow-up-right text-[9px]"></i>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
