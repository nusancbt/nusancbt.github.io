export type MenuColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  status?: string;
  auto_open?: string;
  auto_close?: string;
  teacher?: string;
  category?: string;
  exam_token?: string;
  open_external?: boolean;
  order?: number;
}

export type AnnouncementType = 'info' | 'warning' | 'urgent';

export interface Announcement {
  id: string | number;
  title: string;
  content: string;
  type: AnnouncementType;
  time: string;
  pinned?: boolean;
  target_class?: string;
  link_url?: string;
  link_label?: string;
  expires_at?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  description?: string;
}

export interface AppSettings {
  app_name?: string;
  app_subtitle?: string;
  school_name?: string;
  academic_year?: string;
  welcome_title?: string;
  welcome_message?: string;
  avatar_url?: string;
  running_text?: string;
  marquee_enabled?: boolean;
  admin_password?: string | number;
  admin_session_minutes?: number;
  lms_feature_status?: 'active' | 'inactive';
  calculator_enabled?: boolean;
  tasks_enabled?: boolean;
}

export interface LMSFile {
  id: string;
  name: string;
  kelas: string;
  subject?: string;
  date: string;
  url: string;
  downloadUrl: string;
  size_kb?: number;
  source_type?: 'upload' | 'link';
}

export interface StudentTask {
  id: number;
  subject: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface MenuTimeStatus {
  code: 'manual_inactive' | 'not_open_yet' | 'closed' | 'active';
  label: string;
  color: 'gray' | 'yellow' | 'red' | 'green';
  isActive: boolean;
}

export type SettingsTab = 'lms-admin' | 'menu' | 'announcement' | 'app';

export interface DatabaseState {
  menus: MenuItem[];
  announcements: Announcement[];
  classes: SchoolClass[];
  settings: AppSettings;
}

export interface PortalBackupData extends DatabaseState {
  lmsFiles: LMSFile[];
  exportedAt: string;
  version: string;
}
