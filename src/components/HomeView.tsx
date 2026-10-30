import React from 'react';
import { Announcement, AppSettings, MenuItem } from '../types';
import {
  GRADIENTS,
  TEXT_COLORS,
  getMenuTimeStatus,
  isAnnouncementExpired,
  sortAnnouncements,
  sortMenus,
  timeAgo,
} from '../utils/helpers';

interface HomeViewProps {
  menus: MenuItem[];
  announcements: Announcement[];
  appSettings: AppSettings;
  onSwitchView: (viewId: string) => void;
  onSelectMenu: (menu: MenuItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  menus,
  announcements,
  appSettings,
  onSwitchView,
  onSelectMenu,
}) => {
  const showLms = appSettings.lms_feature_status !== 'inactive';
  const showTasks = appSettings.tasks_enabled !== false;

  let timeRestrictedCount = 0;
  const activeMenus = sortMenus(menus).filter((menu) => {
    const statusObj = getMenuTimeStatus(menu);
    if (!statusObj.isActive) {
      if (statusObj.code === 'not_open_yet' || statusObj.code === 'closed') {
        timeRestrictedCount += 1;
      }
      return false;
    }
    return true;
  });

  const visibleAnnouncements = sortAnnouncements(
    announcements.filter((item) => !isAnnouncementExpired(item))
  );

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 animate-fade-in custom-scrollbar">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-sm">
        <div className="max-w-2xl">
          {appSettings.school_name && (
            <p className="text-blue-200 text-xs font-medium mb-1">
              {appSettings.school_name}
              {appSettings.academic_year ? ` · ${appSettings.academic_year}` : ''}
            </p>
          )}
          <h2 className="text-2xl font-bold mb-1.5 tracking-tight">
            {appSettings.welcome_title?.trim() || 'Selamat Datang di Portal Belajar'}
          </h2>
          <p className="text-blue-100 text-sm mb-5 leading-relaxed">
            {appSettings.welcome_message?.trim() ||
              'Akses materi, kerjakan ujian dan tugas, serta pantau jadwal pelajaranmu hari ini.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {showTasks && (
              <button
                onClick={() => onSwitchView('tasks')}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                <i className="fa-solid fa-list-check mr-2"></i>Cek Tugas
              </button>
            )}
            {showLms && (
              <button
                onClick={() => onSwitchView('lms')}
                className="px-4 py-2 bg-blue-800/50 text-white border border-white/20 rounded-lg text-sm font-semibold hover:bg-blue-800/70 transition-colors whitespace-nowrap"
              >
                <i className="fa-solid fa-book-open mr-2"></i>Buka Pustaka
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curfew / Schedule Banner */}
      {timeRestrictedCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <div className="text-amber-600 mt-0.5 shrink-0">
            <i className="fa-solid fa-clock text-lg"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Jadwal Akses Terbatas
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Terdapat <span className="font-mono tabular-nums font-semibold">{timeRestrictedCount}</span> menu yang belum dibuka atau jam aksesnya telah berakhir.
            </p>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
        {showLms && (
          <div
            onClick={() => onSwitchView('lms')}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white cursor-pointer transform hover:-translate-y-0.5 transition-transform flex flex-col h-full border border-indigo-500/40"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="bg-white/15 w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
                <i className="fa-solid fa-book-open text-xl"></i>
              </div>
              <span className="text-xs text-indigo-100 font-medium">Perpustakaan</span>
            </div>
            <div className="mt-auto">
              <p className="text-indigo-200 text-xs font-medium mb-1">E-Library</p>
              <h3 className="text-lg font-bold leading-snug line-clamp-2">
                Akses Materi & E-Book
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center text-xs text-indigo-100 font-medium">
              <span>
                <i className="fa-solid fa-arrow-right mr-1.5"></i>Buka Pustaka
              </span>
            </div>
          </div>
        )}

        {activeMenus.map((menu) => {
          const gradient = GRADIENTS[menu.color] || GRADIENTS.blue;
          const textColor = TEXT_COLORS[menu.color] || TEXT_COLORS.blue;

          let displayTitle = menu.title;
          let displayCategory = menu.category?.trim() || 'Menu Utama';

          if (menu.title.includes(':')) {
            const parts = menu.title.split(':');
            if (parts.length >= 2) {
              if (!menu.category) displayCategory = parts[0].trim();
              displayTitle = parts.slice(1).join(':').trim();
            }
          }

          return (
            <div
              key={menu.id}
              onClick={() => onSelectMenu(menu)}
              className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white cursor-pointer transform hover:-translate-y-0.5 transition-transform flex flex-col h-full`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="bg-white/15 w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${menu.icon} text-xl`}></i>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/85 font-medium">
                  {menu.exam_token && (
                    <i className="fa-solid fa-key text-[11px]" title="Memerlukan Token"></i>
                  )}
                  {menu.open_external && (
                    <i
                      className="fa-solid fa-up-right-from-square text-[11px]"
                      title="Buka di Tab Baru"
                    ></i>
                  )}
                </div>
              </div>

              <div className="mt-auto">
                <p className={`${textColor} text-xs font-medium mb-1 truncate`}>
                  {displayCategory}
                  {menu.teacher ? ` · ${menu.teacher}` : ''}
                </p>
                <h3 className="text-lg font-bold leading-snug line-clamp-2">
                  {displayTitle}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/90 font-medium">
                <span>
                  <i className="fa-solid fa-arrow-right mr-1.5"></i>
                  {menu.open_external ? 'Buka Tautan' : 'Buka Materi'}
                </span>
                {(menu.auto_open || menu.auto_close) && (
                  <span className="font-mono tabular-nums text-[11px] text-white/75">
                    {menu.auto_open || '00:00'}–{menu.auto_close || '23:59'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Pengumuman Sekolah</h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {visibleAnnouncements.length} Pengumuman
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {visibleAnnouncements.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              Belum ada pengumuman aktif saat ini.
            </div>
          ) : (
            visibleAnnouncements.map((item) => {
              let colorClass = 'bg-blue-50 text-blue-600';
              let icon = 'fa-bullhorn';
              let typeLabel = 'Info';
              if (item.type === 'warning') {
                colorClass = 'bg-amber-50 text-amber-600';
                icon = 'fa-triangle-exclamation';
                typeLabel = 'Peringatan';
              } else if (item.type === 'urgent') {
                colorClass = 'bg-rose-50 text-rose-600';
                icon = 'fa-circle-exclamation';
                typeLabel = 'Penting';
              }

              return (
                <div
                  key={item.id}
                  className="flex gap-4 items-start py-4 first:pt-1 last:pb-1"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0 mt-0.5`}
                  >
                    <i className={`fa-solid ${icon} text-sm`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1">
                      {item.pinned && (
                        <>
                          <span className="font-semibold text-blue-600">
                            <i className="fa-solid fa-thumbtack mr-1"></i>Disematkan
                          </span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className="font-medium text-slate-700">{typeLabel}</span>
                      {item.target_class && item.target_class !== 'Semua' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Kelas {item.target_class}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{timeAgo(item.time)}</span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-sm md:text-base">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>

                    {item.link_url && (
                      <div className="mt-2.5">
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <i className="fa-solid fa-paperclip"></i>
                          {item.link_label?.trim() || 'Buka Lampiran / Tautan'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
