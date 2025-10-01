// This file provides TypeScript definitions for the Midtrans Snap.js library,
// which is loaded externally. It ensures that TypeScript understands the
// `window.snap` object and its methods, enabling type safety and autocompletion.

interface Snap {
  pay: (
    token: string,
    options?: {
      onSuccess?: (result: any) => void;
      onPending?: (result: any) => void;
      onError?: (result: any) => void;
      onClose?: () => void;
    }
  ) => void;
}

// By declaring this on the global Window interface, we can access `window.snap`
// from anywhere in our client-side code in a type-safe manner.
interface Window {
  snap: Snap;
}
