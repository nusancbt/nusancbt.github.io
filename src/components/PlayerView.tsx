import React, { useEffect, useMemo, useState } from 'react';
import { MenuItem } from '../types';
import {
  getYoutubeEmbedUrl,
  getYoutubeThumbnail,
  isValidUrl,
} from '../utils/helpers';

interface PlayerViewProps {
  menuItem: MenuItem;
  onBackHome: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ menuItem, onBackHome }) => {
  const playlistUrls = useMemo(() => {
    const raw = menuItem.url || '';
    return raw
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u !== '');
  }, [menuItem.url]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'none' | 'invalid' | 'load_error'>('none');
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveIndex(0);
    setFailedThumbs({});
    setIsPlaylistOpen(playlistUrls.length > 1);
  }, [menuItem.id, playlistUrls.length]);

  const rawActiveUrl = playlistUrls[activeIndex] || '';
  const valid = isValidUrl(rawActiveUrl);

  const embedUrl = useMemo(() => {
    if (!valid) return '';
    if (
      rawActiveUrl.includes('youtube.com') ||
      rawActiveUrl.includes('youtu.be')
    ) {
      return getYoutubeEmbedUrl(rawActiveUrl);
    }
    return rawActiveUrl;
  }, [rawActiveUrl, valid]);

  useEffect(() => {
    if (!valid) {
      setErrorState('invalid');
      setIsLoading(false);
    } else {
      setErrorState('none');
      setIsLoading(true);
    }
  }, [embedUrl, valid]);

  const handleSelectPlaylist = (idx: number) => {
    setActiveIndex(idx);
    if (window.innerWidth < 768) {
      setIsPlaylistOpen(false);
    }
  };

  const hasPlaylist = playlistUrls.length > 1;

  return (
    <div className="w-full h-full bg-white flex flex-col md:flex-row relative">
      <div className="relative flex-1 bg-slate-950 h-[50vh] md:h-full transition-all duration-200">
        {isLoading && errorState === 'none' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="loader-spinner" />
          </div>
        )}

        {errorState === 'none' && embedUrl && (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={menuItem.title}
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setErrorState('load_error');
            }}
            className="w-full h-full border-0"
          />
        )}

        {hasPlaylist && (
          <button
            onClick={() => setIsPlaylistOpen((prev) => !prev)}
            className="absolute top-4 right-4 z-20 bg-slate-900/80 hover:bg-blue-600 text-white px-3 py-2 rounded-lg border border-white/20 backdrop-blur-sm transition-colors text-xs flex items-center gap-2"
          >
            <i
              className={`fa-solid ${isPlaylistOpen ? 'fa-list' : 'fa-expand'}`}
            ></i>
            <span className="font-medium">Daftar Materi</span>
          </button>
        )}

        {errorState !== 'none' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center z-10">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-5 animate-fade-in">
              <i
                className={`fa-solid ${
                  errorState === 'invalid'
                    ? 'fa-link-slash text-rose-500'
                    : 'fa-face-frown text-slate-400'
                } text-3xl`}
              ></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {errorState === 'invalid'
                ? 'URL Tidak Valid (404)'
                : 'Tidak Dapat Memuat Halaman'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md">
              {errorState === 'invalid'
                ? 'Tautan yang dituju kosong atau salah format. Pastikan dimulai dengan https://'
                : 'Situs tujuan menolak ditampilkan di dalam portal atau sedang tidak dapat diakses.'}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={onBackHome}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>Kembali ke Dashboard
              </button>
              {valid && (
                <a
                  href={rawActiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <i className="fa-solid fa-up-right-from-square mr-2"></i>Buka di Tab Baru
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {hasPlaylist && isPlaylistOpen && (
        <div className="w-full md:w-80 h-[50vh] md:h-full bg-white border-l border-slate-200 flex flex-col z-10">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-list-ul text-blue-600"></i>
              <span>Daftar Materi</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
                {activeIndex + 1}/{playlistUrls.length}
              </span>
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="text-slate-400 hover:text-rose-500 md:hidden p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto playlist-scroll bg-white divide-y divide-slate-100">
            {playlistUrls.map((url, idx) => {
              const thumbnail = getYoutubeThumbnail(url);
              const showThumb = Boolean(thumbnail) && !failedThumbs[idx];
              const isCurrent = idx === activeIndex;

              return (
                <button
                  type="button"
                  key={`${url}-${idx}`}
                  onClick={() => handleSelectPlaylist(idx)}
                  className={`w-full text-left p-3 flex gap-3 items-center transition-colors ${
                    isCurrent ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative w-24 h-14 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {showThumb ? (
                      <img
                        src={thumbnail}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedThumbs((prev) => ({ ...prev, [idx]: true }))
                        }
                        alt={`Materi Bagian ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fa-solid fa-circle-play text-slate-400 text-lg"></i>
                    )}
                    <div
                      className={`absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity ${
                        isCurrent ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                      }`}
                    >
                      <i className="fa-solid fa-play text-white text-xs"></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isCurrent ? 'text-blue-700 font-semibold' : 'text-slate-800 font-medium'
                      }`}
                    >
                      Materi Bagian {idx + 1}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {thumbnail ? 'Video Pembelajaran' : 'Sumber Eksternal'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
