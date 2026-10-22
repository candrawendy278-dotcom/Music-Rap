import React, { useState, useRef } from 'react';
import { compressImageFile } from '../../utils/imageOptimizer';
import { XProfile } from '../../data/xSocialEngine';

interface XEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Required<XProfile>;
  currentAvatar: string;
  onSave: (updated: {
    name: string;
    handle: string;
    bio: string;
    banner: string;
    avatar?: string;
  }) => void;
}

export default function XEditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  currentAvatar,
  onSave
}: XEditProfileModalProps) {
  const [name, setName] = useState(currentProfile.name);
  const [handle, setHandle] = useState(currentProfile.handle.replace(/^@/, ''));
  const [bio, setBio] = useState(currentProfile.bio);
  const [bannerPreview, setBannerPreview] = useState(currentProfile.banner);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar);
  const [isProcessing, setIsProcessing] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const compressed = await compressImageFile(file, 640, 0.82);
      if (compressed) {
        setBannerPreview(compressed);
      }
      setIsProcessing(false);
    }
    if (e.target) e.target.value = '';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const compressed = await compressImageFile(file, 384, 0.82);
      if (compressed) {
        setAvatarPreview(compressed);
      }
      setIsProcessing(false);
    }
    if (e.target) e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = `@${handle.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '') || 'artist'}`;
    onSave({
      name: name.trim() || currentProfile.name,
      handle: cleanHandle,
      bio: bio.trim(),
      banner: bannerPreview || '',
      avatar: avatarPreview !== currentAvatar ? avatarPreview : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleBannerUpload}
      />
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <div className="w-full max-w-md bg-[#000000] border border-[#2F3336] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2F3336] bg-black/90">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            >
              <i className="ph ph-x text-xl"></i>
            </button>
            <h2 className="text-lg font-bold text-white">Edit profile</h2>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSubmit}
            className="bg-white hover:bg-neutral-200 text-black font-bold text-sm px-4 py-1.5 rounded-full transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 divide-y divide-[#2F3336] hide-scrollbar">
          {/* Banner Photo Section */}
          <div className="relative h-32 sm:h-36 bg-gradient-to-r from-neutral-900 via-neutral-800 to-zinc-900 flex items-center justify-center overflow-hidden">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            )}
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-md cursor-pointer"
                title="Change Banner Photo"
              >
                <i className="ph-fill ph-camera text-lg"></i>
              </button>
              {bannerPreview && (
                <button
                  type="button"
                  onClick={() => setBannerPreview('')}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-md cursor-pointer"
                  title="Remove Banner Photo"
                >
                  <i className="ph ph-trash text-lg text-red-400"></i>
                </button>
              )}
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="px-4 pb-4">
            <div className="relative -mt-12 w-24 h-24 mb-4">
              <div
                className="w-24 h-24 rounded-full bg-neutral-900 bg-cover bg-center border-4 border-black shadow-lg overflow-hidden"
                style={{ backgroundImage: `url(${avatarPreview})` }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition border-4 border-black cursor-pointer"
                title="Change Profile Picture"
              >
                <i className="ph-fill ph-camera text-xl"></i>
              </button>
            </div>

            {/* Input: Display Name */}
            <div className="space-y-4">
              <div className="border border-[#333639] focus-within:border-[#1D9BF0] rounded-lg px-3 py-2 bg-black transition">
                <div className="flex justify-between text-xs text-[#71767B]">
                  <span>Name</span>
                  <span>{name.length} / 50</span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-white text-sm sm:text-base outline-none pt-1 font-medium"
                  placeholder="Your artist name"
                />
              </div>

              {/* Input: Username / Handle */}
              <div className="border border-[#333639] focus-within:border-[#1D9BF0] rounded-lg px-3 py-2 bg-black transition">
                <div className="flex justify-between text-xs text-[#71767B]">
                  <span>Username</span>
                  <span>{handle.length} / 20</span>
                </div>
                <div className="flex items-center text-white text-sm sm:text-base pt-1">
                  <span className="text-[#71767B] mr-0.5 select-none font-medium">@</span>
                  <input
                    type="text"
                    maxLength={20}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-transparent text-white outline-none font-medium"
                    placeholder="handle"
                  />
                </div>
              </div>

              {/* Input: Bio */}
              <div className="border border-[#333639] focus-within:border-[#1D9BF0] rounded-lg px-3 py-2 bg-black transition">
                <div className="flex justify-between text-xs text-[#71767B]">
                  <span>Bio</span>
                  <span>{bio.length} / 160</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-none pt-1 resize-none"
                  placeholder="Tell the world about yourself..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
