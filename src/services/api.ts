import {
  Announcement,
  AppSettings,
  DatabaseState,
  LMSFile,
  MenuItem,
  PortalBackupData,
  SchoolClass,
} from '../types';
import { normalizeGoogleDriveLinks } from '../utils/helpers';

const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx7JrypP6bBFdc7Uuq9GogxMMlsBlq0HXOsLyTWAcHCtmO1wQTAYe22Wzqj-9h98373/exec';

export const GOOGLE_SCRIPT_URL =
  import.meta.env.VITE_GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;

const DB_CACHE_KEY = 'nusancbt_db_cache';
const LMS_CACHE_KEY = 'nusancbt_lms_cache';
const EXT_META_KEY = 'nusancbt_extended_meta';

interface ExtendedMetaStore {
  menuMeta: Record<string, Partial<MenuItem>>;
  annMeta: Record<string, Partial<Announcement>>;
  lmsMeta: Record<string, Partial<LMSFile>>;
  externalLmsItems: LMSFile[];
  extraSettings: Partial<AppSettings>;
}

const DEFAULT_DB_STATE: DatabaseState = {
  menus: [],
  announcements: [],
  classes: [],
  settings: {
    app_name: 'NusanCBT',
    app_subtitle: 'Dashboard Siswa',
    lms_feature_status: 'active',
    marquee_enabled: true,
    calculator_enabled: true,
    tasks_enabled: true,
    admin_session_minutes: 15,
  },
};

function readExtMeta(): ExtendedMetaStore {
  try {
    const raw = localStorage.getItem(EXT_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        menuMeta: parsed.menuMeta || {},
        annMeta: parsed.annMeta || {},
        lmsMeta: parsed.lmsMeta || {},
        externalLmsItems: parsed.externalLmsItems || [],
        extraSettings: parsed.extraSettings || {},
      };
    }
  } catch {
    // ignore
  }
  return {
    menuMeta: {},
    annMeta: {},
    lmsMeta: {},
    externalLmsItems: [],
    extraSettings: {},
  };
}

function writeExtMeta(meta: ExtendedMetaStore): void {
  try {
    localStorage.setItem(EXT_META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function mergeExtendedDbState(rawState: DatabaseState): DatabaseState {
  const ext = readExtMeta();
  const menus = (rawState.menus || []).map((m) => ({
    ...m,
    ...(ext.menuMeta[m.id] || {}),
  }));
  const announcements = (rawState.announcements || []).map((a) => ({
    ...a,
    ...(ext.annMeta[String(a.id)] || {}),
  }));
  const settings: AppSettings = {
    ...DEFAULT_DB_STATE.settings,
    ...ext.extraSettings,
    ...(rawState.settings || {}),
    // Preserve extended boolean/number settings if remote spreadsheet omits them
    school_name: rawState.settings?.school_name ?? ext.extraSettings.school_name,
    academic_year: rawState.settings?.academic_year ?? ext.extraSettings.academic_year,
    welcome_title: rawState.settings?.welcome_title ?? ext.extraSettings.welcome_title,
    welcome_message:
      rawState.settings?.welcome_message ?? ext.extraSettings.welcome_message,
    avatar_url: rawState.settings?.avatar_url ?? ext.extraSettings.avatar_url,
    marquee_enabled:
      rawState.settings?.marquee_enabled ?? ext.extraSettings.marquee_enabled ?? true,
    calculator_enabled:
      rawState.settings?.calculator_enabled ??
      ext.extraSettings.calculator_enabled ??
      true,
    tasks_enabled:
      rawState.settings?.tasks_enabled ?? ext.extraSettings.tasks_enabled ?? true,
    admin_session_minutes:
      rawState.settings?.admin_session_minutes ??
      ext.extraSettings.admin_session_minutes ??
      15,
  };

  return {
    menus,
    announcements,
    classes: rawState.classes || [],
    settings,
  };
}

function mergeExtendedLms(remoteFiles: LMSFile[]): LMSFile[] {
  const ext = readExtMeta();
  const remoteIds = new Set(remoteFiles.map((f) => f.id));
  const enrichedRemote = remoteFiles.map((f) => ({
    ...f,
    source_type: f.source_type || ('upload' as const),
    ...(ext.lmsMeta[f.id] || {}),
  }));
  const localExtras = ext.externalLmsItems
    .filter((f) => !remoteIds.has(f.id))
    .map((f) => ({
      ...f,
      ...(ext.lmsMeta[f.id] || {}),
    }));

  return [...localExtras, ...enrichedRemote];
}

function readCachedDb(): DatabaseState {
  try {
    const raw = localStorage.getItem(DB_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeExtendedDbState({
        menus: parsed.menus || [],
        announcements: parsed.announcements || [],
        classes: parsed.classes || [],
        settings: parsed.settings || DEFAULT_DB_STATE.settings,
      });
    }
  } catch {
    // ignore storage errors
  }
  return mergeExtendedDbState(DEFAULT_DB_STATE);
}

function writeCachedDb(state: DatabaseState): void {
  try {
    localStorage.setItem(DB_CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function readCachedLms(): LMSFile[] {
  try {
    const raw = localStorage.getItem(LMS_CACHE_KEY);
    if (raw) {
      return mergeExtendedLms(JSON.parse(raw) || []);
    }
  } catch {
    // ignore
  }
  return mergeExtendedLms([]);
}

function writeCachedLms(files: LMSFile[]): void {
  try {
    localStorage.setItem(LMS_CACHE_KEY, JSON.stringify(files));
  } catch {
    // ignore
  }
}

function recordExtendedMutation(
  action: string,
  payload: Record<string, unknown>
): void {
  const ext = readExtMeta();

  if (action === 'saveMenu' && payload.data) {
    const item = payload.data as MenuItem;
    ext.menuMeta[item.id] = {
      category: item.category,
      exam_token: item.exam_token,
      open_external: item.open_external,
      order: item.order,
      teacher: item.teacher,
    };
  } else if (action === 'deleteMenu' && payload.id) {
    delete ext.menuMeta[String(payload.id)];
  } else if (action === 'saveAnnouncement' && payload.data) {
    const item = payload.data as Announcement;
    ext.annMeta[String(item.id)] = {
      pinned: item.pinned,
      target_class: item.target_class,
      link_url: item.link_url,
      link_label: item.link_label,
      expires_at: item.expires_at,
    };
  } else if (action === 'deleteAnnouncement' && payload.id !== undefined) {
    delete ext.annMeta[String(payload.id)];
  } else if (action === 'saveSettings' && payload.data) {
    const s = payload.data as AppSettings;
    ext.extraSettings = {
      ...ext.extraSettings,
      ...s,
    };
  }

  writeExtMeta(ext);
}

export async function fetchFromDatabaseApi(): Promise<DatabaseState> {
  try {
    const response = await fetch(
      `${GOOGLE_SCRIPT_URL}?action=read&t=${Date.now()}`
    );
    const data = await response.json();
    if (data && data.status === 'success') {
      const nextState = mergeExtendedDbState({
        menus: data.menus || [],
        announcements: data.announcements || [],
        classes: data.classes || [],
        settings: data.settings || {},
      });
      writeCachedDb(nextState);
      return nextState;
    }
  } catch (error) {
    console.error('Error fetching data from Google Script, using cache:', error);
  }
  return readCachedDb();
}

export async function fetchLMSLibraryApi(): Promise<LMSFile[]> {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getLMSLibrary' }),
    });
    const result = await response.json();
    if (result && result.status === 'success' && Array.isArray(result.data)) {
      writeCachedLms(result.data);
      return mergeExtendedLms(result.data);
    }
  } catch (error) {
    console.error('Error fetching LMS library, using cache:', error);
  }
  return readCachedLms();
}

export async function sendDatabaseActionApi(
  action: string,
  payload: Record<string, unknown>
): Promise<DatabaseState> {
  recordExtendedMutation(action, payload);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (data && data.status === 'success') {
      const current = readCachedDb();
      const updated = mergeExtendedDbState({
        menus: data.menus ?? current.menus,
        announcements: data.announcements ?? current.announcements,
        classes: data.classes ?? current.classes,
        settings: data.settings ?? current.settings,
      });
      writeCachedDb(updated);
      return updated;
    }
    throw new Error(data?.message || 'Gagal menyimpan');
  } catch (error) {
    if (error instanceof TypeError) {
      const current = readCachedDb();
      const updated = mergeExtendedDbState(
        applyLocalMutation(current, action, payload)
      );
      writeCachedDb(updated);
      return updated;
    }
    throw error;
  }
}

export async function reorderMenusApi(orderedMenus: MenuItem[]): Promise<DatabaseState> {
  const ext = readExtMeta();
  orderedMenus.forEach((m, index) => {
    ext.menuMeta[m.id] = {
      ...(ext.menuMeta[m.id] || {}),
      order: index,
    };
  });
  writeExtMeta(ext);

  const current = readCachedDb();
  const updated: DatabaseState = {
    ...current,
    menus: orderedMenus.map((m, index) => ({ ...m, order: index })),
  };
  writeCachedDb(updated);
  return updated;
}

export async function renameClassApi(
  classId: string,
  oldName: string,
  newName: string
): Promise<DatabaseState> {
  // Update class via delete + save or saveClass overwrite
  const updatedCls: SchoolClass = {
    id: classId,
    name: newName,
    description: `Kelas ${newName}`,
  };

  // Cascade class name in local LMS metadata
  const ext = readExtMeta();
  Object.keys(ext.lmsMeta).forEach((fid) => {
    if (ext.lmsMeta[fid]?.kelas === oldName) {
      ext.lmsMeta[fid].kelas = newName;
    }
  });
  ext.externalLmsItems = ext.externalLmsItems.map((item) =>
    item.kelas === oldName ? { ...item, kelas: newName } : item
  );
  writeExtMeta(ext);

  const cachedFiles = readCachedLms().map((f) =>
    f.kelas === oldName ? { ...f, kelas: newName } : f
  );
  writeCachedLms(cachedFiles);

  try {
    await sendDatabaseActionApi('deleteClass', { id: classId });
  } catch {
    // ignore if backend does not find old id
  }
  return sendDatabaseActionApi('saveClass', { data: updatedCls });
}

function applyLocalMutation(
  state: DatabaseState,
  action: string,
  payload: Record<string, unknown>
): DatabaseState {
  const next: DatabaseState = {
    menus: [...state.menus],
    announcements: [...state.announcements],
    classes: [...state.classes],
    settings: { ...state.settings },
  };

  if (action === 'saveMenu' && payload.data) {
    const item = payload.data as MenuItem;
    const idx = next.menus.findIndex((m) => m.id === item.id);
    if (idx >= 0) next.menus[idx] = item;
    else next.menus.push(item);
  } else if (action === 'deleteMenu' && payload.id) {
    next.menus = next.menus.filter((m) => m.id !== payload.id);
  } else if (action === 'saveAnnouncement' && payload.data) {
    const item = payload.data as Announcement;
    const idx = next.announcements.findIndex((a) => String(a.id) === String(item.id));
    if (idx >= 0) next.announcements[idx] = item;
    else next.announcements.unshift(item);
  } else if (action === 'deleteAnnouncement' && payload.id !== undefined) {
    next.announcements = next.announcements.filter(
      (a) => String(a.id) !== String(payload.id)
    );
  } else if (action === 'saveClass' && payload.data) {
    const item = payload.data as SchoolClass;
    const idx = next.classes.findIndex((c) => c.id === item.id);
    if (idx >= 0) next.classes[idx] = item;
    else next.classes.push(item);
  } else if (action === 'deleteClass' && payload.id) {
    next.classes = next.classes.filter((c) => c.id !== payload.id);
  } else if (action === 'saveSettings' && payload.data) {
    next.settings = { ...next.settings, ...(payload.data as AppSettings) };
  }

  return next;
}

export async function uploadLMSFileApi(params: {
  fileData: string;
  fileName: string;
  mimeType: string;
  kelas: string;
  subject?: string;
  sizeKb?: number;
}): Promise<void> {
  const ext = readExtMeta();

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadLMSFile',
        fileData: params.fileData,
        fileName: params.fileName,
        mimeType: params.mimeType,
        kelas: params.kelas,
      }),
    });
    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Gagal mengupload file');
    }
    if (result.id || result.fileId) {
      const fid = String(result.id || result.fileId);
      ext.lmsMeta[fid] = {
        subject: params.subject,
        size_kb: params.sizeKb,
        source_type: 'upload',
      };
      writeExtMeta(ext);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      const files = readCachedLms();
      const dataUrl = `data:${params.mimeType};base64,${params.fileData}`;
      const newId = `file_${Date.now()}`;
      const item: LMSFile = {
        id: newId,
        name: params.fileName,
        kelas: params.kelas,
        subject: params.subject,
        date: new Date().toISOString(),
        url: dataUrl,
        downloadUrl: dataUrl,
        size_kb: params.sizeKb,
        source_type: 'upload',
      };
      ext.lmsMeta[newId] = {
        subject: params.subject,
        size_kb: params.sizeKb,
        source_type: 'upload',
      };
      writeExtMeta(ext);
      writeCachedLms([item, ...files]);
      return;
    }
    throw error;
  }
}

export async function addExternalLMSLinkApi(params: {
  title: string;
  url: string;
  kelas: string;
  subject?: string;
}): Promise<LMSFile[]> {
  const { previewUrl, downloadUrl } = normalizeGoogleDriveLinks(params.url);
  const newItem: LMSFile = {
    id: `link_${Date.now()}`,
    name: params.title.trim(),
    kelas: params.kelas,
    subject: params.subject?.trim() || undefined,
    date: new Date().toISOString(),
    url: previewUrl,
    downloadUrl,
    source_type: 'link',
  };

  const ext = readExtMeta();
  ext.externalLmsItems = [newItem, ...ext.externalLmsItems];
  writeExtMeta(ext);

  return readCachedLms();
}

export async function updateLMSFileDetailsApi(params: {
  id: string;
  newName: string;
  kelas: string;
  subject?: string;
}): Promise<void> {
  const ext = readExtMeta();
  const isExternalLink = ext.externalLmsItems.some((item) => item.id === params.id);

  const finalName =
    isExternalLink || params.newName.toLowerCase().endsWith('.pdf')
      ? params.newName
      : `${params.newName}.pdf`;

  ext.lmsMeta[params.id] = {
    ...(ext.lmsMeta[params.id] || {}),
    name: finalName,
    kelas: params.kelas,
    subject: params.subject?.trim() || undefined,
  };

  if (isExternalLink) {
    ext.externalLmsItems = ext.externalLmsItems.map((item) =>
      item.id === params.id
        ? {
            ...item,
            name: finalName,
            kelas: params.kelas,
            subject: params.subject?.trim() || undefined,
          }
        : item
    );
    writeExtMeta(ext);
    return;
  }

  writeExtMeta(ext);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'renameLMSFile',
        id: params.id,
        newName: params.newName,
      }),
    });
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'Gagal mengubah nama file');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      const files = readCachedLms().map((f) =>
        f.id === params.id
          ? {
              ...f,
              name: finalName,
              kelas: params.kelas,
              subject: params.subject?.trim() || undefined,
            }
          : f
      );
      writeCachedLms(files);
      return;
    }
    throw error;
  }
}

export async function deleteLMSFileApi(id: string): Promise<void> {
  const ext = readExtMeta();
  const wasExternal = ext.externalLmsItems.some((i) => i.id === id);
  ext.externalLmsItems = ext.externalLmsItems.filter((i) => i.id !== id);
  delete ext.lmsMeta[id];
  writeExtMeta(ext);

  if (wasExternal) {
    const files = readCachedLms().filter((f) => f.id !== id);
    writeCachedLms(files);
    return;
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteLMSFile', id }),
    });
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'Gagal menghapus file');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      const files = readCachedLms().filter((f) => f.id !== id);
      writeCachedLms(files);
      return;
    }
    throw error;
  }
}

export function exportPortalBackup(
  dbState: DatabaseState,
  lmsFiles: LMSFile[]
): PortalBackupData {
  return {
    menus: dbState.menus,
    announcements: dbState.announcements,
    classes: dbState.classes,
    settings: dbState.settings,
    lmsFiles,
    exportedAt: new Date().toISOString(),
    version: '2.0',
  };
}

export function importPortalBackupLocal(backup: PortalBackupData): {
  dbState: DatabaseState;
  lmsFiles: LMSFile[];
} {
  const ext = readExtMeta();

  (backup.menus || []).forEach((m) => {
    ext.menuMeta[m.id] = {
      category: m.category,
      exam_token: m.exam_token,
      open_external: m.open_external,
      order: m.order,
      teacher: m.teacher,
    };
  });

  (backup.announcements || []).forEach((a) => {
    ext.annMeta[String(a.id)] = {
      pinned: a.pinned,
      target_class: a.target_class,
      link_url: a.link_url,
      link_label: a.link_label,
      expires_at: a.expires_at,
    };
  });

  ext.extraSettings = {
    ...ext.extraSettings,
    ...(backup.settings || {}),
  };

  if (Array.isArray(backup.lmsFiles)) {
    const linkItems = backup.lmsFiles.filter((f) => f.source_type === 'link');
    ext.externalLmsItems = linkItems;
    backup.lmsFiles.forEach((f) => {
      ext.lmsMeta[f.id] = {
        kelas: f.kelas,
        subject: f.subject,
        size_kb: f.size_kb,
        source_type: f.source_type,
      };
    });
    writeCachedLms(backup.lmsFiles);
  }

  writeExtMeta(ext);

  const dbState = mergeExtendedDbState({
    menus: backup.menus || [],
    announcements: backup.announcements || [],
    classes: backup.classes || [],
    settings: backup.settings || {},
  });
  writeCachedDb(dbState);

  return {
    dbState,
    lmsFiles: readCachedLms(),
  };
}

export async function fetchVisitorCountApi(): Promise<string> {
  try {
    const namespace = 'nusancbt_sekolah_app_1';
    const key = 'visits';
    let url = `https://api.counterapi.dev/v1/${namespace}/${key}`;

    if (!sessionStorage.getItem('has_visited')) {
      url += '/up';
      sessionStorage.setItem('has_visited', 'true');
    }

    const response = await fetch(url);
    const data = await response.json();
    if (typeof data?.count === 'number') {
      return data.count.toLocaleString('id-ID');
    }
    throw new Error('Invalid counter response');
  } catch {
    let localCount = Number(localStorage.getItem('local_visitor_count') || 1205);
    if (!sessionStorage.getItem('has_visited_local')) {
      localCount += 1;
      localStorage.setItem('local_visitor_count', String(localCount));
      sessionStorage.setItem('has_visited_local', 'true');
    }
    return localCount.toLocaleString('id-ID');
  }
}
