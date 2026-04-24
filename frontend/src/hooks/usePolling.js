import { useEffect, useRef } from 'react';

export default function usePolling(fetchFn, intervalMs = 5000, enabled = true) {
    const savedFn = useRef(fetchFn);
    savedFn.current = fetchFn;

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        savedFn.current();
        const interval = setInterval(() => savedFn.current(), intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs, enabled]);
}
