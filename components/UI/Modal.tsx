import React, { useEffect, useRef, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Se true, clicar no backdrop escuro fecha o modal. Padrão: false. */
  closeOnBackdrop?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, closeOnBackdrop = false }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [wasOpenBeforeBlur, setWasOpenBeforeBlur] = useState(false);

  // Trava scroll do body enquanto modal aberto
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ESC fecha
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Bloqueia fechamento ao trocar de guia ou alt+tab
  useEffect(() => {
    if (!isOpen) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Janela voltou a ser visível, não fecha o modal
        setWasOpenBeforeBlur(false);
      } else {
        // Janela perdeu foco, guarda estado
        setWasOpenBeforeBlur(true);
      }
    };

    const handleWindowBlur = () => {
      // Guarda que o modal estava aberto antes do blur
      if (isOpen) setWasOpenBeforeBlur(true);
    };

    const handleWindowFocus = () => {
      // Se o modal estava aberto antes do blur, mantém aberto
      if (wasOpenBeforeBlur) setWasOpenBeforeBlur(false);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, wasOpenBeforeBlur]);

  // Backdrop click — só ativa quando closeOnBackdrop=true
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className="bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-2xl mx-2 sm:mx-4 p-4 sm:p-6 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-700/50 pb-3 mb-4 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg p-1 transition-all duration-200 text-2xl font-bold leading-none"
            aria-label="Fechar modal"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto pr-2 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
