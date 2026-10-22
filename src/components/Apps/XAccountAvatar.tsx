import React from 'react';
import { resolveXAccountAvatar } from '../../data/xAccountAvatarsAndMoreTweetsEngine';

interface XAccountAvatarProps {
  authorHandle?: string;
  authorName?: string;
  explicitAvatar?: string;
  playerAvatar?: string;
  isPlayerPost?: boolean;
  verifiedType?: 'blue' | 'gold' | 'grey';
  sizeClass?: string;
}

export const XAccountAvatar: React.FC<XAccountAvatarProps> = ({
  authorHandle,
  authorName,
  explicitAvatar,
  playerAvatar,
  isPlayerPost = false,
  verifiedType,
  sizeClass = 'w-10 h-10'
}) => {
  const avatarSrc = resolveXAccountAvatar({
    authorHandle,
    authorName,
    explicitAvatar,
    playerAvatar,
    isPlayerPost
  });

  return (
    <img
      src={avatarSrc}
      alt={authorName || authorHandle || 'X Account'}
      className={`${sizeClass} bg-neutral-900 object-cover shrink-0 border border-white/15 ${
        verifiedType === 'gold' ? 'rounded-lg' : 'rounded-full'
      }`}
    />
  );
};
