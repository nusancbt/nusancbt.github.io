import React, { useEffect, useState } from 'react';

interface HeaderProps {
  pageTitle: string;
  runningText?: string;
  marqueeEnabled?: boolean;
  calculatorEnabled?: boolean;
  isAdminView?: boolean;
  onLockAdmin?: () => void;
  onToggleSidebar: () => void;
  onToggleCalculator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  runningText,
  marqueeEnabled = true,
  calculatorEnabled = true,
  isAdminView = false,
  onLockAdmin,
  onToggleSidebar,
  onToggleCalculator,
}) => {
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour12: false }));
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-4 px-4 lg:px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
          <h2 className="text-base md:text-lg font-bold text-slate-900 truncate">
            {pageTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isAdminView && onLockAdmin && (
            <button
              onClick={onLockAdmin}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors whitespace-nowrap"
              title="Kunci sesi admin dan kembali ke Dashboard"
            >
              <i className="fa-solid fa-lock"></i>
              <span className="hidden sm:inline">Kunci Admin</span>
            </button>
          )}

          {calculatorEnabled && (
            <button
              onClick={onToggleCalculator}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <i className="fa-solid fa-calculator"></i> Hitung
            </button>
          )}

          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-sm font-mono tabular-nums font-bold text-blue-600">
              {timeStr}
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{dateStr}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Layar Penuh"
          >
            <i
              className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}
            ></i>
          </button>
        </div>
      </header>

      {marqueeEnabled && runningText && runningText.trim() !== '' && (
        <div className="bg-blue-600 text-white text-xs md:text-sm py-1.5 overflow-hidden whitespace-nowrap flex-shrink-0">
          <div className="inline-block animate-marquee pl-[100%]">{runningText}</div>
        </div>
      )}
    </>
  );
};
