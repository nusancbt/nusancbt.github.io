import { Announcement, MenuItem, MenuTimeStatus } from '../types';

export const GRADIENTS: Record<string, string> = {
  blue: 'from-blue-600 to-blue-700',
  green: 'from-emerald-600 to-emerald-700',
  purple: 'from-indigo-600 to-violet-700',
  orange: 'from-amber-500 to-orange-600',
  red: 'from-rose-600 to-red-700',
};

export const TEXT_COLORS: Record<string, string> = {
  blue: 'text-blue-100',
  green: 'text-emerald-100',
  purple: 'text-indigo-100',
  orange: 'text-amber-100',
  red: 'text-rose-100',
};

export const ICON_BADGE_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-indigo-50 text-indigo-600',
  orange: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
};

export const MENU_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'fa-desktop', label: 'Komputer / CBT' },
  { value: 'fa-pen-to-square', label: 'Ujian / Kuis' },
  { value: 'fa-book-open', label: 'Materi / Buku' },
  { value: 'fa-video', label: 'Video / Rekaman' },
  { value: 'fa-file-pdf', label: 'Dokumen PDF' },
  { value: 'fa-globe', label: 'Portal Web' },
  { value: 'fa-chalkboard-user', label: 'Kelas Virtual' },
  { value: 'fa-flask', label: 'Praktikum / Lab' },
  { value: 'fa-calendar-days', label: 'Jadwal Sekolah' },
  { value: 'fa-clipboard-question', label: 'Latihan Soal' },
  { value: 'fa-comments', label: 'Forum Diskusi' },
  { value: 'fa-award', label: 'Hasil / Nilai' },
];

export function isValidUrl(value: string): boolean {
  try {
    if (!value || value.trim() === '') return false;
    if (!/^https?:\/\//.test(value.trim())) return false;
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function normalizeGoogleDriveLinks(rawUrl: string): {
  previewUrl: string;
  downloadUrl: string;
} {
  const trimmed = rawUrl.trim();
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const driveId = fileMatch?.[1] || openMatch?.[1];

  if (driveId && trimmed.includes('drive.google.com')) {
    return {
      previewUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
    };
  }

  return {
    previewUrl: trimmed,
    downloadUrl: trimmed,
  };
}

export function getYoutubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
    : url;
}

export function getYoutubeThumbnail(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
    : '';
}

export function sortMenus(menus: MenuItem[]): MenuItem[] {
  return [...menus].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return 0;
  });
}

export function isAnnouncementExpired(item: Announcement): boolean {
  if (!item.expires_at) return false;
  const endOfDay = new Date(`${item.expires_at}T23:59:59`).getTime();
  if (isNaN(endOfDay)) return false;
  return Date.now() > endOfDay;
}

export function sortAnnouncements(items: Announcement[]): Announcement[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    const timeA = new Date(a.time).getTime() || 0;
    const timeB = new Date(b.time).getTime() || 0;
    return timeB - timeA;
  });
}

export function getMenuTimeStatus(menu: MenuItem): MenuTimeStatus {
  const manualStatus = menu.status ? menu.status.toString().toLowerCase() : 'active';
  if (manualStatus === 'inactive') {
    return {
      code: 'manual_inactive',
      label: 'Non-Aktif',
      color: 'gray',
      isActive: false,
    };
  }

  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const timeToMinutes = (timeStr?: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  if (menu.auto_open && menu.auto_open.trim() !== '') {
    const openMins = timeToMinutes(menu.auto_open);
    if (openMins !== null && currentTotalMinutes < openMins) {
      return {
        code: 'not_open_yet',
        label: `Buka ${menu.auto_open}`,
        color: 'yellow',
        isActive: false,
      };
    }
  }

  if (menu.auto_close && menu.auto_close.trim() !== '') {
    const closeMins = timeToMinutes(menu.auto_close);
    if (closeMins !== null && currentTotalMinutes >= closeMins) {
      return {
        code: 'closed',
        label: `Tutup ${menu.auto_close}`,
        color: 'red',
        isActive: false,
      };
    }
  }

  return {
    code: 'active',
    label: 'Aktif',
    color: 'green',
    isActive: true,
  };
}

export function formatFileSize(sizeKb?: number): string {
  if (!sizeKb || sizeKb <= 0) return '';
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(sizeKb)} KB`;
}

export function timeAgo(dateParam?: string): string {
  if (!dateParam) return '';

  const date = new Date(dateParam);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return dateParam;
  }

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days < 7) return `${days} hari yang lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function evaluateMathExpression(expr: string): string {
  const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) return '0';

  const tokens = sanitized.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g);
  if (!tokens || tokens.length === 0) throw new Error('Invalid');

  const normalized: (number | string)[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (
      (t === '-' || t === '+') &&
      (i === 0 || typeof normalized[normalized.length - 1] === 'string')
    ) {
      const next = tokens[i + 1];
      if (next !== undefined && !isNaN(Number(next))) {
        normalized.push(Number(t + next));
        i++;
        continue;
      }
    }
    if (!isNaN(Number(t))) {
      normalized.push(Number(t));
    } else {
      normalized.push(t);
    }
  }

  const pass1: (number | string)[] = [];
  let idx = 0;
  while (idx < normalized.length) {
    const item = normalized[idx];
    if (item === '*' || item === '/') {
      const prev = pass1.pop();
      const next = normalized[idx + 1];
      if (typeof prev !== 'number' || typeof next !== 'number') {
        throw new Error('Syntax error');
      }
      if (item === '/' && next === 0) {
        throw new Error('Divide by zero');
      }
      pass1.push(item === '*' ? prev * next : prev / next);
      idx += 2;
    } else {
      pass1.push(item);
      idx++;
    }
  }

  let result = pass1[0];
  if (typeof result !== 'number') throw new Error('Syntax error');
  idx = 1;
  while (idx < pass1.length) {
    const op = pass1[idx];
    const next = pass1[idx + 1];
    if ((op !== '+' && op !== '-') || typeof next !== 'number') {
      throw new Error('Syntax error');
    }
    result = op === '+' ? result + next : result - next;
    idx += 2;
  }

  if (!isFinite(result) || isNaN(result)) throw new Error('Math error');
  return String(Math.round(result * 1e10) / 1e10);
}
