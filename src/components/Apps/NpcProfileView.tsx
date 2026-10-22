import React from 'react';
import { DetailedNPC } from '../../data/npcAssets';
import { SpotifyNpcArtistProfileView } from './SpotifyNpcArtistProfileView';

interface NpcProfileViewProps {
  npc: DetailedNPC;
  onClose: () => void;
}

export const NpcProfileView: React.FC<NpcProfileViewProps> = ({ npc, onClose }) => {
  return <SpotifyNpcArtistProfileView npc={npc} onClose={onClose} />;
};
