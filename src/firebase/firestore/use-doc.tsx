
'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.data() as T || null);
        setLoading(false);
      },
      (err) => {
        // Ignora erros de "offline" para não travar a UI com toasts de erro
        if (err.code !== 'unavailable' && err.code !== 'offline') {
          console.warn("Firestore error in useDoc:", err);
        }
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [docRef?.path]);

  return { data, loading, error };
}
