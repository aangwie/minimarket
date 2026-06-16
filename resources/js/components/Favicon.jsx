import { useEffect } from 'react';
import { settingAPI } from '../services/api';

const Favicon = () => {
    useEffect(() => {
        setFavicon();
    }, []);

    const setFavicon = async () => {
        try {
            const res = await settingAPI.index();
            const data = res.data;

            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }

            if (data.store_logo) {
                // Use uploaded logo as favicon
                link.href = `data:image/webp;base64,${data.store_logo}`;
                link.type = 'image/webp';
            } else {
                // Default "M" letter favicon using SVG
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="20" fill="#FF6B00"/>
                    <text x="50" y="68" text-anchor="middle" fill="white" font-size="60" font-weight="bold" font-family="Arial">M</text>
                </svg>`;
                link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
                link.type = 'image/svg+xml';
            }
        } catch (e) {
            console.error('Failed to set favicon:', e);
        }
    };

    return null;
};

export default Favicon;