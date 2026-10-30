import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { LMSFile, MenuItem, SchoolClass } from '../types';

interface PasswordModalProps {
  isOpen: boolean;
  validPassword: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  validPassword,
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPass(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === validPassword) {
      setPassword('');
      onSuccess();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Password admin/guru tidak sesuai.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
            <i className="fa-solid fa-lock text-xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Akses Terbatas</h3>
          <p className="text-sm text-slate-500 mt-1">
            Masukkan password admin atau guru.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono tracking-widest text-lg"
              placeholder="••••••"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title={showPass ? 'Sembunyikan' : 'Tampilkan'}
            >
              <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ExamTokenModalProps {
  menuItem: MenuItem | null;
  onSuccess: (menuItem: MenuItem) => void;
  onClose: () => void;
}

export const ExamTokenModal: React.FC<ExamTokenModalProps> = ({
  menuItem,
  onSuccess,
  onClose,
}) => {
  const [token, setToken] = useState('');

  useEffect(() => {
    if (menuItem) setToken('');
  }, [menuItem]);

  if (!menuItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = (menuItem.exam_token || '').trim().toUpperCase();
    if (token.trim().toUpperCase() === expected) {
      setToken('');
      onSuccess(menuItem);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Token Tidak Valid',
        text: 'Periksa kembali token ujian dari pengawas/guru.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in border border-slate-200">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
            <i className="fa-solid fa-key text-xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Token Akses Materi/Ujian</h3>
          <p className="text-xs text-slate-500 mt-1 truncate">{menuItem.title}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono uppercase tracking-widest text-lg font-bold"
              placeholder="MASUKKAN TOKEN"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Buka Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditLmsFileModalProps {
  file: LMSFile | null;
  classes: SchoolClass[];
  onConfirm: (params: {
    id: string;
    newName: string;
    kelas: string;
    subject?: string;
  }) => void;
  onClose: () => void;
}

export const EditLmsFileModal: React.FC<EditLmsFileModalProps> = ({
  file,
  classes,
  onConfirm,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (file) {
      setName(file.name.replace(/\.pdf$/i, ''));
      setKelas(file.kelas || '');
      setSubject(file.subject || '');
    }
  }, [file]);

  if (!file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm({
      id: file.id,
      newName: trimmed,
      kelas: kelas || file.kelas,
      subject: subject.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Edit Detail Materi Pustaka
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Judul / Nama File
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
            {file.source_type !== 'link' && (
              <p className="text-xs text-slate-400 mt-1">
                Ekstensi .pdf akan disesuaikan secara otomatis.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kelas Tujuan
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                {!classes.some((c) => c.name === kelas) && kelas && (
                  <option value={kelas}>{kelas}</option>
                )}
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Cth: Matematika"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PdfViewerModalProps {
  previewFile: { url: string; title: string } | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  previewFile,
  onClose,
}) => {
  if (!previewFile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-4 md:inset-10 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold truncate pr-4 text-slate-800 text-sm md:text-base">
            {previewFile.title || 'Pratinjau Materi'}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={previewFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <i className="fa-solid fa-up-right-from-square mr-1.5"></i>Tab Baru
            </a>
            <button
              onClick={onClose}
              className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <iframe
          src={previewFile.url}
          title={previewFile.title}
          className="flex-grow w-full h-full bg-slate-100 border-0"
        />
      </div>
    </div>
  );
};
