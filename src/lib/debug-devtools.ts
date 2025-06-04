declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      inject: (renderer: any) => void;
      supportsFiber: boolean;
      onCommitFiberRoot: (id: number, root: any) => void;
      onCommitFiberUnmount: (id: number, fiber: any) => void;
      onScheduleFiberRoot: (id: number, root: any) => void;
    };
  }
}

export function patchReactDevTools() {
  if (typeof window !== "undefined") {
    if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        inject: () => {},
        supportsFiber: true,
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
        onScheduleFiberRoot: () => {},
      };
      console.warn("⚠️ Dummy React DevTools hook injected.");
    }
  }
} 