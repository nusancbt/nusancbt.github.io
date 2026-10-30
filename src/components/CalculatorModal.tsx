import React, { useState } from 'react';
import { evaluateMathExpression } from '../utils/helpers';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');

  if (!isOpen) return null;

  const append = (val: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  const clear = () => {
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const res = evaluateMathExpression(display);
      setDisplay(res);
    } catch {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1000);
    }
  };

  const btnBase = 'transition-transform active:scale-95 text-white p-2 rounded-lg font-bold';

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-fade-in">
      <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl w-64 border border-slate-700">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <span className="text-white text-xs font-bold tracking-wider">KALKULATOR</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <input
          type="text"
          readOnly
          value={display}
          className="w-full bg-slate-800 text-white text-right text-2xl p-3 rounded-lg mb-3 font-mono outline-none border border-slate-700"
        />

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={clear}
            className={`${btnBase} col-span-2 bg-red-500 hover:bg-red-600`}
          >
            AC
          </button>
          <button
            onClick={() => append('/')}
            className={`${btnBase} bg-slate-700 hover:bg-slate-600`}
          >
            ÷
          </button>
          <button
            onClick={() => append('*')}
            className={`${btnBase} bg-slate-700 hover:bg-slate-600`}
          >
            ×
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => append(n)}
              className={`${btnBase} bg-slate-800 hover:bg-slate-700`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => append('-')}
            className={`${btnBase} bg-slate-700 hover:bg-slate-600`}
          >
            -
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              onClick={() => append(n)}
              className={`${btnBase} bg-slate-800 hover:bg-slate-700`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => append('+')}
            className={`${btnBase} bg-slate-700 hover:bg-slate-600`}
          >
            +
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              onClick={() => append(n)}
              className={`${btnBase} bg-slate-800 hover:bg-slate-700`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={calculate}
            className={`${btnBase} row-span-2 bg-blue-600 hover:bg-blue-700`}
          >
            =
          </button>

          <button
            onClick={() => append('0')}
            className={`${btnBase} col-span-2 bg-slate-800 hover:bg-slate-700`}
          >
            0
          </button>
          <button
            onClick={() => append('.')}
            className={`${btnBase} bg-slate-800 hover:bg-slate-700`}
          >
            .
          </button>
        </div>
      </div>
    </div>
  );
};
