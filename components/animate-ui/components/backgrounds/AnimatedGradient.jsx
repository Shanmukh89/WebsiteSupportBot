import React from 'react';

export function AnimatedGradientBackground({ className = '' }) {
    return (
        <div className={`dt-animated-gradient-bg ${className}`}>
            <div className="dt-gradient-blob blob-1"></div>
            <div className="dt-gradient-blob blob-2"></div>
            <div className="dt-gradient-blob blob-3"></div>

            {/* Subtle noise overlay for texture */}
            <div className="dt-noise-overlay"></div>
        </div>
    );
}
