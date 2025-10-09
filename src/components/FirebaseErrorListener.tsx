'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

// This is a client-side component that listens for Firestore permission errors
// and throws them to be caught by the Next.js development error overlay.
// This provides a much better debugging experience than just logging to the console.
export default function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Throw the error so that the Next.js error overlay will show it.
      // This is only for development, and will not crash production.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, you might want to log this to a service like Sentry.
        console.error('Firestore Permission Error:', error);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  // This component does not render anything to the DOM.
  return null;
}
