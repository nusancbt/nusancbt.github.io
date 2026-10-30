import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Announcement,
  AnnouncementType,
  AppSettings,
  LMSFile,
  MenuItem,
  PortalBackupData,
  SchoolClass,
  SettingsTab,
} from '../types';
import {
  ICON_BADGE_COLORS,
  MENU_ICON_OPTIONS,
  formatFileSize,
  getMenuTimeStatus,
  isAnnouncementExpired,
  isValidUrl,
  sortAnnouncements,
  sortMenus,
  timeAgo,
} from '../utils/helpers';

interface SettingsViewProps {
  menus: MenuItem[];
  announcements: Announcement[];
  classes: SchoolClass[];
  appSettings: AppSettings;
  lmsFiles: LMSFile[];
  onRefreshDatabase: () => void;
  onRefreshLms: () => void;
  onSaveMenu: (menu: MenuItem) => Promise<boolean>;
  onDeleteMenu: (id: string) => Promise<boolean>;
  onReorderMenus: (ordered: MenuItem[]) => Promise<void>;
  onSaveAnnouncement: (ann: Announcement) => Promise<boolean>;
  onDeleteAnnouncement: (id: string | number) => Promise<boolean>;
  onSaveClass: (cls: SchoolClass) => Promise<boolean>;
  onRenameClass: (id: string, oldName: string, newName: string) => Promise<boolean>;
  onDeleteClass: (id: string) => Promise<boolean>;
  onSaveSettings: (settings: AppSettings) => Promise<boolean>;
  onUploadLmsFile: (params: {
    fileData: string;
    fileName: string;
    mimeType: string;
    kelas: string;
    subject?: string;
    sizeKb?: number;
  }) => Promise<boolean>;
  onAddLmsLink: (params: {
    title: string;
    url: string;
    kelas: string;
    subject?: string;
  }) => Promise<boolean>;
  onOpenEditLmsFile: (file: LMSFile) => void;
  onDeleteLmsFile: (id: string) => void;
  onOpenPreview: (url: string, title: string) => void;
  onExportBackup: () => void;
  onImportBackup: (data: PortalBackupData) => Promise<void>;
  onLockAdmin: () => void;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

export const SettingsView: React.FC<SettingsViewProps> = ({
  menus,
  announcements,
  classes,
  appSettings,
  lmsFiles,
  onRefreshDatabase,
  onRefreshLms,
  onSaveMenu,
  onDeleteMenu,
  onReorderMenus,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onSaveClass,
  onRenameClass,
  onDeleteClass,
  onSaveSettings,
  onUploadLmsFile,
  onAddLmsLink,
  onOpenEditLmsFile,
  onDeleteLmsFile,
  onOpenPreview,
  onExportBackup,
  onImportBackup,
  onLockAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('lms-admin');

  // =========================================================================
  // TAB 1: E-LIBRARY (GURU) STATE
  // =========================================================================
  const [lmsInputMode, setLmsInputMode] = useState<'upload' | 'link'>('upload');
  const [uploadClass, setUploadClass] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadCustomTitle, setUploadCustomTitle] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkClass, setLinkClass] = useState('');
  const [linkSubject, setLinkSubject] = useState('');

  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassValue, setEditingClassValue] = useState('');

  const [lmsSearch, setLmsSearch] = useState('');
  const [lmsClassFilter, setLmsClassFilter] = useState('Semua');
  const [lmsSortBy, setLmsSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');

  // =========================================================================
  // TAB 2: MENU DASAR STATE
  // =========================================================================
  const [menuEditId, setMenuEditId] = useState('');
  const [menuTitle, setMenuTitle] = useState('');
  const [menuCategory, setMenuCategory] = useState('');
  const [menuTeacher, setMenuTeacher] = useState('');
  const [menuPlaylistMode, setMenuPlaylistMode] = useState(false);
  const [menuSingleUrl, setMenuSingleUrl] = useState('');
  const [menuPlaylistUrls, setMenuPlaylistUrls] = useState<string[]>(['', '']);
  const [menuIcon, setMenuIcon] = useState('fa-desktop');
  const [menuColor, setMenuColor] = useState('blue');
  const [menuStatus, setMenuStatus] = useState('active');
  const [menuAutoOpen, setMenuAutoOpen] = useState('');
  const [menuAutoClose, setMenuAutoClose] = useState('');
  const [menuExamToken, setMenuExamToken] = useState('');
  const [menuOpenExternal, setMenuOpenExternal] = useState(false);
  const [menuOrder, setMenuOrder] = useState<number | undefined>(undefined);

  const [menuListSearch, setMenuListSearch] = useState('');
  const [menuStatusFilter, setMenuStatusFilter] = useState<
    'all' | 'active' | 'scheduled' | 'inactive'
  >('all');

  // =========================================================================
  // TAB 3: PENGUMUMAN STATE
  // =========================================================================
  const [annEditId, setAnnEditId] = useState<string | number>('');
  const [annTime, setAnnTime] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<AnnouncementType>('info');
  const [annTargetClass, setAnnTargetClass] = useState('Semua');
  const [annPinned, setAnnPinned] = useState(false);
  const [annExpiresAt, setAnnExpiresAt] = useState('');
  const [annLinkUrl, setAnnLinkUrl] = useState('');
  const [annLinkLabel, setAnnLinkLabel] = useState('');

  const [annSearch, setAnnSearch] = useState('');
  const [annFilterType, setAnnFilterType] = useState<'all' | AnnouncementType>('all');

  // =========================================================================
  // TAB 4: IDENTITAS & KEAMANAN STATE
  // =========================================================================
  const [setAppName, setSetAppName] = useState('');
  const [setSchoolName, setSetSchoolName] = useState('');
  const [setAppSubtitle, setSetAppSubtitle] = useState('');
  const [setAcademicYear, setSetAcademicYear] = useState('');
  const [setWelcomeTitle, setSetWelcomeTitle] = useState('');
  const [setWelcomeMessage, setSetWelcomeMessage] = useState('');
  const [setAvatarUrl, setSetAvatarUrl] = useState('');
  const [setRunningText, setSetRunningText] = useState('');
  const [setMarqueeEnabled, setSetMarqueeEnabled] = useState(true);
  const [setLmsFeatureStatus, setSetLmsFeatureStatus] = useState<'active' | 'inactive'>(
    'active'
  );
  const [setCalculatorEnabled, setSetCalculatorEnabled] = useState(true);
  const [setTasksEnabled, setSetTasksEnabled] = useState(true);
  const [setAdminPassword, setSetAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [setAdminSessionMinutes, setSetAdminSessionMinutes] = useState<number>(15);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSetAppName(appSettings.app_name || '');
    setSetSchoolName(appSettings.school_name || '');
    setSetAppSubtitle(appSettings.app_subtitle || '');
    setSetAcademicYear(appSettings.academic_year || '');
    setSetWelcomeTitle(appSettings.welcome_title || '');
    setSetWelcomeMessage(appSettings.welcome_message || '');
    setSetAvatarUrl(appSettings.avatar_url || '');
    setSetRunningText(appSettings.running_text || '');
    setSetMarqueeEnabled(appSettings.marquee_enabled !== false);
    setSetLmsFeatureStatus(appSettings.lms_feature_status || 'active');
    setSetCalculatorEnabled(appSettings.calculator_enabled !== false);
    setSetTasksEnabled(appSettings.tasks_enabled !== false);
    setSetAdminPassword(
      appSettings.admin_password !== undefined ? String(appSettings.admin_password) : ''
    );
    setSetAdminSessionMinutes(
      typeof appSettings.admin_session_minutes === 'number'
        ? appSettings.admin_session_minutes
        : 15
    );
  }, [appSettings]);

  const buildCurrentSettingsPayload = (
    overrides?: Partial<AppSettings>
  ): AppSettings => ({
    app_name: setAppName.trim() || 'NusanCBT',
    school_name: setSchoolName.trim(),
    app_subtitle: setAppSubtitle.trim() || 'Dashboard Siswa',
    academic_year: setAcademicYear.trim(),
    welcome_title: setWelcomeTitle.trim(),
    welcome_message: setWelcomeMessage.trim(),
    avatar_url: setAvatarUrl.trim(),
    running_text: setRunningText,
    marquee_enabled: setMarqueeEnabled,
    admin_password: setAdminPassword,
    admin_session_minutes: setAdminSessionMinutes,
    lms_feature_status: setLmsFeatureStatus,
    calculator_enabled: setCalculatorEnabled,
    tasks_enabled: setTasksEnabled,
    ...overrides,
  });

  // =========================================================================
  // HANDLERS — TAB 1: E-LIBRARY (GURU)
  // =========================================================================
  const classFileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lmsFiles.forEach((f) => {
      if (f.kelas) counts[f.kelas] = (counts[f.kelas] || 0) + 1;
    });
    return counts;
  }, [lmsFiles]);

  const filteredLmsAdminFiles = useMemo(() => {
    const filtered = lmsFiles.filter((f) => {
      const matchClass = lmsClassFilter === 'Semua' || f.kelas === lmsClassFilter;
      const q = lmsSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.subject || '').toLowerCase().includes(q) ||
        (f.kelas || '').toLowerCase().includes(q);
      return matchClass && matchSearch;
    });

    return filtered.sort((a, b) => {
      if (lmsSortBy === 'az') return a.name.localeCompare(b.name, 'id');
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      return lmsSortBy === 'newest' ? tB - tA : tA - tB;
    });
  }, [lmsFiles, lmsClassFilter, lmsSearch, lmsSortBy]);

  const handleFileSelection = (file?: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      Swal.fire('Format Tidak Didukung', 'Pilih file berformat PDF.', 'warning');
      return;
    }
    setSelectedPdfFile(file);
    if (!uploadCustomTitle) {
      setUploadCustomTitle(file.name.replace(/\.pdf$/i, ''));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = selectedPdfFile || fileInputRef.current?.files?.[0];
    if (!file) {
      Swal.fire('Pilih File', 'Silakan pilih file PDF terlebih dahulu.', 'warning');
      return;
    }
    if (!uploadClass) {
      Swal.fire('Pilih Kelas', 'Tentukan kelas tujuan materi.', 'warning');
      return;
    }

    const finalFileName = uploadCustomTitle.trim()
      ? uploadCustomTitle.trim().toLowerCase().endsWith('.pdf')
        ? uploadCustomTitle.trim()
        : `${uploadCustomTitle.trim()}.pdf`
      : file.name;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const resultStr = String(reader.result || '');
      const base64Content = resultStr.split(',')[1] || '';
      const ok = await onUploadLmsFile({
        fileData: base64Content,
        fileName: finalFileName,
        mimeType: file.type || 'application/pdf',
        kelas: uploadClass,
        subject: uploadSubject.trim() || undefined,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
      });
      if (ok) {
        setSelectedPdfFile(null);
        setUploadCustomTitle('');
        setUploadSubject('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim() || !linkClass) {
      Swal.fire('Data Kurang', 'Lengkapi judul, URL materi, dan kelas tujuan.', 'warning');
      return;
    }
    if (!isValidUrl(linkUrl)) {
      Swal.fire(
        'URL Tidak Valid',
        'Masukkan tautan lengkap yang diawali https:// (mis. Google Drive atau PDF).',
        'warning'
      );
      return;
    }

    const ok = await onAddLmsLink({
      title: linkTitle.trim(),
      url: linkUrl.trim(),
      kelas: linkClass,
      subject: linkSubject.trim() || undefined,
    });
    if (ok) {
      setLinkTitle('');
      setLinkUrl('');
      setLinkSubject('');
    }
  };

  const handleSaveClassForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    if (classes.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Swal.fire('Duplikat Kelas', 'Nama kelas tersebut sudah terdaftar.', 'error');
      return;
    }
    const ok = await onSaveClass({
      id: `cls_${Date.now()}`,
      name: trimmed,
      description: `Kelas ${trimmed}`,
    });
    if (ok) setNewClassName('');
  };

  const handleSaveEditedClass = async (cls: SchoolClass) => {
    const trimmed = editingClassValue.trim();
    if (!trimmed || trimmed === cls.name) {
      setEditingClassId(null);
      return;
    }
    if (
      classes.some(
        (c) => c.id !== cls.id && c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      Swal.fire('Duplikat Kelas', 'Nama kelas sudah digunakan.', 'error');
      return;
    }
    const ok = await onRenameClass(cls.id, cls.name, trimmed);
    if (ok) setEditingClassId(null);
  };

  const confirmDeleteClass = (cls: SchoolClass) => {
    Swal.fire({
      title: `Hapus Kelas ${cls.name}?`,
      text: 'Folder di Google Drive tetap aman dan tidak ikut terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteClass(cls.id);
      }
    });
  };

  const copyFileLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Tautan materi disalin',
        showConfirmButton: false,
        timer: 1800,
      });
    } catch {
      Swal.fire('Info Tautan', url, 'info');
    }
  };

  // =========================================================================
  // HANDLERS — TAB 2: MENU DASAR
  // =========================================================================
  const orderedMenus = useMemo(() => sortMenus(menus), [menus]);

  const filteredMenus = useMemo(() => {
    return orderedMenus.filter((m) => {
      const q = menuListSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.url || '').toLowerCase().includes(q);
      if (!matchQuery) return false;

      const st = getMenuTimeStatus(m);
      if (menuStatusFilter === 'active') return st.isActive;
      if (menuStatusFilter === 'inactive') return st.code === 'manual_inactive';
      if (menuStatusFilter === 'scheduled') {
        return Boolean(m.auto_open || m.auto_close);
      }
      return true;
    });
  }, [orderedMenus, menuListSearch, menuStatusFilter]);

  const resetMenuForm = () => {
    setMenuEditId('');
    setMenuTitle('');
    setMenuCategory('');
    setMenuTeacher('');
    setMenuPlaylistMode(false);
    setMenuSingleUrl('');
    setMenuPlaylistUrls(['', '']);
    setMenuIcon('fa-desktop');
    setMenuColor('blue');
    setMenuStatus('active');
    setMenuAutoOpen('');
    setMenuAutoClose('');
    setMenuExamToken('');
    setMenuOpenExternal(false);
    setMenuOrder(undefined);
  };

  const handleSaveMenuForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = menuTitle.trim();
    const combinedUrl = menuPlaylistMode
      ? menuPlaylistUrls
          .map((u) => u.trim())
          .filter(Boolean)
          .join(', ')
      : menuSingleUrl.trim();

    if (!cleanTitle || !combinedUrl) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Nama menu dan minimal satu URL sumber wajib diisi.',
      });
      return;
    }

    const formattedTitle =
      menuCategory.trim() && !cleanTitle.includes(':')
        ? `${menuCategory.trim()}: ${cleanTitle}`
        : cleanTitle;

    const data: MenuItem = {
      id: menuEditId || `menu_${Date.now()}`,
      title: formattedTitle,
      category: menuCategory.trim() || undefined,
      teacher: menuTeacher.trim() || undefined,
      url: combinedUrl,
      icon: menuIcon,
      color: menuColor,
      status: menuStatus,
      auto_open: menuAutoOpen,
      auto_close: menuAutoClose,
      exam_token: menuExamToken.trim().toUpperCase() || undefined,
      open_external: menuOpenExternal,
      order:
        typeof menuOrder === 'number' ? menuOrder : orderedMenus.length,
    };

    const ok = await onSaveMenu(data);
    if (ok) resetMenuForm();
  };

  const handleEditMenu = (item: MenuItem) => {
    setActiveTab('menu');
    setMenuEditId(item.id);

    let extractedCat = item.category || '';
    let extractedTitle = item.title || '';
    if (item.title.includes(':')) {
      const parts = item.title.split(':');
      if (!extractedCat) extractedCat = parts[0].trim();
      extractedTitle = parts.slice(1).join(':').trim();
    }

    const urls = (item.url || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    setMenuTitle(extractedTitle);
    setMenuCategory(extractedCat);
    setMenuTeacher(item.teacher || '');
    if (urls.length > 1) {
      setMenuPlaylistMode(true);
      setMenuPlaylistUrls(urls);
      setMenuSingleUrl(urls[0] || '');
    } else {
      setMenuPlaylistMode(false);
      setMenuSingleUrl(urls[0] || '');
      setMenuPlaylistUrls([urls[0] || '', '']);
    }

    setMenuIcon(item.icon || 'fa-desktop');
    setMenuColor(item.color || 'blue');
    setMenuStatus(item.status || 'active');
    setMenuAutoOpen(item.auto_open || '');
    setMenuAutoClose(item.auto_close || '');
    setMenuExamToken(item.exam_token || '');
    setMenuOpenExternal(Boolean(item.open_external));
    setMenuOrder(item.order);
  };

  const handleDuplicateMenu = async (item: MenuItem) => {
    const copy: MenuItem = {
      ...item,
      id: `menu_${Date.now()}`,
      title: `${item.title} (Salinan)`,
      order: orderedMenus.length,
    };
    await onSaveMenu(copy);
  };

  const handleQuickToggleMenuStatus = async (item: MenuItem) => {
    const nextStatus =
      (item.status || 'active').toLowerCase() === 'inactive' ? 'active' : 'inactive';
    await onSaveMenu({
      ...item,
      status: nextStatus,
    });
  };

  const handleMoveMenu = async (indexInOrdered: number, direction: -1 | 1) => {
    const targetIdx = indexInOrdered + direction;
    if (targetIdx < 0 || targetIdx >= orderedMenus.length) return;
    const copy = [...orderedMenus];
    const [moved] = copy.splice(indexInOrdered, 1);
    copy.splice(targetIdx, 0, moved);
    await onReorderMenus(copy);
  };

  const confirmDeleteMenu = (item: MenuItem) => {
    Swal.fire({
      title: 'Hapus Menu?',
      text: `Menu "${item.title}" akan dihapus dari portal.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (r.isConfirmed) {
        onDeleteMenu(item.id);
      }
    });
  };

  const handleTestPreviewUrl = () => {
    const testUrl = menuPlaylistMode
      ? menuPlaylistUrls.find((u) => u.trim() !== '') || ''
      : menuSingleUrl.trim();
    if (!isValidUrl(testUrl)) {
      Swal.fire(
        'URL Belum Valid',
        'Masukkan URL lengkap dengan awalan https:// untuk diuji.',
        'warning'
      );
      return;
    }
    onOpenPreview(testUrl, menuTitle.trim() || 'Uji Pratinjau URL');
  };

  // =========================================================================
  // HANDLERS — TAB 3: PENGUMUMAN
  // =========================================================================
  const resetAnnouncementForm = () => {
    setAnnEditId('');
    setAnnTime('');
    setAnnTitle('');
    setAnnContent('');
    setAnnType('info');
    setAnnTargetClass('Semua');
    setAnnPinned(false);
    setAnnExpiresAt('');
    setAnnLinkUrl('');
    setAnnLinkLabel('');
  };

  const handleSaveAnnouncementForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (annLinkUrl.trim() && !isValidUrl(annLinkUrl.trim())) {
      Swal.fire(
        'URL Lampiran Tidak Valid',
        'Pastikan tautan lampiran diawali dengan https://',
        'warning'
      );
      return;
    }

    const timestamp = annEditId && annTime ? annTime : new Date().toISOString();
    const data: Announcement = {
      id: annEditId || Date.now(),
      title: annTitle.trim(),
      content: annContent.trim(),
      type: annType,
      time: timestamp,
      pinned: annPinned,
      target_class: annTargetClass,
      expires_at: annExpiresAt || undefined,
      link_url: annLinkUrl.trim() || undefined,
      link_label: annLinkLabel.trim() || undefined,
    };

    const ok = await onSaveAnnouncement(data);
    if (ok) resetAnnouncementForm();
  };

  const handleEditAnnouncement = (item: Announcement) => {
    setAnnEditId(item.id);
    setAnnTitle(item.title);
    setAnnContent(item.content);
    setAnnType(item.type);
    setAnnTime(item.time);
    setAnnPinned(Boolean(item.pinned));
    setAnnTargetClass(item.target_class || 'Semua');
    setAnnExpiresAt(item.expires_at || '');
    setAnnLinkUrl(item.link_url || '');
    setAnnLinkLabel(item.link_label || '');
  };

  const handleTogglePinAnnouncement = async (item: Announcement) => {
    await onSaveAnnouncement({
      ...item,
      pinned: !item.pinned,
    });
  };

  const confirmDeleteAnnouncement = (id: string | number) => {
    Swal.fire({
      title: 'Hapus Pengumuman?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    }).then((r) => {
      if (r.isConfirmed) {
        onDeleteAnnouncement(id);
        if (String(annEditId) === String(id)) {
          resetAnnouncementForm();
        }
      }
    });
  };

  const filteredAnnouncements = useMemo(() => {
    const sorted = sortAnnouncements(announcements);
    return sorted.filter((a) => {
      const matchType = annFilterType === 'all' || a.type === annFilterType;
      const q = annSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.target_class || '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [announcements, annFilterType, annSearch]);

  // =========================================================================
  // HANDLERS — TAB 4: IDENTITAS & KEAMANAN
  // =========================================================================
  const handleLmsStatusQuickChange = (val: 'active' | 'inactive') => {
    setSetLmsFeatureStatus(val);
    onSaveSettings(buildCurrentSettingsPayload({ lms_feature_status: val }));
  };

  const handleSaveIdentitySettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(buildCurrentSettingsPayload());
  };

  const passwordStrength = useMemo(() => {
    const p = setAdminPassword.trim();
    if (!p) return { label: 'Default (112233)', color: 'text-amber-600' };
    if (p.length < 6) return { label: 'Lemah (< 6 karakter)', color: 'text-rose-600' };
    if (p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)) {
      return { label: 'Kuat (Kombinasi huruf & angka)', color: 'text-emerald-600' };
    }
    return { label: 'Cukup Baik', color: 'text-blue-600' };
  }, [setAdminPassword]);

  const handleBackupFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as PortalBackupData;
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.menus)) {
          throw new Error('Format file cadangan tidak dikenali.');
        }
        const confirm = await Swal.fire({
          title: 'Pulihkan Data Cadangan?',
          text: `Ditemukan ${parsed.menus.length} menu, ${
            parsed.announcements?.length || 0
          } pengumuman, dan ${parsed.classes?.length || 0} kelas.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Pulihkan Sekarang',
          cancelButtonText: 'Batal',
        });
        if (confirm.isConfirmed) {
          await onImportBackup(parsed);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'File JSON rusak.';
        Swal.fire('Gagal Impor', msg, 'error');
      } finally {
        if (backupInputRef.current) backupInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const tabBtnClass = (tab: SettingsTab) =>
    `px-5 py-3 text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 flex items-center gap-2 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/60'
        : 'border-transparent text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-slate-50 custom-scrollbar">
      <div className="max-w-7xl mx-auto pb-12">
        {/* Navigation Tabs (Manajemen Dashboard Removed) */}
        <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl px-2 pt-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lms-admin')}
            className={tabBtnClass('lms-admin')}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>E-Library (Guru)</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={tabBtnClass('menu')}
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>Menu Dasar</span>
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={tabBtnClass('announcement')}
          >
            <i className="fa-solid fa-bullhorn"></i>
            <span>Pengumuman</span>
          </button>
          <button
            onClick={() => setActiveTab('app')}
            className={tabBtnClass('app')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Identitas & Keamanan</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* 1. TAB E-LIBRARY (GURU)                                           */}
        {/* ================================================================= */}
        {activeTab === 'lms-admin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Summary & Visibility Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-500">Total Materi</p>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {lmsFiles.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kelas Terdaftar</p>
                  <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {classes.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status Pustaka</p>
                  <p
                    className={`text-sm font-semibold mt-1.5 ${
                      setLmsFeatureStatus === 'active'
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {setLmsFeatureStatus === 'active' ? 'Aktif' : 'Disembunyikan'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <select
                  value={setLmsFeatureStatus}
                  onChange={(e) =>
                    handleLmsStatusQuickChange(
                      e.target.value as 'active' | 'inactive'
                    )
                  }
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">E-Library Aktif di Siswa</option>
                  <option value="inactive">Sembunyikan E-Library</option>
                </select>

                <button
                  type="button"
                  onClick={onRefreshLms}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap"
                >
                  <i className="fa-solid fa-rotate mr-1.5"></i>Sinkronkan Pustaka
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Add Material (Upload PDF or External Drive Link) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Tambah Materi Pustaka
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unggah file PDF ke Google Drive atau tautkan link materi eksternal.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setLmsInputMode('upload')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        lmsInputMode === 'upload'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upload PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setLmsInputMode('link')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        lmsInputMode === 'link'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tautan Drive / URL
                    </button>
                  </div>
                </div>

                {lmsInputMode === 'upload' ? (
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        handleFileSelection(e.dataTransfer.files?.[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        isDraggingFile
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileSelection(e.target.files?.[0])}
                        className="hidden"
                      />
                      <i className="fa-solid fa-file-pdf text-2xl text-blue-600 mb-2"></i>
                      {selectedPdfFile ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-md mx-auto">
                            {selectedPdfFile.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                            {formatFileSize(Math.round(selectedPdfFile.size / 1024))} · Klik
                            untuk mengganti file
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Klik atau seret file PDF ke area ini
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Mendukung modul pembelajaran dan E-Book berformat .pdf
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kelas Tujuan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={uploadClass}
                          onChange={(e) => setUploadClass(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="" disabled>
                            -- Pilih Kelas --
                          </option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mata Pelajaran
                        </label>
                        <input
                          type="text"
                          list="elibrary-subjects"
                          value={uploadSubject}
                          onChange={(e) => setUploadSubject(e.target.value)}
                          placeholder="Cth: Matematika"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Tampilan Materi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={uploadCustomTitle}
                        onChange={(e) => setUploadCustomTitle(e.target.value)}
                        placeholder="Kosongkan untuk memakai nama asli file PDF"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      <i className="fa-solid fa-cloud-arrow-up mr-2"></i>Unggah Materi PDF
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddLinkSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Materi / E-Book <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="Cth: Modul Jaringan Dasar Bab 1"
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        URL Google Drive / Dokumen PDF <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/.../view"
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Tautan berbagi Google Drive otomatis dikonversi menjadi mode baca & unduh.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kelas Tujuan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={linkClass}
                          onChange={(e) => setLinkClass(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="" disabled>
                            -- Pilih Kelas --
                          </option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mata Pelajaran
                        </label>
                        <input
                          type="text"
                          list="elibrary-subjects"
                          value={linkSubject}
                          onChange={(e) => setLinkSubject(e.target.value)}
                          placeholder="Cth: Produktif TJKT"
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      <i className="fa-solid fa-link mr-2"></i>Simpan Tautan Pustaka
                    </button>
                  </form>
                )}

                <datalist id="elibrary-subjects">
                  <option value="Matematika" />
                  <option value="Bahasa Indonesia" />
                  <option value="Bahasa Inggris" />
                  <option value="IPA / Sains" />
                  <option value="Informatika" />
                  <option value="Produktif Kejuruan" />
                </datalist>
              </div>

              {/* Right Column: Class Management with Edit & Counters */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200">
                <div className="mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Manajemen Kelas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola kategori kelas untuk pengelompokan E-Library dan Pengumuman.
                  </p>
                </div>

                <form onSubmit={handleSaveClassForm} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Tambah kelas baru (Cth: XI TJKT 1)"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    Tambah
                  </button>
                </form>

                <div className="overflow-y-auto max-h-[280px] custom-scrollbar border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {classes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada kelas terdaftar. Tambahkan kelas pertama di atas.
                    </div>
                  ) : (
                    classes.map((c) => {
                      const isEditing = editingClassId === c.id;
                      const count = classFileCounts[c.name] || 0;

                      return (
                        <div
                          key={c.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingClassValue}
                                onChange={(e) => setEditingClassValue(e.target.value)}
                                className="flex-1 px-2.5 py-1 border border-blue-400 rounded text-sm outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditedClass(c)}
                                className="text-emerald-600 hover:text-emerald-700 px-2 py-1 text-xs font-semibold"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingClassId(null)}
                                className="text-slate-400 hover:text-slate-600 px-1.5 py-1 text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-800">
                                  {c.name}
                                </span>
                                <span className="text-xs text-slate-400 ml-2 font-mono tabular-nums">
                                  · {count} materi
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClassId(c.id);
                                    setEditingClassValue(c.name);
                                  }}
                                  className="text-slate-400 hover:text-blue-600 p-1.5 rounded transition-colors"
                                  title="Ubah nama kelas"
                                >
                                  <i className="fa-solid fa-pen text-xs"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDeleteClass(c)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                                  title="Hapus kelas"
                                >
                                  <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* File Management Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftar Materi E-Library
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan{' '}
                    <span className="font-mono tabular-nums font-semibold">
                      {filteredLmsAdminFiles.length}
                    </span>{' '}
                    dari{' '}
                    <span className="font-mono tabular-nums font-semibold">
                      {lmsFiles.length}
                    </span>{' '}
                    materi tersimpan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={lmsSearch}
                      onChange={(e) => setLmsSearch(e.target.value)}
                      placeholder="Cari materi / mapel..."
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                  </div>

                  <select
                    value={lmsClassFilter}
                    onChange={(e) => setLmsClassFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={lmsSortBy}
                    onChange={(e) =>
                      setLmsSortBy(e.target.value as 'newest' | 'oldest' | 'az')
                    }
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="az">Nama A–Z</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Judul Materi</th>
                      <th className="px-4 py-3 font-semibold">Kelas & Mapel</th>
                      <th className="px-4 py-3 font-semibold">Tanggal</th>
                      <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLmsAdminFiles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-10 text-center text-slate-400 text-sm"
                        >
                          Tidak ada file materi yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredLmsAdminFiles.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <i
                                className={`fa-solid ${
                                  item.source_type === 'link'
                                    ? 'fa-link text-indigo-500'
                                    : 'fa-file-pdf text-rose-500'
                                }`}
                              ></i>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate max-w-md">
                                  {item.name}
                                </p>
                                {item.size_kb && (
                                  <p className="text-xs text-slate-400 font-mono tabular-nums">
                                    {formatFileSize(item.size_kb)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">
                              {item.kelas}
                            </span>
                            {item.subject ? ` · ${item.subject}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                            {item.date
                              ? new Date(item.date).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onOpenPreview(item.url, item.name)}
                              className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Pratinjau / Baca"
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => copyFileLink(item.url)}
                              className="text-slate-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Salin Tautan"
                            >
                              <i className="fa-solid fa-copy"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenEditLmsFile(item)}
                              className="text-amber-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                              title="Edit Judul, Kelas, atau Mapel"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteLmsFile(item.id)}
                              className="text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Materi"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. TAB MENU DASAR                                                 */}
        {/* ================================================================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {menuEditId ? 'Edit Menu Portal' : 'Tambah Menu Portal & Ujian'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur tautan ujian CBT, video pembelajaran, jadwal jam aktif, dan token akses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetMenuForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <i className="fa-solid fa-rotate-left mr-1.5"></i>Reset Form
                </button>
              </div>

              <form onSubmit={handleSaveMenuForm} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Menu / Judul <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={menuTitle}
                      onChange={(e) => setMenuTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Cth: Penilaian Akhir Semester"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori / Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      list="menu-categories"
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Cth: Ujian CBT / Matematika"
                    />
                    <datalist id="menu-categories">
                      <option value="Ujian CBT" />
                      <option value="Menu Utama" />
                      <option value="Matematika" />
                      <option value="Bahasa Indonesia" />
                      <option value="Bahasa Inggris" />
                      <option value="IPA / Sains" />
                      <option value="Produktif Kejuruan" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Guru / Pengampu (Opsional)
                    </label>
                    <input
                      type="text"
                      value={menuTeacher}
                      onChange={(e) => setMenuTeacher(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Cth: Bpk. Ahmad, S.Pd"
                    />
                  </div>
                </div>

                {/* URL Single vs Multi Playlist */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Alamat URL Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestPreviewUrl}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <i className="fa-solid fa-eye mr-1"></i>Uji Tautan
                      </button>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setMenuPlaylistMode(false)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            !menuPlaylistMode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          1 Tautan
                        </button>
                        <button
                          type="button"
                          onClick={() => setMenuPlaylistMode(true)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            menuPlaylistMode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600'
                          }`}
                        >
                          Playlist Multi-URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {!menuPlaylistMode ? (
                    <input
                      type="url"
                      value={menuSingleUrl}
                      onChange={(e) => setMenuSingleUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="https://... (Mendukung Google Form, CBT, YouTube, PDF)"
                      required={!menuPlaylistMode}
                    />
                  ) : (
                    <div className="space-y-2">
                      {menuPlaylistUrls.map((u, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono tabular-nums text-slate-400 w-6 text-right">
                            {idx + 1}.
                          </span>
                          <input
                            type="url"
                            value={u}
                            onChange={(e) => {
                              const next = [...menuPlaylistUrls];
                              next[idx] = e.target.value;
                              setMenuPlaylistUrls(next);
                            }}
                            placeholder={`https://... (Materi Bagian ${idx + 1})`}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                          {menuPlaylistUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMenuPlaylistUrls(
                                  menuPlaylistUrls.filter((_, i) => i !== idx)
                                )
                              }
                              className="p-2 text-slate-400 hover:text-rose-600"
                              title="Hapus baris"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMenuPlaylistUrls([...menuPlaylistUrls, ''])}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1 inline-flex items-center gap-1"
                      >
                        <i className="fa-solid fa-plus"></i>Tambah Baris Playlist
                      </button>
                    </div>
                  )}
                </div>

                {/* Appearance & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ikon Menu
                    </label>
                    <select
                      value={menuIcon}
                      onChange={(e) => setMenuIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white outline-none text-sm"
                    >
                      {MENU_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Warna Kartu
                    </label>
                    <select
                      value={menuColor}
                      onChange={(e) => setMenuColor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white outline-none text-sm"
                    >
                      <option value="blue">Biru</option>
                      <option value="green">Hijau</option>
                      <option value="purple">Ungu</option>
                      <option value="orange">Oranye</option>
                      <option value="red">Merah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Publikasi
                    </label>
                    <select
                      value={menuStatus}
                      onChange={(e) => setMenuStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white outline-none text-sm"
                    >
                      <option value="active">Aktif (Tampil)</option>
                      <option value="inactive">Non-Aktif (Draf)</option>
                    </select>
                  </div>
                </div>

                {/* Schedule, Exam Token & Open Target */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Jam Buka Otomatis
                      </label>
                      {menuAutoOpen && (
                        <button
                          type="button"
                          onClick={() => setMenuAutoOpen('')}
                          className="text-[11px] text-slate-400 hover:text-rose-600"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <input
                      type="time"
                      value={menuAutoOpen}
                      onChange={(e) => setMenuAutoOpen(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none text-sm font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Jam Tutup Otomatis
                      </label>
                      {menuAutoClose && (
                        <button
                          type="button"
                          onClick={() => setMenuAutoClose('')}
                          className="text-[11px] text-slate-400 hover:text-rose-600"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <input
                      type="time"
                      value={menuAutoClose}
                      onChange={(e) => setMenuAutoClose(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none text-sm font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Token Ujian (Opsional)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setMenuExamToken(
                            Math.random().toString(36).substring(2, 8).toUpperCase()
                          )
                        }
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Acak Token
                      </button>
                    </div>
                    <input
                      type="text"
                      value={menuExamToken}
                      onChange={(e) => setMenuExamToken(e.target.value.toUpperCase())}
                      placeholder="Tanpa Token"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none text-sm font-mono uppercase tracking-wider"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={menuOpenExternal}
                        onChange={(e) => setMenuOpenExternal(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Buka langsung di Tab Baru
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
                  >
                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                    {menuEditId ? 'Simpan Perubahan Menu' : 'Tambahkan Menu ke Portal'}
                  </button>
                </div>
              </form>
            </div>

            {/* Menu List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftar Seluruh Menu Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur urutan tampil, duplikat jadwal ujian, atau aktifkan/nonaktifkan menu secara instan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={menuListSearch}
                      onChange={(e) => setMenuListSearch(e.target.value)}
                      placeholder="Cari menu..."
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-44"
                    />
                  </div>

                  <select
                    value={menuStatusFilter}
                    onChange={(e) =>
                      setMenuStatusFilter(
                        e.target.value as 'all' | 'active' | 'scheduled' | 'inactive'
                      )
                    }
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="all">Semua Menu ({menus.length})</option>
                    <option value="active">Sedang Aktif</option>
                    <option value="scheduled">Memiliki Jadwal Jam</option>
                    <option value="inactive">Non-Aktif (Draf)</option>
                  </select>

                  <button
                    type="button"
                    onClick={onRefreshDatabase}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    <i className="fa-solid fa-rotate mr-1"></i>Refresh
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto custom-scrollbar">
                {filteredMenus.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    Belum ada menu yang sesuai filter.
                  </div>
                ) : (
                  filteredMenus.map((menu) => {
                    const statusObj = getMenuTimeStatus(menu);
                    const badgeClass =
                      ICON_BADGE_COLORS[menu.color] || ICON_BADGE_COLORS.blue;
                    const indexInOrdered = orderedMenus.findIndex(
                      (m) => m.id === menu.id
                    );
                    const urlCount = (menu.url || '')
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean).length;

                    return (
                      <div
                        key={menu.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Reorder Arrows */}
                          <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={indexInOrdered <= 0}
                              onClick={() => handleMoveMenu(indexInOrdered, -1)}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-25 p-0.5 text-xs"
                              title="Geser ke atas"
                            >
                              <i className="fa-solid fa-chevron-up"></i>
                            </button>
                            <button
                              type="button"
                              disabled={indexInOrdered >= orderedMenus.length - 1}
                              onClick={() => handleMoveMenu(indexInOrdered, 1)}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-25 p-0.5 text-xs"
                              title="Geser ke bawah"
                            >
                              <i className="fa-solid fa-chevron-down"></i>
                            </button>
                          </div>

                          <div
                            className={`w-10 h-10 rounded-lg ${badgeClass} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <i className={`fa-solid ${menu.icon}`}></i>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                              <span
                                className={`font-semibold ${
                                  statusObj.isActive
                                    ? 'text-emerald-600'
                                    : statusObj.color === 'yellow'
                                    ? 'text-amber-600'
                                    : statusObj.color === 'red'
                                    ? 'text-rose-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                {statusObj.label}
                              </span>
                              {(menu.auto_open || menu.auto_close) && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    {menu.auto_open || '00:00'}–
                                    {menu.auto_close || '23:59'}
                                  </span>
                                </>
                              )}
                              {urlCount > 1 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    {urlCount} Playlist
                                  </span>
                                </>
                              )}
                              {menu.exam_token && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono font-semibold text-amber-700">
                                    Token: {menu.exam_token}
                                  </span>
                                </>
                              )}
                              {menu.open_external && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Tab Baru</span>
                                </>
                              )}
                            </div>

                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {menu.title}
                            </h4>
                            <p className="text-xs text-slate-400 truncate max-w-md">
                              {menu.url}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleMenuStatus(menu)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              (menu.status || 'active').toLowerCase() === 'inactive'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Ubah status aktif/draf secara cepat"
                          >
                            {(menu.status || 'active').toLowerCase() === 'inactive'
                              ? 'Aktifkan'
                              : 'Nonaktifkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateMenu(menu)}
                            className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="Duplikat Menu"
                          >
                            <i className="fa-solid fa-clone text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditMenu(menu)}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteMenu(menu)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. TAB PENGUMUMAN                                                 */}
        {/* ================================================================= */}
        {activeTab === 'announcement' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {annEditId ? 'Edit Pengumuman Sekolah' : 'Buat Pengumuman Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sampaikan informasi akademik, jadwal ujian, atau edaran resmi ke siswa.
                  </p>
                </div>
                {annEditId && (
                  <button
                    type="button"
                    onClick={resetAnnouncementForm}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveAnnouncementForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Pengumuman <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Cth: Pelaksanaan Simulasi Ujian Semester Ganjil"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tingkat Prioritas
                    </label>
                    <select
                      value={annType}
                      onChange={(e) => setAnnType(e.target.value as AnnouncementType)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white outline-none text-sm"
                    >
                      <option value="info">Info Umum</option>
                      <option value="warning">Peringatan / Perhatian</option>
                      <option value="urgent">Penting / Mendesak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Isi Pesan Pengumuman <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {annContent.length} karakter
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Tulis isi pengumuman secara lengkap..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Kelas / Pembaca
                    </label>
                    <select
                      value={annTargetClass}
                      onChange={(e) => setAnnTargetClass(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white outline-none text-sm"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Batas Tayang (Opsional)
                      </label>
                      {annExpiresAt && (
                        <button
                          type="button"
                          onClick={() => setAnnExpiresAt('')}
                          className="text-[11px] text-slate-400 hover:text-rose-600"
                        >
                          Hapus Batas
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={annExpiresAt}
                      onChange={(e) => setAnnExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 outline-none text-sm font-mono tabular-nums"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={annPinned}
                        onChange={(e) => setAnnPinned(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Sematkan di paling atas
                      </span>
                    </label>
                  </div>
                </div>

                {/* Optional Attachment Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Lampiran / Dokumen (Opsional)
                    </label>
                    <input
                      type="url"
                      value={annLinkUrl}
                      onChange={(e) => setAnnLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Label Tombol Lampiran (Opsional)
                    </label>
                    <input
                      type="text"
                      value={annLinkLabel}
                      onChange={(e) => setAnnLinkLabel(e.target.value)}
                      placeholder="Cth: Unduh Jadwal Ujian (PDF)"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
                >
                  <i className="fa-solid fa-paper-plane mr-2"></i>
                  {annEditId ? 'Simpan Perubahan Pengumuman' : 'Terbitkan Pengumuman'}
                </button>
              </form>
            </div>

            {/* Archive List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Arsip & Daftar Pengumuman
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total{' '}
                    <span className="font-mono tabular-nums font-semibold">
                      {announcements.length}
                    </span>{' '}
                    pengumuman tercatat.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={annSearch}
                      onChange={(e) => setAnnSearch(e.target.value)}
                      placeholder="Cari pengumuman..."
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-44"
                    />
                  </div>

                  <select
                    value={annFilterType}
                    onChange={(e) =>
                      setAnnFilterType(e.target.value as 'all' | AnnouncementType)
                    }
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="urgent">Penting</option>
                    <option value="warning">Peringatan</option>
                    <option value="info">Info Umum</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto custom-scrollbar">
                {filteredAnnouncements.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    Belum ada pengumuman yang sesuai pencarian.
                  </div>
                ) : (
                  filteredAnnouncements.map((item) => {
                    const expired = isAnnouncementExpired(item);
                    const typeName =
                      item.type === 'urgent'
                        ? 'Penting'
                        : item.type === 'warning'
                        ? 'Peringatan'
                        : 'Info Umum';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 ${
                          expired ? 'opacity-60' : ''
                        }`}
                      >
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
                            <span
                              className={`font-semibold ${
                                item.type === 'urgent'
                                  ? 'text-rose-600'
                                  : item.type === 'warning'
                                  ? 'text-amber-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {typeName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {item.target_class && item.target_class !== 'Semua'
                                ? `Kelas ${item.target_class}`
                                : 'Semua Kelas'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{timeAgo(item.time)}</span>
                            {item.expires_at && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-mono tabular-nums ${
                                    expired ? 'text-rose-600 font-semibold' : ''
                                  }`}
                                >
                                  {expired
                                    ? `Kedaluwarsa (${item.expires_at})`
                                    : `Tayang s/d ${item.expires_at}`}
                                </span>
                              </>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          {item.link_url && (
                            <p className="text-xs text-blue-600 mt-1 truncate">
                              <i className="fa-solid fa-paperclip mr-1"></i>
                              {item.link_label || item.link_url}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePinAnnouncement(item)}
                            className={`p-2 rounded-lg transition-colors ${
                              item.pinned
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                            title={item.pinned ? 'Lepas Sematan' : 'Sematkan di Atas'}
                          >
                            <i className="fa-solid fa-thumbtack text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditAnnouncement(item)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Pengumuman"
                          >
                            <i className="fa-solid fa-pen text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteAnnouncement(item.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Pengumuman"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. TAB IDENTITAS & KEAMANAN                                       */}
        {/* ================================================================= */}
        {activeTab === 'app' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleSaveIdentitySettings} className="space-y-6">
              {/* Section A: School & Portal Identity */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Identitas Sekolah & Tampilan Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sesuaikan nama portal, instansi sekolah, sambutan dashboard, dan teks berjalan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Aplikasi (Sidebar)
                    </label>
                    <input
                      type="text"
                      value={setAppName}
                      onChange={(e) => setSetAppName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Cth: NusanCBT"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Sekolah / Instansi
                    </label>
                    <input
                      type="text"
                      value={setSchoolName}
                      onChange={(e) => setSetSchoolName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Cth: SMK Nusantara 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sub-Judul / Label Peserta
                    </label>
                    <input
                      type="text"
                      value={setAppSubtitle}
                      onChange={(e) => setSetAppSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Cth: Dashboard Siswa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tahun Ajaran / Semester
                    </label>
                    <input
                      type="text"
                      value={setAcademicYear}
                      onChange={(e) => setSetAcademicYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Cth: TA 2026/2027 Ganjil"
                    />
                  </div>
                </div>

                {/* Custom Avatar & Welcome Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Banner Sambutan Dashboard
                    </label>
                    <input
                      type="text"
                      value={setWelcomeTitle}
                      onChange={(e) => setSetWelcomeTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Selamat Datang di Portal Belajar"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        URL Logo / Avatar Profil Siswa
                      </label>
                      {setAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setSetAvatarUrl('')}
                          className="text-[11px] text-slate-400 hover:text-rose-600"
                        >
                          Gunakan Default
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={setAvatarUrl.trim() || DEFAULT_AVATAR}
                        alt="Pratinjau Avatar"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                        className="w-10 h-10 rounded-full border border-slate-300 bg-slate-100 object-cover shrink-0"
                      />
                      <input
                        type="url"
                        value={setAvatarUrl}
                        onChange={(e) => setSetAvatarUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="https://... (URL gambar logo/avatar)"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pesan Sambutan Dashboard
                    </label>
                    <input
                      type="text"
                      value={setWelcomeMessage}
                      onChange={(e) => setSetWelcomeMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Akses materi, kerjakan ujian dan tugas, serta pantau jadwal pelajaranmu hari ini."
                    />
                  </div>
                </div>

                {/* Marquee Config */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Teks Berjalan (Running Text Header)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setMarqueeEnabled}
                        onChange={(e) => setSetMarqueeEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-600">
                        Tampilkan Running Text
                      </span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={setRunningText}
                    onChange={(e) => setSetRunningText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Masukkan informasi singkat berjalan di bagian atas layar..."
                  />
                </div>
              </div>

              {/* Section B: Student Portal Feature Controls */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Kontrol Fitur & Mode Ujian Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktifkan atau sembunyikan fitur pendamping siswa (misal menonaktifkan kalkulator saat ujian berlangsung).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={setCalculatorEnabled}
                      onChange={(e) => setSetCalculatorEnabled(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Kalkulator Siswa
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Izinkan tombol kalkulator mengambang di header portal.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={setTasksEnabled}
                      onChange={(e) => setSetTasksEnabled(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Agenda & Catatan Tugas
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tampilkan menu pencatat tugas harian siswa di sidebar.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={setLmsFeatureStatus === 'active'}
                      onChange={(e) =>
                        setSetLmsFeatureStatus(e.target.checked ? 'active' : 'inactive')
                      }
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Perpustakaan E-Library
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tampilkan kartu dan menu E-Library (LMS) untuk siswa.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section C: Admin Security & Session */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Keamanan & Sesi Admin
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola kredensial akses panel admin/guru dan batas waktu penguncian otomatis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLockAdmin}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
                  >
                    <i className="fa-solid fa-lock mr-1.5"></i>Kunci & Keluar Admin Sekarang
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Password / PIN Admin
                      </label>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showAdminPass ? 'text' : 'password'}
                          value={setAdminPassword}
                          onChange={(e) => setSetAdminPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-sm"
                          placeholder="Default: 112233"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title={showAdminPass ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          <i
                            className={`fa-solid ${
                              showAdminPass ? 'fa-eye-slash' : 'fa-eye'
                            } text-xs`}
                          ></i>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSetAdminPassword(
                            String(Math.floor(100000 + Math.random() * 900000))
                          );
                          setShowAdminPass(true);
                        }}
                        className="whitespace-nowrap px-3.5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-semibold transition-colors"
                      >
                        Acak PIN 6 Digit
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batas Waktu Sesi Login Admin
                    </label>
                    <select
                      value={setAdminSessionMinutes}
                      onChange={(e) =>
                        setSetAdminSessionMinutes(Number(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value={0}>
                        Selalu minta password setiap membuka menu Admin
                      </option>
                      <option value={15}>Ingat sesi selama 15 menit</option>
                      <option value={30}>Ingat sesi selama 30 menit</option>
                      <option value={60}>Ingat sesi selama 60 menit</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                Simpan Seluruh Pengaturan Identitas & Keamanan
              </button>
            </form>

            {/* Section D: Backup & Restore JSON */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cadangan & Pemulihan Konfigurasi (.json)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ekspor seluruh daftar menu, kelas, pengumuman, dan pengaturan ke file cadangan, atau pulihkan dari file sebelumnya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleBackupFileImport}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <i className="fa-solid fa-download mr-1.5"></i>Ekspor Cadangan JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => backupInputRef.current?.click()}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <i className="fa-solid fa-upload mr-1.5"></i>Impor / Pulihkan JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
