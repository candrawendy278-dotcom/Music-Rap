import React, { useEffect, useState } from 'react';
import {
  resolveRealWorldCoverArt,
  resolveRealWorldArtistPhoto,
  fetchOfficialCoverFromITunes,
  fetchOfficialArtistPhoto,
  generateFallbackCoverSvg,
  generateFallbackArtistAvatar,
  normalizeRealArtistName,
  normalizeRealTitle,
  subscribeToArtworkUpdates,
  evictBrokenCoverUrl
} from '../../data/realWorldArtistCatalog';
import { resolvePlayerArtworkFromVault } from '../../utils/smartStorageEngine';

interface OfficialArtworkImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  artist: string;
  title?: string;
  isAlbum?: boolean;
  isArtistPortrait?: boolean;
  isPlayer?: boolean;
  explicitSrc?: string;
}

export const OfficialArtworkImg: React.FC<OfficialArtworkImgProps> = ({
  artist,
  title = '',
  isAlbum = false,
  isArtistPortrait = false,
  isPlayer = false,
  explicitSrc,
  className = '',
  alt,
  ...rest
}) => {
  const cleanArtist = isPlayer ? (artist || 'Artist') : normalizeRealArtistName(artist || 'Unknown Artist');
  const cleanTitle = isPlayer ? (title || '') : normalizeRealTitle(title || '', cleanArtist, isAlbum);

  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (isPlayer) {
      const vaultCover = resolvePlayerArtworkFromVault(
        cleanTitle,
        isAlbum,
        isArtistPortrait,
        explicitSrc
      );
      if (vaultCover) return vaultCover;
      return isArtistPortrait
        ? generateFallbackArtistAvatar(cleanArtist)
        : generateFallbackCoverSvg(cleanArtist, cleanTitle || cleanArtist);
    }
    if (isArtistPortrait) {
      return resolveRealWorldArtistPhoto(cleanArtist, explicitSrc);
    }
    return resolveRealWorldCoverArt(cleanArtist, cleanTitle || cleanArtist, isAlbum, explicitSrc);
  });

  const [triedAsyncFallback, setTriedAsyncFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTriedAsyncFallback(false);

    if (isPlayer) {
      const vaultCover = resolvePlayerArtworkFromVault(
        cleanTitle,
        isAlbum,
        isArtistPortrait,
        explicitSrc
      );
      if (vaultCover) {
        setImgSrc(vaultCover);
      } else {
        setImgSrc(
          isArtistPortrait
            ? generateFallbackArtistAvatar(cleanArtist)
            : generateFallbackCoverSvg(cleanArtist, cleanTitle || cleanArtist)
        );
      }
      return;
    }

    if (
      explicitSrc &&
      explicitSrc.startsWith('data:image/') &&
      !explicitSrc.startsWith('data:image/svg+xml')
    ) {
      setImgSrc(explicitSrc);
      return;
    }

    const syncFromCache = () => {
      if (cancelled) return;
      if (isArtistPortrait) {
        const cachedPhoto = resolveRealWorldArtistPhoto(cleanArtist, explicitSrc);
        if (cachedPhoto && cachedPhoto.startsWith('http')) {
          setImgSrc(cachedPhoto);
        }
      } else {
        const cachedCover = resolveRealWorldCoverArt(
          cleanArtist,
          cleanTitle || cleanArtist,
          isAlbum,
          explicitSrc
        );
        if (cachedCover && cachedCover.startsWith('http')) {
          setImgSrc(cachedCover);
        }
      }
    };

    const unsubscribe = subscribeToArtworkUpdates(syncFromCache);

    if (isArtistPortrait) {
      const initialPhoto = resolveRealWorldArtistPhoto(cleanArtist, explicitSrc);
      setImgSrc(initialPhoto);

      if (!initialPhoto.startsWith('http')) {
        fetchOfficialArtistPhoto(cleanArtist).then(resolvedPhoto => {
          if (!cancelled && resolvedPhoto) {
            setImgSrc(resolvedPhoto);
          }
        });
      }

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    const initialCover = resolveRealWorldCoverArt(
      cleanArtist,
      cleanTitle || cleanArtist,
      isAlbum,
      explicitSrc
    );
    setImgSrc(initialCover);

    if (cleanArtist && !initialCover.startsWith('http')) {
      fetchOfficialCoverFromITunes(cleanArtist, cleanTitle || cleanArtist, isAlbum).then(
        resolvedUrl => {
          if (!cancelled && resolvedUrl) {
            setImgSrc(resolvedUrl);
          }
        }
      );
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [cleanArtist, cleanTitle, isAlbum, isArtistPortrait, isPlayer, explicitSrc]);

  const handleImgError = () => {
    if (imgSrc && imgSrc.startsWith('http')) {
      evictBrokenCoverUrl(cleanArtist, cleanTitle, imgSrc);
    }

    if (isPlayer) {
      setImgSrc(
        isArtistPortrait
          ? generateFallbackArtistAvatar(cleanArtist)
          : generateFallbackCoverSvg(cleanArtist, cleanTitle || cleanArtist)
      );
      return;
    }

    if (isArtistPortrait) {
      if (!triedAsyncFallback) {
        setTriedAsyncFallback(true);
        fetchOfficialArtistPhoto(cleanArtist).then(url => {
          if (url && url !== imgSrc) {
            setImgSrc(url);
          } else {
            setImgSrc(generateFallbackArtistAvatar(cleanArtist));
          }
        });
      } else {
        setImgSrc(generateFallbackArtistAvatar(cleanArtist));
      }
      return;
    }

    if (!triedAsyncFallback) {
      setTriedAsyncFallback(true);
      fetchOfficialCoverFromITunes(cleanArtist, cleanTitle || cleanArtist, isAlbum, true).then(
        coverUrl => {
          if (coverUrl && coverUrl !== imgSrc) {
            setImgSrc(coverUrl);
          } else {
            setImgSrc(generateFallbackCoverSvg(cleanArtist, cleanTitle || cleanArtist));
          }
        }
      );
    } else {
      setImgSrc(generateFallbackCoverSvg(cleanArtist, cleanTitle || cleanArtist));
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || (isArtistPortrait ? cleanArtist : `${cleanTitle} - ${cleanArtist}`)}
      className={className}
      onError={handleImgError}
      loading="lazy"
      {...rest}
    />
  );
};
