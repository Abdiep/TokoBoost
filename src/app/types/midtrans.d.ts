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
  
  interface Window {
    snap: Snap;
  }