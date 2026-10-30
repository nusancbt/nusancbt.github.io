import React, { useState } from 'react';
import { AppSettings, MenuItem } from '../types';
import { getMenuTimeStatus, sortMenus } from '../utils/helpers';

interface SidebarProps {
  activeView: string;
  isOpen: boolean;
  menus: MenuItem[];
  appSettings: AppSettings;
  visitorCount: string | null;
  onSwitchView: (viewId: string) => void;
  onSelectMenu: (menu: MenuItem) => void;
  onCloseMobile: () => void;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  isOpen,
  menus,
  appSettings,
  visitorCount,
  onSwitchView,
  onSelectMenu,
  onCloseMobile,
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const activeMenus = sortMenus(menus).filter(
    (menu) => getMenuTimeStatus(menu).isActive
  );
  const showLms = appSettings.lms_feature_status !== 'inactive';
  const showTasks = appSettings.tasks_enabled !== false;

  const avatarSrc =
    !avatarFailed && appSettings.avatar_url?.trim()
      ? appSettings.avatar_url.trim()
      : DEFAULT_AVATAR;

  const navBtnClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
      isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
    }`;

  const navIconClass = (isActive: boolean) =>
    `w-5 text-center transition-colors shrink-0 ${
      isActive ? 'text-white' : 'text-slate-400'
    }`;

  return (
    <>
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
        />
      )}

      <aside
        className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 sidebar-transition flex flex-col h-full border-r border-slate-800`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
              <i className="fa-solid fa-graduation-cap text-base"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white tracking-tight truncate">
                {appSettings.app_name || 'NusanCBT'}
              </h1>
              {appSettings.school_name && (
                <p className="text-[11px] text-slate-400 truncate">
                  {appSettings.school_name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              onError={() => setAvatarFailed(true)}
              referrerPolicy="no-referrer"
              alt="Profil Siswa"
              className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Siswa Peserta
              </p>
              <p className="text-xs text-slate-400 truncate">
                {appSettings.app_subtitle || 'Dashboard Siswa'}
                {appSettings.academic_year ? ` · ${appSettings.academic_year}` : ''}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 tracking-wide mb-2 mt-1 px-3">
            Menu Utama
          </div>

          <button
            onClick={() => onSwitchView('home')}
            className={navBtnClass(activeView === 'home')}
          >
            <i className={`fa-solid fa-house ${navIconClass(activeView === 'home')}`}></i>
            <span className="text-sm font-medium truncate">Dashboard</span>
          </button>

          {activeMenus.map((menu) => {
            const isActive = activeView === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => onSelectMenu(menu)}
                className={navBtnClass(isActive)}
              >
                <i className={`fa-solid ${menu.icon} ${navIconClass(isActive)}`}></i>
                <span className="text-sm font-medium text-left truncate flex-1">
                  {menu.title}
                </span>
                {menu.exam_token && (
                  <i
                    className={`fa-solid fa-lock text-[10px] ${
                      isActive ? 'text-blue-200' : 'text-slate-500'
                    }`}
                    title="Memerlukan Token"
                  ></i>
                )}
              </button>
            );
          })}

          {showLms && (
            <button
              onClick={() => onSwitchView('lms')}
              className={navBtnClass(activeView === 'lms')}
            >
              <i
                className={`fa-solid fa-book-open ${navIconClass(activeView === 'lms')}`}
              ></i>
              <span className="text-sm font-medium truncate">E-Library (LMS)</span>
            </button>
          )}

          {showTasks && (
            <button
              onClick={() => onSwitchView('tasks')}
              className={navBtnClass(activeView === 'tasks')}
            >
              <i
                className={`fa-solid fa-list-check ${navIconClass(activeView === 'tasks')}`}
              ></i>
              <span className="text-sm font-medium truncate">Agenda & Tugas</span>
            </button>
          )}

          <div className="text-[11px] font-semibold text-slate-500 tracking-wide mb-2 mt-6 px-3">
            Administrasi
          </div>
          <button
            onClick={() => onSwitchView('settings')}
            className={navBtnClass(activeView === 'settings')}
          >
            <i
              className={`fa-solid fa-gear ${navIconClass(activeView === 'settings')}`}
            ></i>
            <span className="text-sm font-medium truncate">Pengaturan Admin</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2" title="Total Pengunjung Dashboard">
              <i className="fa-solid fa-users text-blue-400"></i> Pengunjung
            </span>
            <span className="font-mono tabular-nums font-semibold text-blue-400">
              {visitorCount === null ? (
                <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i>
              ) : (
                visitorCount
              )}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
