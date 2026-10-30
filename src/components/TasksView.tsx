import React, { useMemo, useState } from 'react';
import { StudentTask } from '../types';

interface TasksViewProps {
  tasks: StudentTask[];
  onAddTask: (subject: string, title: string, date: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onClearCompleted: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}) => {
  const [subject, setSubject] = useState('Umum');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.completed ? 1 : -1;
    });
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onAddTask(subject, title.trim(), date);
    setSubject('Umum');
    setTitle('');
    setDate('');
  };

  const todayMidnight = new Date().setHours(0, 0, 0, 0);

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 bg-slate-50 custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 sticky top-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-blue-600"></i> Catat Tugas
                Baru
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="Umum">Umum</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="IPA/Sains">IPA/Sains</option>
                    <option value="Kejuruan">Produktif/Kejuruan</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Judul Tugas
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Cth: PR Halaman 52"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <i className="fa-solid fa-plus mr-1"></i> Tambah ke Agenda
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Statistik Tugas
                </h4>
                <div className="flex justify-between text-sm mb-1">
                  <span>Selesai</span>
                  <span className="font-bold text-green-600">{completedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Belum Selesai</span>
                  <span className="font-bold text-orange-500">{pendingCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Daftar Agenda & PR</h3>
              <button
                onClick={onClearCompleted}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Hapus yang selesai
              </button>
            </div>

            <div className="space-y-3">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                  <i className="fa-solid fa-clipboard-check text-4xl mb-3 opacity-50"></i>
                  <p>Belum ada tugas dicatat.</p>
                </div>
              ) : (
                sortedTasks.map((task) => {
                  const isLate =
                    new Date(task.date).getTime() < todayMidnight && !task.completed;

                  let subjectColor = 'bg-gray-100 text-gray-600';
                  if (task.subject === 'Matematika') {
                    subjectColor = 'bg-blue-100 text-blue-600';
                  } else if (task.subject === 'Bahasa Indonesia') {
                    subjectColor = 'bg-yellow-100 text-yellow-700';
                  } else if (task.subject === 'IPA/Sains') {
                    subjectColor = 'bg-green-100 text-green-600';
                  }

                  return (
                    <div
                      key={task.id}
                      className={`transition-all duration-200 hover:-translate-y-0.5 ${
                        task.completed ? 'opacity-60 bg-gray-50' : 'bg-white'
                      } p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 text-transparent hover:border-green-500'
                          } flex items-center justify-center transition-colors`}
                        >
                          <i className="fa-solid fa-check text-xs"></i>
                        </button>
                        <div className="min-w-0">
                          <h4
                            className={`font-bold text-sm truncate ${
                              task.completed
                                ? 'line-through text-gray-400'
                                : 'text-gray-800'
                            }`}
                          >
                            {task.title}
                            {isLate && (
                              <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 no-underline inline-block">
                                Terlambat
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${subjectColor}`}
                            >
                              {task.subject}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center">
                              <i className="fa-regular fa-calendar mr-1"></i>
                              {new Date(task.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
