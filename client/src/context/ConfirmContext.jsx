import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import ConfirmDialog from "../components/shared/common/ConfirmDialog";

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};

export const ConfirmProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    // If options is a string, treat it as the message
    const configOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: configOptions.title || "Are you sure?",
        message: configOptions.message || "",
        confirmText: configOptions.confirmText || "Confirm",
        cancelText: configOptions.cancelText || "Cancel",
        type: configOptions.type || "warning", // 'warning', 'danger', 'info'
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
    }
    setConfig(null);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    setConfig(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {config && (
        <ConfirmDialog
          {...config}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};
