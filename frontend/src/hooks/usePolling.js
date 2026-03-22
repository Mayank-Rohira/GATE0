import { useEffect, useRef } from 'react';

export default function usePolling(fetchFn, intervalMs = 5000) {
    const savedFn = useRef(fetchFn);
    savedFn.current = fetchFn;

    useEffect(() => {
        savedFn.current();
        const interval = setInterval(() => savedFn.current(), intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs]);
}
