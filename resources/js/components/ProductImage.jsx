import React, { useState } from 'react';

const ProductImage = ({ src, alt, className, stock }) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className={`w-full h-full flex items-center justify-center ${className || ''}`}>
                <svg className={`w-8 h-8 ${stock <= 0 ? 'text-gray-400' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={`/${src}`}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setHasError(true)}
        />
    );
};

export default ProductImage;