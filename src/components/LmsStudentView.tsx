import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { LMSFile, SchoolClass } from '../types';
import { formatFileSize, isValidUrl } from '../utils/helpers';

interface LmsStudentViewProps {
  files: LMSFile[];
  classes: SchoolClass[];
  isLoading: boolean;
  onOpenPreview: (url: string, title: string) => void;
}

export const LmsStudentView: React.FC<LmsStudentViewProps> = ({
  files,
  classes,
  isLoading,
  onOpenPreview,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const availableCategories = useMemo(() => {
    const classNames = classes.map((c) => c.name);
    const fileClasses = files
      .map((f) => f.kelas)
      .filter((k) => k && !classNames.includes(k));
    return ['Semua', ...classNames, ...Array.from(new Set(fileClasses))];
  }, [classes, files]);

  const filteredFiles = useMemo(() => {
    return files.filter((item) => {
      const matchClass =
        selectedCategory === 'Semua' || item.kelas === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q) ||
        (item.kelas || '').toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [files, selectedCategory, searchQuery]);

  const handleRead = (url: string, name: string) => {
    const valid = isValidUrl(url) || url.startsWith('data:application/pdf');
    if (!valid) {
      Swal.fire({
        icon: 'error',
        title: 'Tautan Tidak Valid',
        text: 'File materi ini tidak memiliki alamat URL yang dapat dibuka.',
      });
      return;
    }
    onOpenPreview(url, name);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-slate-50 custom-scrollbar animate-fade-in">
      <div className="max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-xl border border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Perpustakaan Digital
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Akses modul pembelajaran, PDF, dan E-Book sekolah.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul materi atau mapel..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div className="space-y-5">
          {/* Interactive Class Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg w-fit max-w-full">
            {availableCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {isLoading && files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div
                className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
                role="status"
                aria-label="loading"
              />
              <p className="mt-3 text-slate-500 text-sm">
                Sedang memuat materi perpustakaan...
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">
              <i className="fa-solid fa-folder-open text-3xl mb-2"></i>
              <p className="text-sm text-slate-600 font-medium">
                Tidak ada materi yang sesuai pencarian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFiles.map((item) => {
                const sizeText = formatFileSize(item.size_kb);
                const dateText = item.date
                  ? new Date(item.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-blue-600">
                          {item.kelas}
                        </span>
                        {item.subject && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.subject}</span>
                          </>
                        )}
                        {dateText && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{dateText}</span>
                          </>
                        )}
                        {sizeText && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{sizeText}</span>
                          </>
                        )}
                      </div>

                      <h3
                        className="font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors text-base"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleRead(item.url, item.name)}
                        className="flex-1 bg-slate-900 text-white text-xs py-2.5 px-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-book-open-reader"></i> Baca Materi
                      </button>
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={item.name}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
                        title="Unduh Materi"
                      >
                        <i className="fa-solid fa-download text-xs"></i>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
