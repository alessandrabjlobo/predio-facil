// Adapter to unify toast usage across the app using Sonner (compatible with shadcn API)
import * as React from "react";
import { toast as sonnerToast } from "sonner";

// Accept both shadcn-style objects and Sonner's native signature
function compatToast(arg: any, options?: any) {
  // If used like sonner: toast("message", { ...opts })
  if (typeof arg === "string" || React.isValidElement(arg)) {
    return sonnerToast(arg as any, options);
  }

  // If used like shadcn: toast({ title, description, variant })
  const { title, description, variant, ...rest } = (arg || {}) as {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
  };

  const fn: any = variant === "destructive" && (sonnerToast as any).error ? (sonnerToast as any).error : sonnerToast;
  return fn(title ?? "", { description, ...rest });
}

export const toast = compatToast as unknown as typeof sonnerToast & {
  (arg: { title?: React.ReactNode; description?: React.ReactNode; variant?: "default" | "destructive" }): string | number;
};

export function useToast() {
  return {
    toasts: [] as any[],
    toast,
    dismiss: (toastId?: string) => (sonnerToast as any).dismiss?.(toastId as any),
  };
}
