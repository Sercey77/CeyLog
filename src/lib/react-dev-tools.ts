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

export function initializeReactDevTools() {
  if (typeof window === 'undefined') return;

  // Initialize the hook if it doesn't exist
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      inject: () => {},
      supportsFiber: true,
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
      onScheduleFiberRoot: () => {},
    };
  }

  // Safely wrap the inject function
  const originalInject = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = (renderer) => {
    try {
      if (typeof originalInject === 'function') {
        originalInject(renderer);
      }
    } catch (error) {
      console.warn('Error injecting React DevTools:', error);
    }
  };
} 