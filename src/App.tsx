import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Announcement,
  AppSettings,
  LMSFile,
  MenuItem,
  PortalBackupData,
  SchoolClass,
  StudentTask,
} from './types';
import {
  addExternalLMSLinkApi,
  deleteLMSFileApi,
  exportPortalBackup,
  fetchFromDatabaseApi,
  fetchLMSLibraryApi,
  fetchVisitorCountApi,
  importPortalBackupLocal,
  renameClassApi,
  reorderMenusApi,
  sendDatabaseActionApi,
  updateLMSFileDetailsApi,
  uploadLMSFileApi,
} from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CalculatorModal } from './components/CalculatorModal';
import {
  EditLmsFileModal,
  ExamTokenModal,
  PasswordModal,
  PdfViewerModal,
} from './components/Modals';
import { HomeView } from './components/HomeView';
import { PlayerView } from './components/PlayerView';
import { LmsStudentView } from './components/LmsStudentView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';

const TASKS_STORAGE_KEY = 'student_tasks';
const ADMIN_UNLOCK_KEY = 'nusancbt_admin_unlocked_until';

function loadInitialTasks(): StudentTask[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) || [];
  } catch {
    // ignore
  }
  return [];
}

export const App: React.FC = () => {
  const [appLoading, setAppLoading] = useState(true);
  const [activeView, setActiveView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Database state
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    app_name: 'NusanCBT',
    app_subtitle: 'Dashboard Siswa',
    lms_feature_status: 'active',
    marquee_enabled: true,
    calculator_enabled: true,
    tasks_enabled: true,
    admin_session_minutes: 15,
  });

  // LMS Drive Library state
  const [lmsFiles, setLmsFiles] = useState<LMSFile[]>([]);
  const [lmsLoading, setLmsLoading] = useState(false);

  // Visitor Counter
  const [visitorCount, setVisitorCount] = useState<string | null>(null);

  // Student Tasks (localStorage)
  const [tasks, setTasks] = useState<StudentTask[]>(loadInitialTasks);

  // Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingTokenMenu, setPendingTokenMenu] = useState<MenuItem | null>(null);
  const [unlockedMenuIds, setUnlockedMenuIds] = useState<Set<string>>(new Set());
  const [editLmsTarget, setEditLmsTarget] = useState<LMSFile | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Re-evaluate menu schedules periodically
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClockTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Persist tasks
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // Close calculator if disabled in settings
  useEffect(() => {
    if (appSettings.calculator_enabled === false) {
      setCalculatorOpen(false);
    }
  }, [appSettings.calculator_enabled]);

  // Update document title when app_name changes
  useEffect(() => {
    if (appSettings.app_name) {
      document.title = appSettings.app_name;
    }
  }, [appSettings.app_name]);

  const fetchDatabase = useCallback(async (isBackground = false) => {
    const state = await fetchFromDatabaseApi();
    setMenus(state.menus);
    setAnnouncements(state.announcements);
    setClasses(state.classes);
    setAppSettings((prev) => ({ ...prev, ...state.settings }));
    if (!isBackground) {
      setAppLoading(false);
    }
  }, []);

  const fetchLmsLibrary = useCallback(async () => {
    setLmsLoading(true);
    const files = await fetchLMSLibraryApi();
    setLmsFiles(files);
    setLmsLoading(false);
  }, []);

  useEffect(() => {
    fetchVisitorCountApi().then(setVisitorCount);
    fetchDatabase(false);
    fetchLmsLibrary();

    const syncInterval = setInterval(() => {
      fetchDatabase(true);
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [fetchDatabase, fetchLmsLibrary]);

  const isAdminSessionActive = (): boolean => {
    const sessionMins =
      typeof appSettings.admin_session_minutes === 'number'
        ? appSettings.admin_session_minutes
        : 15;
    if (sessionMins <= 0) return false;
    const until = Number(sessionStorage.getItem(ADMIN_UNLOCK_KEY) || 0);
    return Date.now() < until;
  };

  const recordAdminUnlock = () => {
    const sessionMins =
      typeof appSettings.admin_session_minutes === 'number'
        ? appSettings.admin_session_minutes
        : 15;
    if (sessionMins > 0) {
      sessionStorage.setItem(
        ADMIN_UNLOCK_KEY,
        String(Date.now() + sessionMins * 60 * 1000)
      );
    } else {
      sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    setActiveView('home');
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Sesi admin telah dikunci',
      showConfirmButton: false,
      timer: 1800,
    });
  };

  const handleSwitchView = (viewId: string) => {
    if (viewId === 'settings') {
      if (isAdminSessionActive()) {
        setActiveView('settings');
        setSidebarOpen(false);
      } else {
        setPasswordModalOpen(true);
      }
      return;
    }
    setActiveView(viewId);
    setSidebarOpen(false);
  };

  const openAuthorizedMenu = (menu: MenuItem) => {
    setSidebarOpen(false);
    if (menu.open_external) {
      const firstUrl = (menu.url || '').split(',')[0]?.trim();
      if (firstUrl) {
        const a = document.createElement('a');
        a.href = firstUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }
    setActiveView(menu.id);
  };

  const handleSelectMenu = (menu: MenuItem) => {
    if (menu.exam_token && !unlockedMenuIds.has(menu.id)) {
      setPendingTokenMenu(menu);
      return;
    }
    openAuthorizedMenu(menu);
  };

  const validAdminPassword = appSettings.admin_password
    ? String(appSettings.admin_password)
    : '112233';

  // --- Database CRUD Wrappers ---
  const executeDbAction = async (
    action: string,
    payload: Record<string, unknown>
  ): Promise<boolean> => {
    Swal.fire({
      title: 'Memproses...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const updated = await sendDatabaseActionApi(action, payload);
      setMenus(updated.menus);
      setAnnouncements(updated.announcements);
      setClasses(updated.classes);
      setAppSettings((prev) => ({ ...prev, ...updated.settings }));
      Swal.fire('Berhasil', 'Data berhasil disimpan!', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan';
      Swal.fire('Error', `Gagal: ${message}`, 'error');
      return false;
    }
  };

  const handleReorderMenus = async (ordered: MenuItem[]) => {
    const updated = await reorderMenusApi(ordered);
    setMenus(updated.menus);
  };

  const handleRenameClass = async (
    id: string,
    oldName: string,
    newName: string
  ): Promise<boolean> => {
    Swal.fire({
      title: 'Memperbarui Kelas...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const updated = await renameClassApi(id, oldName, newName);
      setClasses(updated.classes);
      await fetchLmsLibrary();
      Swal.fire('Berhasil', 'Nama kelas berhasil diperbarui.', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah kelas';
      Swal.fire('Error', message, 'error');
      return false;
    }
  };

  const handleUploadLms = async (params: {
    fileData: string;
    fileName: string;
    mimeType: string;
    kelas: string;
    subject?: string;
    sizeKb?: number;
  }): Promise<boolean> => {
    Swal.fire({
      title: 'Mengunggah Materi...',
      text: 'Mohon tunggu sebentar...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await uploadLMSFileApi(params);
      Swal.fire('Sukses', 'Materi PDF berhasil ditambahkan!', 'success');
      await fetchLmsLibrary();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal upload';
      Swal.fire('Gagal', `Terjadi kesalahan saat upload: ${message}`, 'error');
      return false;
    }
  };

  const handleAddLmsLink = async (params: {
    title: string;
    url: string;
    kelas: string;
    subject?: string;
  }): Promise<boolean> => {
    try {
      const updatedFiles = await addExternalLMSLinkApi(params);
      setLmsFiles(updatedFiles);
      Swal.fire('Sukses', 'Tautan materi pustaka berhasil disimpan!', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan tautan';
      Swal.fire('Gagal', message, 'error');
      return false;
    }
  };

  const handleConfirmEditLms = async (params: {
    id: string;
    newName: string;
    kelas: string;
    subject?: string;
  }) => {
    setEditLmsTarget(null);
    Swal.fire({
      title: 'Menyimpan Perubahan...',
      didOpen: () => Swal.showLoading(),
    });
    try {
      await updateLMSFileDetailsApi(params);
      Swal.fire('Sukses', 'Detail materi berhasil diperbarui.', 'success');
      await fetchLmsLibrary();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Swal.fire('Error', `Gagal memperbarui materi: ${message}`, 'error');
    }
  };

  const handleDeleteLms = (id: string) => {
    Swal.fire({
      title: 'Hapus materi ini?',
      text: 'Materi akan dihapus dari daftar E-Library.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Menghapus...',
          didOpen: () => Swal.showLoading(),
        });
        try {
          await deleteLMSFileApi(id);
          Swal.fire('Terhapus', 'Materi berhasil dihapus.', 'success');
          await fetchLmsLibrary();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal menghapus';
          Swal.fire('Gagal', `Tidak dapat menghapus materi: ${message}`, 'error');
        }
      }
    });
  };

  // --- Backup & Restore ---
  const handleExportBackup = () => {
    const backup = exportPortalBackup(
      { menus, announcements, classes, settings: appSettings },
      lmsFiles
    );
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nusancbt-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (backup: PortalBackupData) => {
    const { dbState, lmsFiles: restoredLms } = importPortalBackupLocal(backup);
    setMenus(dbState.menus);
    setAnnouncements(dbState.announcements);
    setClasses(dbState.classes);
    setAppSettings(dbState.settings);
    setLmsFiles(restoredLms);

    // Best-effort sync settings to remote if reachable
    try {
      await sendDatabaseActionApi('saveSettings', { data: dbState.settings });
    } catch {
      // local cache already updated
    }

    Swal.fire(
      'Pemulihan Berhasil',
      'Konfigurasi portal berhasil dipulihkan dari file cadangan.',
      'success'
    );
  };

  // --- Tasks Handlers ---
  const handleAddTask = (subject: string, title: string, date: string) => {
    setTasks((prev) => [
      {
        id: Date.now(),
        subject,
        title,
        date,
        completed: false,
      },
      ...prev,
    ]);
  };

  const handleToggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompletedTasks = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  // --- Page Title & Active Menu ---
  const selectedMenuItem = useMemo(
    () => menus.find((m) => m.id === activeView),
    [menus, activeView]
  );

  const pageTitle = useMemo(() => {
    if (activeView === 'home') return 'Dashboard Utama';
    if (activeView === 'settings') return 'Pengaturan Admin';
    if (activeView === 'lms') return 'E-Library / LMS';
    if (activeView === 'tasks') return 'Agenda & Tugas';
    if (selectedMenuItem) {
      if (selectedMenuItem.title.includes(':')) {
        return selectedMenuItem.title.split(':').slice(1).join(':').trim();
      }
      return selectedMenuItem.title;
    }
    return 'Dashboard Utama';
  }, [activeView, selectedMenuItem]);

  return (
    <div className="bg-slate-100 h-screen overflow-hidden flex text-slate-800 w-full">
      {/* Initial Loading Screen */}
      {appLoading && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600 mb-4" />
          <p className="text-slate-600 font-medium text-sm">Memuat Portal...</p>
        </div>
      )}

      {/* Floating Calculator */}
      {appSettings.calculator_enabled !== false && (
        <CalculatorModal
          isOpen={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
        />
      )}

      {/* Modals */}
      <PasswordModal
        isOpen={passwordModalOpen}
        validPassword={validAdminPassword}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          recordAdminUnlock();
          setPasswordModalOpen(false);
          setActiveView('settings');
          setSidebarOpen(false);
        }}
      />

      <ExamTokenModal
        menuItem={pendingTokenMenu}
        onClose={() => setPendingTokenMenu(null)}
        onSuccess={(menu) => {
          setUnlockedMenuIds((prev) => new Set(prev).add(menu.id));
          setPendingTokenMenu(null);
          openAuthorizedMenu(menu);
        }}
      />

      <EditLmsFileModal
        file={editLmsTarget}
        classes={classes}
        onConfirm={handleConfirmEditLms}
        onClose={() => setEditLmsTarget(null)}
      />

      <PdfViewerModal
        previewFile={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        isOpen={sidebarOpen}
        menus={menus}
        appSettings={appSettings}
        visitorCount={visitorCount}
        onSwitchView={handleSwitchView}
        onSelectMenu={handleSelectMenu}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative w-full min-w-0">
        <Header
          pageTitle={pageTitle}
          runningText={appSettings.running_text}
          marqueeEnabled={appSettings.marquee_enabled !== false}
          calculatorEnabled={appSettings.calculator_enabled !== false}
          isAdminView={activeView === 'settings'}
          onLockAdmin={handleLockAdmin}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onToggleCalculator={() => setCalculatorOpen((prev) => !prev)}
        />

        <div className="flex-1 p-0 overflow-hidden relative bg-slate-50">
          {activeView === 'home' && (
            <HomeView
              menus={menus}
              announcements={announcements}
              appSettings={appSettings}
              onSwitchView={handleSwitchView}
              onSelectMenu={handleSelectMenu}
            />
          )}

          {activeView === 'lms' && (
            <LmsStudentView
              files={lmsFiles}
              classes={classes}
              isLoading={lmsLoading}
              onOpenPreview={(url, title) => setPreviewFile({ url, title })}
            />
          )}

          {activeView === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onClearCompleted={handleClearCompletedTasks}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              menus={menus}
              announcements={announcements}
              classes={classes}
              appSettings={appSettings}
              lmsFiles={lmsFiles}
              onRefreshDatabase={() => fetchDatabase(false)}
              onRefreshLms={fetchLmsLibrary}
              onSaveMenu={(data) => executeDbAction('saveMenu', { data })}
              onDeleteMenu={(id) => executeDbAction('deleteMenu', { id })}
              onReorderMenus={handleReorderMenus}
              onSaveAnnouncement={(data) =>
                executeDbAction('saveAnnouncement', { data })
              }
              onDeleteAnnouncement={(id) =>
                executeDbAction('deleteAnnouncement', { id })
              }
              onSaveClass={(data) => executeDbAction('saveClass', { data })}
              onRenameClass={handleRenameClass}
              onDeleteClass={(id) => executeDbAction('deleteClass', { id })}
              onSaveSettings={(data) => executeDbAction('saveSettings', { data })}
              onUploadLmsFile={handleUploadLms}
              onAddLmsLink={handleAddLmsLink}
              onOpenEditLmsFile={(file) => setEditLmsTarget(file)}
              onDeleteLmsFile={handleDeleteLms}
              onOpenPreview={(url, title) => setPreviewFile({ url, title })}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onLockAdmin={handleLockAdmin}
            />
          )}

          {selectedMenuItem &&
            !['home', 'lms', 'tasks', 'settings'].includes(activeView) && (
              <PlayerView
                menuItem={selectedMenuItem}
                onBackHome={() => setActiveView('home')}
              />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
