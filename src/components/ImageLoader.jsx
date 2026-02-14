import React, { useState } from 'react'

export default function ImageLoader({ src, alt, className, style, ...props }) {
    const [loaded, setLoaded] = useState(false)

    return (
        <div
            className={`image-loader-container ${className || ''}`}
            style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', ...style }}
            {...props}
        >
            {!loaded && (
                <div
                    className="img-loading-skeleton"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1
                    }}
                />
            )}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                    display: 'block'
                }}
            />
        </div>
    )
}
