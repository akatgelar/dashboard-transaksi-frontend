'use client'

import { useEffect, useState } from 'react';

export default function PreLoader() {
    const [loaded, setLoaded] = useState(true);

    useEffect(() => {
        const handleLoad = () => {
        setTimeout(() => setLoaded(false), 500);
        };

        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('DOMContentLoaded', handleLoad);
        }

        return () => {
            window.removeEventListener('DOMContentLoaded', handleLoad);
        };
    }, []);

    if (!loaded) return null;

    return (
        <div className="fixed left-0 top-0 z-[999999] flex h-screen w-screen items-center justify-center bg-white dark:bg-black">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
        </div>
    );
}
