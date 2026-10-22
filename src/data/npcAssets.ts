import { NPC } from '../types';
import {
  REAL_WORLD_NPCS,
  resolveRealWorldArtistPhoto,
  resolveRealWorldCoverArt,
  normalizeRealArtistName,
  normalizeRealTitle
} from './realWorldArtistCatalog';

export interface NpcSong {
  title: string;
  streams: number;
  dailyStreams?: number;
  weeklyStreams?: number;
  radio: number;
  sales: number;
  dailySales?: number;
  weeklySales?: number;
  daysSinceRelease?: number;
  cover: string;
}

export interface NpcAlbum {
  title: string;
  cover: string;
  sales?: number;
  dailySales?: number;
  weeklySales?: number;
  streams?: number;
  dailyStreams?: number;
  weeklyStreams?: number;
  daysSinceRelease?: number;
  year?: number;
  tracks?: Array<{
    title: string;
    streams: number;
    dailyStreams?: number;
    weeklyStreams?: number;
    sales?: number;
    dailySales?: number;
    radio?: number;
    daysSinceRelease?: number;
    cover?: string;
    trackType: 'lead_single' | 'single' | 'b_side';
  }>;
}

export interface DetailedNPC extends NPC {
  image: string;
  avatar: string;
  genre: string;
  bio: string;
  songs: NpcSong[];
  albums: NpcAlbum[];
}

export const DETAILED_NPCS: DetailedNPC[] = REAL_WORLD_NPCS;

export function getDetailedNPC(artistName: string): DetailedNPC | undefined {
  if (!artistName) return undefined;
  const cleanName = normalizeRealArtistName(artistName).toLowerCase();
  const primaryName = cleanName.split(/\s+(?:&|feat\.|ft\.|with|,)\s+/i)[0].trim();
  return (
    DETAILED_NPCS.find(n => n.name.toLowerCase() === cleanName) ||
    DETAILED_NPCS.find(n => n.name.toLowerCase() === primaryName) ||
    DETAILED_NPCS.find(n => cleanName.includes(n.name.toLowerCase()))
  );
}

/**
 * Returns the real-world NPC avatar by ID or Name.
 */
export function getNpcAvatar(idOrName: string): string {
  return resolveRealWorldArtistPhoto(idOrName);
}

/**
 * Returns official real-world cover art for a track/album given the artist and title.
 */
export function getTrackCoverArt(artistName: string, trackTitle?: string): string {
  const realArtist = normalizeRealArtistName(artistName);
  const realTitle = trackTitle ? normalizeRealTitle(trackTitle) : undefined;
  return resolveRealWorldCoverArt(realArtist, realTitle, false);
}

