import React, { useState, useRef, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import { compressImageFile } from '../../utils/imageOptimizer';
import { saveGameStateSafely } from '../../utils/saveStateOptimizer';
import { 
  XPost, 
  getEnsuredXProfile, 
  createPlayerPost, 
  generateIndustryFeedTweets 
} from '../../data/xSocialEngine';
import XEditProfileModal from './XEditProfileModal';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { XAccountAvatar } from './XAccountAvatar';

/**
 * Formats tweet text by highlighting @handles, #hashtags, and domain links in X Blue (#1D9BF0)
 */
function renderFormattedTweetText(content: string) {
  const parts = content.split(/(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+|charts\.spotify\.com|billboard\.com|spotifycharts\.com)/g);
  return parts.map((part, idx) => {
    if (
      part.startsWith('@') ||
      part.startsWith('#') ||
      part === 'charts.spotify.com' ||
      part === 'billboard.com' ||
      part === 'spotifycharts.com'
    ) {
      return (
        <span key={idx} className="text-[#1D9BF0] hover:underline cursor-pointer font-normal">
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export default function XApp() {
  const { state, setState } = useGameContext();
  const [activeView, setActiveView] = useState<'feed' | 'profile'>('feed');
  const [profileSubTab, setProfileSubTab] = useState<'posts' | 'replies' | 'highlights' | 'media' | 'likes'>('posts');
  const [feedFilter, setFeedFilter] = useState<'all' | 'charts' | 'platforms' | 'fanbase'>('all');
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [likedTweetIds, setLikedTweetIds] = useState<Set<string>>(new Set());
  const [repostedTweetIds, setRepostedTweetIds] = useState<Set<string>>(new Set());
  const [bookmarkedTweetIds, setBookmarkedTweetIds] = useState<Set<string>>(new Set());
  const [noticeMessage, setNoticeMessage] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const artist = state.artist;
  const profile = useMemo(() => getEnsuredXProfile(state), [state.xProfile, state.artist, state.fans, state.popularity, state.songs, state.xPosts]);
  const artistAvatar = artist?.image || `https://placehold.co/400x400/1C1C1E/FFFFFF?text=${encodeURIComponent((profile.name || 'A').charAt(0))}`;

  const releasedSongs = useMemo(() => (state.songs || []).filter(s => s.status === 'released'), [state.songs]);
  const latestReleasedSong = releasedSongs[releasedSongs.length - 1];

  // Keep player posts from GameState
  const playerPosts = useMemo<XPost[]>(() => {
    return (state.xPosts || []).filter(p => p.isPlayerPost);
  }, [state.xPosts]);

  // Combined feed: player posts + industry/fan tweets stored in state.xPosts
  const allFeedTweets = useMemo<XPost[]>(() => {
    if (!state.xPosts || state.xPosts.length === 0) {
      return generateIndustryFeedTweets(state);
    }
    return state.xPosts;
  }, [state.xPosts, state.songs, state.fans, state.popularity, state.hype, state.billboard, state.itunes, state.spotify, state.youtube, state.date, profile.name, profile.handle]);

  // Ensure initial feed is populated if xPosts is empty
  React.useEffect(() => {
    if (!state.xPosts || state.xPosts.length === 0) {
      const initial = generateIndustryFeedTweets(state);
      setState(prev => ({
        ...prev,
        xPosts: initial
      }));
    }
  }, []);

  // Filtered feed according to chosen feed category tab
  const filteredFeedTweets = useMemo<XPost[]>(() => {
    if (feedFilter === 'charts') {
      return allFeedTweets.filter(t => t.category === 'chart');
    }
    if (feedFilter === 'platforms') {
      return allFeedTweets.filter(t => t.category === 'platform' || t.category === 'media');
    }
    if (feedFilter === 'fanbase') {
      return allFeedTweets.filter(t => t.category === 'fanbase' || t.isPlayerPost);
    }
    return allFeedTweets;
  }, [allFeedTweets, feedFilter]);

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 3000);
  };

  const handleClose = () => {
    setState(p => ({ ...p, activeApp: 'none' }));
  };

  // Direct 1-tap quick avatar update
  const handleQuickAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && artist) {
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setState(prev => {
          if (!prev.artist) return prev;
          const updated = {
            ...prev,
            artist: {
              ...prev.artist,
              image: compressed
            },
            xPosts: (prev.xPosts || []).map(p => p.isPlayerPost ? { ...p, authorAvatar: compressed } : p)
          };
          saveGameStateSafely(updated).catch(console.error);
          return updated;
        });
        showNotification('Profile picture updated!');
      }
    }
    if (e.target) e.target.value = '';
  };

  // Handle post image attachment
  const handlePostImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingImage(true);
      const compressed = await compressImageFile(file, 480, 0.82);
      if (compressed) {
        setComposerImage(compressed);
      }
      setIsCompressingImage(false);
    }
    if (e.target) e.target.value = '';
  };

  // Handle creating a new post (text and/or photo)
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() && !composerImage) return;

    const newPost = createPlayerPost(state, composerText, composerImage || undefined);

    setState(prev => {
      const updatedPosts = [newPost, ...(prev.xPosts || [])];
      // Posting on X also gives a subtle organic social buzz nudge (+0.35% hype up to 100)
      const nextHype = Math.min(100, Number(((prev.hype || 10) + 0.35).toFixed(2)));
      const updatedState = {
        ...prev,
        hype: nextHype,
        xPosts: updatedPosts
      };
      saveGameStateSafely(updatedState).catch(console.error);
      return updatedState;
    });

    setComposerText('');
    setComposerImage(null);
    showNotification('Post published to your timeline! (+0.35% Hype)');
  };

  const applyQuickTemplate = (type: 'studio' | 'promote' | 'gratitude') => {
    if (type === 'studio') {
      setComposerText(`Locked in the studio tonight working on new music. This next era sounds unreal 🎙️💿✨`);
    } else if (type === 'promote' && latestReleasedSong) {
      setComposerText(`"${latestReleasedSong.title}" is out now on all streaming platforms! Run the numbers up & tell me your favorite lyric below 🎧🔥`);
      if (latestReleasedSong.cover) setComposerImage(latestReleasedSong.cover);
    } else {
      setComposerText(`Seeing all of your edits, streams, and support today... I love you guys so much. Thank you for riding with me ❤️✨`);
    }
  };

  // Handle saving profile changes from XEditProfileModal
  const handleSaveProfile = (updated: {
    name: string;
    handle: string;
    bio: string;
    banner: string;
    avatar?: string;
  }) => {
    setState(prev => {
      const updatedArtist = prev.artist ? {
        ...prev.artist,
        name: updated.name || prev.artist.name,
        image: updated.avatar || prev.artist.image
      } : prev.artist;

      const updatedProfile = {
        ...(prev.xProfile || {}),
        name: updated.name,
        handle: updated.handle,
        bio: updated.bio,
        banner: updated.banner
      };

      const updatedPosts = (prev.xPosts || []).map(p => {
        if (!p.isPlayerPost) return p;
        return {
          ...p,
          authorName: updated.name,
          authorHandle: updated.handle,
          authorAvatar: updated.avatar || p.authorAvatar
        };
      });

      const nextState = {
        ...prev,
        artist: updatedArtist,
        xProfile: updatedProfile,
        xPosts: updatedPosts
      };

      saveGameStateSafely(nextState).catch(console.error);
      return nextState;
    });

    showNotification('Profile updated successfully!');
  };

  const toggleLike = (tweetId: string) => {
    setLikedTweetIds(prev => {
      const next = new Set(prev);
      if (next.has(tweetId)) next.delete(tweetId);
      else next.add(tweetId);
      return next;
    });
  };

  const toggleRepost = (tweetId: string) => {
    setRepostedTweetIds(prev => {
      const next = new Set(prev);
      if (next.has(tweetId)) next.delete(tweetId);
      else next.add(tweetId);
      return next;
    });
  };

  const toggleBookmark = (tweetId: string) => {
    setBookmarkedTweetIds(prev => {
      const next = new Set(prev);
      if (next.has(tweetId)) next.delete(tweetId);
      else next.add(tweetId);
      return next;
    });
  };

  // Filter player posts based on sub-tab
  const filteredProfilePosts = useMemo(() => {
    if (playerPosts.length === 0 && profileSubTab !== 'likes') {
      return [
        {
          id: 'pinned-welcome',
          authorName: profile.name,
          authorHandle: profile.handle,
          authorAvatar: artistAvatar,
          isVerified: true,
          verifiedType: 'blue' as const,
          timeAgo: 'Pinned',
          content: `Welcome to my official X page. Thank you to all my fans for streaming and supporting the music! Working on new records right now 💿✨`,
          likes: Math.max(380, Math.round(profile.followers * 0.035)),
          reposts: Math.max(90, Math.round(profile.followers * 0.01)),
          replies: 42,
          views: Math.max(6800, Math.round(profile.followers * 0.3)),
          isPlayerPost: true
        }
      ];
    }

    if (profileSubTab === 'posts') {
      return playerPosts;
    }
    if (profileSubTab === 'media') {
      return playerPosts.filter(p => !!p.image);
    }
    if (profileSubTab === 'highlights') {
      return [...playerPosts].sort((a, b) => b.likes - a.likes);
    }
    if (profileSubTab === 'likes') {
      return allFeedTweets.filter(t => likedTweetIds.has(t.id));
    }
    return playerPosts;
  }, [playerPosts, profileSubTab, profile.name, profile.handle, artistAvatar, profile.followers, allFeedTweets, likedTweetIds]);

  const renderTweetCard = (tweet: XPost) => {
    const isLiked = likedTweetIds.has(tweet.id) || tweet.isLiked;
    const isReposted = repostedTweetIds.has(tweet.id) || tweet.isReposted;
    const isBookmarked = bookmarkedTweetIds.has(tweet.id) || tweet.isBookmarked;
    const currentLikes = tweet.likes + (isLiked && !tweet.isLiked ? 1 : 0);
    const currentReposts = tweet.reposts + (isReposted && !tweet.isReposted ? 1 : 0);

    return (
      <article key={tweet.id} className="px-4 py-3.5 hover:bg-[#080808] transition flex space-x-3">
        <XAccountAvatar
          authorHandle={tweet.authorHandle}
          authorName={tweet.authorName}
          explicitAvatar={tweet.authorAvatar}
          playerAvatar={artistAvatar}
          isPlayerPost={Boolean(tweet.isPlayerPost)}
          verifiedType={tweet.verifiedType}
          sizeClass="w-10 h-10"
        />
        <div className="flex-1 min-w-0">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center space-x-1 min-w-0">
              <span className="font-bold text-[#E7E9EA] truncate max-w-[155px] text-[15px] leading-5">
                {tweet.authorName}
              </span>
              {tweet.verifiedType === 'gold' ? (
                <i className="ph-fill ph-seal-check text-[#E7A33E] text-[15px] shrink-0" title="Verified Organization"></i>
              ) : (tweet.isVerified || tweet.verifiedType === 'blue') ? (
                <i className="ph-fill ph-seal-check text-[#1D9BF0] text-[15px] shrink-0" title="Verified Account"></i>
              ) : null}
              <span className="text-[#71767B] text-[13px] truncate">
                {tweet.authorHandle}
              </span>
              <span className="text-[#71767B] text-xs">·</span>
              <span className="text-[#71767B] text-[13px] shrink-0">{tweet.timeAgo}</span>
            </div>
            <button className="text-[#71767B] hover:text-[#1D9BF0] p-1 rounded-full transition">
              <i className="ph-bold ph-dots-three text-base"></i>
            </button>
          </div>

          {/* Tweet Content */}
          {tweet.content && (
            <div className="text-[#E7E9EA] text-[14.5px] whitespace-pre-wrap leading-[1.38] mb-2.5 break-words">
              {renderFormattedTweetText(tweet.content)}
            </div>
          )}

          {/* Attached Tweet Media Card */}
          {tweet.image && (
            <div className="rounded-2xl overflow-hidden border border-[#2F3336] mb-2.5 bg-[#0D0F12] relative">
              <div className="relative max-h-72 overflow-hidden bg-neutral-950">
                <img
                  src={tweet.image}
                  alt="Post media"
                  className="w-full h-auto object-cover max-h-72"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                {tweet.mediaBadge && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {tweet.mediaBadge}
                  </div>
                )}
              </div>
              {(tweet.mediaTitle || tweet.mediaSubtitle) && (
                <div className="px-3.5 py-2.5 border-t border-[#2F3336] bg-[#111317]">
                  {tweet.mediaTitle && (
                    <div className="text-xs font-bold text-[#E7E9EA] truncate">{tweet.mediaTitle}</div>
                  )}
                  {tweet.mediaSubtitle && (
                    <div className="text-[11px] text-[#71767B] truncate mt-0.5">{tweet.mediaSubtitle}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Embedded Quote Tweet Box */}
          {tweet.quoteTweet && (
            <div className="rounded-2xl border border-[#2F3336] bg-[#16181C]/35 hover:bg-[#16181C]/60 transition p-3 mb-2.5">
              <div className="flex items-center space-x-1.5 mb-1.5">
                <XAccountAvatar
                  authorHandle={tweet.quoteTweet.authorHandle}
                  authorName={tweet.quoteTweet.authorName}
                  explicitAvatar={tweet.quoteTweet.authorAvatar}
                  playerAvatar={artistAvatar}
                  verifiedType={tweet.quoteTweet.verifiedType}
                  sizeClass="w-4 h-4"
                />
                <span className="font-bold text-[#E7E9EA] text-xs truncate">
                  {tweet.quoteTweet.authorName}
                </span>
                {tweet.quoteTweet.verifiedType === 'gold' ? (
                  <i className="ph-fill ph-seal-check text-[#E7A33E] text-xs shrink-0"></i>
                ) : tweet.quoteTweet.isVerified ? (
                  <i className="ph-fill ph-seal-check text-[#1D9BF0] text-xs shrink-0"></i>
                ) : null}
                <span className="text-[#71767B] text-xs truncate">{tweet.quoteTweet.authorHandle}</span>
              </div>
              <p className="text-[#E7E9EA] text-xs leading-relaxed">
                {renderFormattedTweetText(tweet.quoteTweet.content)}
              </p>
            </div>
          )}

          {/* Actions Bar: Reply, Repost, Like, Views, Bookmark */}
          <div className="flex items-center justify-between text-[#71767B] text-xs max-w-sm pt-1">
            <button className="flex items-center space-x-1.5 hover:text-[#1D9BF0] transition group cursor-pointer">
              <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-[#1D9BF0]/10 transition">
                <i className="ph ph-chat-circle text-[16px]"></i>
              </div>
              <span className="tabular-nums">{formatNum(tweet.replies)}</span>
            </button>

            <button 
              onClick={() => toggleRepost(tweet.id)}
              className={`flex items-center space-x-1.5 transition group cursor-pointer ${isReposted ? 'text-[#00BA7C]' : 'hover:text-[#00BA7C]'}`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-[#00BA7C]/10 transition">
                <i className={`ph ph-arrows-clockwise text-[16px] ${isReposted ? 'font-bold' : ''}`}></i>
              </div>
              <span className="tabular-nums">{formatNum(currentReposts)}</span>
            </button>

            <button 
              onClick={() => toggleLike(tweet.id)}
              className={`flex items-center space-x-1.5 transition group cursor-pointer ${isLiked ? 'text-[#F91880]' : 'hover:text-[#F91880]'}`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-[#F91880]/10 transition">
                <i className={`ph ${isLiked ? 'ph-fill ph-heart text-[#F91880]' : 'ph-heart'} text-[16px]`}></i>
              </div>
              <span className="tabular-nums">{formatNum(currentLikes)}</span>
            </button>

            <div className="flex items-center space-x-1.5 hover:text-[#1D9BF0] transition">
              <i className="ph ph-chart-bar text-[16px]"></i>
              <span className="tabular-nums">{formatNum(tweet.views)}</span>
            </div>

            <button
              onClick={() => toggleBookmark(tweet.id)}
              className={`p-1.5 -mr-1.5 rounded-full transition cursor-pointer ${
                isBookmarked ? 'text-[#1D9BF0]' : 'hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10'
              }`}
            >
              <i className={`ph ${isBookmarked ? 'ph-fill ph-bookmark-simple' : 'ph-bookmark-simple'} text-[16px]`}></i>
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#000000] text-[#E7E9EA] z-50 overflow-y-auto flex flex-col font-sans animate-in fade-in hide-scrollbar">
      {/* Hidden file input for 1-tap avatar update */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleQuickAvatarChange} 
      />

      {/* Hidden file input for composer photo upload */}
      <input 
        type="file" 
        ref={postImageInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handlePostImageSelect} 
      />

      {/* Profile Edit Modal */}
      <XEditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={profile}
        currentAvatar={artistAvatar}
        onSave={handleSaveProfile}
      />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-[#000000]/85 backdrop-blur-md border-b border-[#2F3336] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleClose} 
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
            title="Return to Game"
          >
            <i className="ph ph-arrow-left text-xl text-white"></i>
          </button>
          <div className="flex items-center space-x-1.5">
            <span className="text-base font-extrabold tracking-tight truncate max-w-[170px]">
              {activeView === 'feed' ? 'Music Timeline' : profile.name}
            </span>
            {activeView === 'profile' && (
              <i className="ph-fill ph-seal-check text-[#1D9BF0] text-base shrink-0"></i>
            )}
          </div>
        </div>

        {/* X Logo in Center */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </svg>
        </div>

        {/* Quick Profile Access / Switch View */}
        <button 
          onClick={() => setActiveView(activeView === 'feed' ? 'profile' : 'feed')}
          className="w-8 h-8 rounded-full border border-white/20 bg-neutral-800 bg-cover bg-center overflow-hidden cursor-pointer hover:border-white transition"
          style={{ backgroundImage: `url(${artistAvatar})` }}
          title={activeView === 'feed' ? 'View Artist Profile' : 'Back to Timeline'}
        />
      </header>

      {/* Primary Navigation Tabs: For You Feed vs Artist Profile */}
      <div className="sticky top-[49px] z-20 bg-[#000000]/90 backdrop-blur-md border-b border-[#2F3336] flex">
        <button
          onClick={() => setActiveView('feed')}
          className={`flex-1 py-3 text-sm font-bold text-center transition relative cursor-pointer ${
            activeView === 'feed' ? 'text-white' : 'text-[#71767B] hover:text-white/80'
          }`}
        >
          <span>For You</span>
          {activeView === 'feed' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveView('profile')}
          className={`flex-1 py-3 text-sm font-bold text-center transition relative cursor-pointer ${
            activeView === 'profile' ? 'text-white' : 'text-[#71767B] hover:text-white/80'
          }`}
        >
          <span>{profile.handle}</span>
          {activeView === 'profile' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1D9BF0] rounded-full"></div>
          )}
        </button>
      </div>

      {/* Floating Notification */}
      {noticeMessage && (
        <div className="bg-[#1D9BF0] text-white text-xs font-bold text-center py-2 px-4 sticky top-[95px] z-40 animate-in fade-in shadow-md">
          {noticeMessage}
        </div>
      )}

      {/* --- 1. FEED VIEW --- */}
      {activeView === 'feed' && (
        <div className="flex-1 flex flex-col divide-y divide-[#2F3336]">
          {/* Tweet Composer */}
          <div className="p-4 flex space-x-3 bg-[#000000]">
            <div 
              className="w-10 h-10 rounded-full bg-neutral-800 bg-cover bg-center shrink-0 border border-white/10"
              style={{ backgroundImage: `url(${artistAvatar})` }}
            />
            <form onSubmit={handleCreatePost} className="flex-1 min-w-0">
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="What is happening?!"
                rows={2}
                className="w-full bg-transparent text-white placeholder-[#71767B] text-[15px] resize-none focus:outline-none leading-snug"
              />

              {/* Quick Artist Post Prompts */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-2">
                <button
                  type="button"
                  onClick={() => applyQuickTemplate('studio')}
                  className="px-2.5 py-1 rounded-full bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[11px] font-semibold text-[#71767B] hover:text-[#E7E9EA] whitespace-nowrap transition cursor-pointer"
                >
                  🎙️ Tease Studio
                </button>
                {latestReleasedSong && (
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate('promote')}
                    className="px-2.5 py-1 rounded-full bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[11px] font-semibold text-[#71767B] hover:text-[#E7E9EA] whitespace-nowrap transition cursor-pointer"
                  >
                    💿 Promote "{latestReleasedSong.title}"
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => applyQuickTemplate('gratitude')}
                  className="px-2.5 py-1 rounded-full bg-[#16181C] hover:bg-[#202327] border border-[#2F3336] text-[11px] font-semibold text-[#71767B] hover:text-[#E7E9EA] whitespace-nowrap transition cursor-pointer"
                >
                  ❤️ Thank Stans
                </button>
              </div>

              {/* Attached Photo Preview */}
              {composerImage && (
                <div className="relative mt-1 mb-3 rounded-2xl overflow-hidden border border-[#2F3336] max-h-56 bg-neutral-900">
                  <img
                    src={composerImage}
                    alt="Attached photo"
                    className="w-full h-auto object-cover max-h-56"
                  />
                  <button
                    type="button"
                    onClick={() => setComposerImage(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                    title="Remove photo"
                  >
                    <i className="ph ph-x text-sm"></i>
                  </button>
                </div>
              )}

              {isCompressingImage && (
                <div className="text-xs text-[#1D9BF0] flex items-center space-x-1 mb-2">
                  <i className="ph ph-spinner animate-spin"></i>
                  <span>Optimizing photo...</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#2F3336]/60">
                <div className="flex items-center space-x-3.5 text-[#1D9BF0]">
                  <button 
                    type="button" 
                    onClick={() => postImageInputRef.current?.click()} 
                    title="Attach Photo" 
                    className="hover:opacity-80 cursor-pointer"
                  >
                    <i className="ph ph-image text-lg"></i>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => avatarInputRef.current?.click()} 
                    title="Update Avatar" 
                    className="hover:opacity-80 cursor-pointer"
                  >
                    <i className="ph ph-camera text-lg"></i>
                  </button>

                  <i className="ph ph-gif text-lg opacity-60"></i>
                  <i className="ph ph-smiley text-lg opacity-60"></i>
                </div>

                <button
                  type="submit"
                  disabled={(!composerText.trim() && !composerImage) || isCompressingImage}
                  className="bg-[#1D9BF0] hover:bg-[#1A8CD8] disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-full transition active:scale-95 cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>

          {/* Feed Filter Bar */}
          <div className="flex border-b border-[#2F3336] bg-[#000000] text-xs font-semibold overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'All Music Updates' },
              { id: 'charts', label: 'Charts & Data' },
              { id: 'platforms', label: 'Media & DSPs' },
              { id: 'fanbase', label: 'Stan Twitter' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedFilter(tab.id as any)}
                className={`py-2.5 px-3.5 whitespace-nowrap transition cursor-pointer relative ${
                  feedFilter === tab.id ? 'text-white font-bold' : 'text-[#71767B] hover:text-white/80'
                }`}
              >
                <span>{tab.label}</span>
                {feedFilter === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1D9BF0] rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Feed Timeline */}
          {filteredFeedTweets.length === 0 ? (
            <div className="py-12 px-6 text-center text-[#71767B]">
              <p className="text-base font-bold text-white mb-1">No updates in this category</p>
              <p className="text-xs">Check back after releasing more music or advance the in-game date.</p>
            </div>
          ) : (
            filteredFeedTweets.map(tweet => renderTweetCard(tweet))
          )}
        </div>
      )}

      {/* --- 2. ARTIST PROFILE VIEW --- */}
      {activeView === 'profile' && (
        <div className="flex-1 flex flex-col">
          {/* Profile Header Banner */}
          <div className="h-32 sm:h-36 bg-gradient-to-r from-neutral-900 via-neutral-800 to-zinc-900 relative overflow-hidden flex items-center justify-center">
            {profile.banner ? (
              <img
                src={profile.banner}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            )}
          </div>

          {/* Profile Header Content */}
          <div className="px-4 pb-4 border-b border-[#2F3336]">
            {/* Avatar & Edit Profile Button Row */}
            <div className="flex justify-between items-end -mt-12 mb-3">
              <div className="relative group">
                <div 
                  className="w-24 h-24 rounded-full bg-neutral-900 bg-cover bg-center border-4 border-[#000000] shadow-lg overflow-hidden"
                  style={{ backgroundImage: `url(${artistAvatar})` }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                  title="Change Profile Picture"
                >
                  <i className="ph-fill ph-camera text-xl text-white"></i>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="border border-[#536471] hover:bg-white/10 text-white font-bold text-xs px-3 py-1.5 rounded-full transition cursor-pointer flex items-center space-x-1 active:scale-95"
                >
                  <i className="ph ph-camera text-sm"></i>
                  <span>Edit Pic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="border border-[#536471] hover:bg-white hover:text-black text-white font-bold text-xs px-4 py-1.5 rounded-full transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                >
                  <span>Edit profile</span>
                </button>
              </div>
            </div>

            {/* Name, Handle & Verified Badge */}
            <div className="leading-tight mb-2">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xl font-extrabold text-white">{profile.name}</h1>
                <i className="ph-fill ph-seal-check text-[#1D9BF0] text-lg"></i>
              </div>
              <p className="text-sm text-[#71767B]">{profile.handle}</p>
            </div>

            {/* Bio */}
            <p className="text-sm text-[#E7E9EA] leading-normal mb-3 whitespace-pre-wrap">
              {renderFormattedTweetText(profile.bio)}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#71767B] mb-3">
              <span className="flex items-center">
                <i className="ph ph-briefcase mr-1 text-sm"></i>
                Recording Artist
              </span>
              <span className="flex items-center">
                <i className="ph ph-map-pin mr-1 text-sm"></i>
                {artist?.country || 'United States'}
              </span>
              <span className="flex items-center">
                <i className="ph ph-calendar-blank mr-1 text-sm"></i>
                Joined {artist?.startYear || 2026}
              </span>
            </div>

            {/* Following & Followers Counts */}
            <div className="flex items-center space-x-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-white tabular-nums">{profile.following}</span>
                <span className="text-[#71767B]">Following</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-bold text-white tabular-nums">{formatNumFull(profile.followers)}</span>
                <span className="text-[#71767B]">Followers</span>
              </div>
            </div>
          </div>

          {/* Profile Navigation Sub-tabs */}
          <div className="flex border-b border-[#2F3336] text-xs sm:text-sm overflow-x-auto hide-scrollbar">
            {(['posts', 'replies', 'highlights', 'media', 'likes'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setProfileSubTab(tab)}
                className={`flex-1 py-3 px-3 font-bold text-center capitalize transition relative whitespace-nowrap cursor-pointer ${
                  profileSubTab === tab ? 'text-white' : 'text-[#71767B] hover:text-white/80'
                }`}
              >
                <span>{tab}</span>
                {profileSubTab === tab && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#1D9BF0] rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Profile Posts List */}
          <div className="divide-y divide-[#2F3336]">
            {filteredProfilePosts.length === 0 ? (
              <div className="py-12 px-6 text-center text-[#71767B]">
                <p className="text-base font-bold text-white mb-1">No {profileSubTab} yet</p>
                <p className="text-xs">When you post photos or updates, they'll show up here.</p>
              </div>
            ) : (
              filteredProfilePosts.map(tweet => renderTweetCard(tweet))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

