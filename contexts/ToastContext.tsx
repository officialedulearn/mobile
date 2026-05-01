import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import Toast, { type ToastType } from "@/components/common/Toast";

export type ToastShowOptions = {
  type: ToastType;
  message: string;
  duration?: number;
};

type ShowToastFn = {
  (type: ToastType, message: string, duration?: number): void;
  (options: ToastShowOptions): void;
};

type ToastContextValue = {
  show: ShowToastFn;
  hide: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [renderPayload, setRenderPayload] = useState<
    Required<ToastShowOptions>
  >({
    type: "info",
    message: "",
    duration: 3000,
  });

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const show = useCallback<ShowToastFn>(
    (
      typeOrOpts: ToastType | ToastShowOptions,
      message?: string,
      duration?: number,
    ) => {
      const next: Required<ToastShowOptions> =
        typeof message === "string"
          ? {
              type: typeOrOpts as ToastType,
              message,
              duration: duration ?? 3000,
            }
          : {
              type: (typeOrOpts as ToastShowOptions).type,
              message: (typeOrOpts as ToastShowOptions).message,
              duration: (typeOrOpts as ToastShowOptions).duration ?? 3000,
            };
      setRenderPayload(next);
      setToastKey((k) => k + 1);
      setVisible(true);
    },
    [],
  );

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <View style={{ flex: 1 }}>
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      <Toast
        duration={renderPayload.duration}
        key={toastKey}
        message={renderPayload.message}
        onDismiss={hide}
        type={renderPayload.type}
        visible={visible}
      />
    </View>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
