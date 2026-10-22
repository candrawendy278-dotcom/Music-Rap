import React from 'react';
import { GameState } from '../../types';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';

interface SpotifyTrackSubRowProps {
  songOrItem: any;
  fallbackArtistName?: string;
  state?: GameState;
  showArtists?: boolean;
  customSubText?: string;
  onSelectArtistName?: (artistName: string, isPlayer: boolean) => void;
  className?: string;
}

/**
 * Renders the authentic Spotify metadata row directly underneath a track title:
 * - [E] Explicit badge ONLY when the track is genuinely explicit
 * - [📺 Music video] TV/screen-play badge when the track has an official Music Video
 * - Artist credits ("Player, Featured Artist" or "NPC 1, NPC 2") with clickable artist names
 */
export const SpotifyTrackSubRow: React.FC<SpotifyTrackSubRowProps> = ({
  songOrItem,
  fallbackArtistName = '',
  state,
  showArtists = true,
  customSubText,
  onSelectArtistName,
  className = ''
}) => {
  const meta = resolveSongMetadataAndCollabCredits(songOrItem, fallbackArtistName, state);
  const playerName = state?.artist?.name || '';

  return (
    <div className={`flex items-center flex-wrap gap-1.5 mt-0.5 min-w-0 ${className}`}>
      {/* Authentic Spotify Explicit [E] Tag — ONLY shown on genuinely explicit songs */}
      {meta.isExplicit && (
        <span
          className="bg-[#A7A7A7] text-[#121212] text-[8px] font-extrabold px-1 py-[0.5px] rounded-[2px] leading-tight shrink-0 select-none"
          title="Explicit"
        >
          E
        </span>
      )}

      {/* Authentic Spotify "Music video" TV / Video Screen Tag */}
      {meta.hasMusicVideo && (
        <span
          className="inline-flex items-center gap-1 bg-white/[0.11] text-[#D4D4D4] text-[9px] font-semibold px-1.5 py-[1px] rounded-[3px] leading-tight shrink-0 select-none"
          title="Music video available"
        >
          <i className="ph-fill ph-television-simple text-[10px] text-[#1DB954] shrink-0"></i>
          <span>Music video</span>
        </span>
      )}

      {/* Artist Credits ("Player, Featured Artist" or "NPC 1, NPC 2") */}
      {showArtists && (
        <div className="text-[#A7A7A7] text-xs truncate min-w-0 flex-1">
          {onSelectArtistName ? (
            meta.allArtists.map((artName, idx) => {
              const isPl =
                Boolean(playerName) && artName.toLowerCase() === playerName.toLowerCase();
              return (
                <React.Fragment key={`${artName}_${idx}`}>
                  {idx > 0 && <span className="text-[#A7A7A7]">, </span>}
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      onSelectArtistName(artName, isPl);
                    }}
                    className="hover:text-white hover:underline cursor-pointer transition-colors"
                  >
                    {artName}
                  </span>
                </React.Fragment>
              );
            })
          ) : (
            <span className="group-hover:underline truncate">
              {meta.formattedArtistCredits}
            </span>
          )}
          {customSubText ? (
            <span className="text-[#A7A7A7]"> • {customSubText}</span>
          ) : null}
        </div>
      )}

      {!showArtists && customSubText && (
        <span className="text-[#A7A7A7] text-xs truncate">{customSubText}</span>
      )}
    </div>
  );
};
