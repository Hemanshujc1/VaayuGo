import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ConfirmDialog = ({
  title,
  message,
  confirmText,
  cancelText,
  type,
  onConfirm,
  onCancel,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = (callback) => {
    setIsVisible(false);
    setTimeout(callback, 300); // Wait for transition
  };

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "⚠️",
          button: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
          accent: "border-red-500/50",
          text: "text-red-400",
        };
      case "info":
        return {
          icon: "ℹ️",
          button: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
          accent: "border-blue-500/50",
          text: "text-blue-400",
        };
      default: // warning
        return {
          icon: "🔸",
          button: "bg-accent hover:bg-secondary shadow-accent/20",
          accent: "border-accent/50",
          text: "text-accent",
        };
    }
  };

  const styles = getTypeStyles();

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop with extreme blur for premium feel */}
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-md"
        onClick={() => handleClose(onCancel)}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md bg-neutral-dark/80 backdrop-blur-xl border ${styles.accent} rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header Accents */}
        <div
          className={`h-1 w-full bg-linear-to-r from-transparent via-${type === "danger" ? "red-500" : "accent"} to-transparent opacity-50`}
        />

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl bg-neutral-mid/30 flex items-center justify-center text-2xl border border-white/5`}
            >
              {styles.icon}
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {title}
            </h3>
          </div>

          <p className="text-neutral-light leading-relaxed">{message}</p>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => handleClose(onCancel)}
              className="flex-1 px-6 py-3 rounded-xl border border-neutral-mid text-neutral-light font-bold hover:bg-neutral-mid/30 hover:text-white transition-all duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={() => handleClose(onConfirm)}
              className={`flex-1 px-6 py-3 rounded-xl ${styles.button} text-primary font-extrabold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 -m-12 w-24 h-24 bg-accent opacity-5 blur-3xl rounded-full" />
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialog;
