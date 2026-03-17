import React, { useEffect, useRef } from 'react';

/**
 * AuroraRibbon — A full-screen canvas animation that renders a
 * flowing, multi-color spectral light ribbon against a dark background.
 * GPU-accelerated via canvas compositing & gradient caching.
 */
export function AuroraRibbon({ className = '' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId;
        let time = 0;

        // Spectral color stops (neon rainbow)
        const spectrumColors = [
            '#ff0040', // neon red
            '#ff6600', // orange
            '#ffcc00', // yellow
            '#00ff66', // green
            '#00ccff', // cyan
            '#3366ff', // blue
            '#cc33ff', // magenta
            '#ff0066', // loop back
        ];

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const parent = canvas.parentElement;
            if (!parent) return;
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;

            // Clear with dark background
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, w, h);

            // Time-based parameters
            time += 0.003; // slow crawl

            const ribbonCount = 3; // multiple overlapping ribbons for depth

            for (let r = 0; r < ribbonCount; r++) {
                const offset = r * 0.7;
                const phase = time + offset;
                const amplitude = h * (0.08 + r * 0.03);
                const baseY = h * (0.52 + Math.sin(phase * 0.4) * 0.08);
                const thickness = 2.5 + r * 1.5;
                const ribbonOpacity = 0.35 - r * 0.08;

                ctx.save();
                ctx.globalAlpha = ribbonOpacity;
                ctx.globalCompositeOperation = 'lighter';

                // Draw the ribbon as a series of segments with shifting spectrum gradient
                const segments = 120;
                const segWidth = w / segments;

                for (let i = 0; i < segments; i++) {
                    const t = i / segments;
                    const x = t * w;

                    // Curve: combination of sine waves for organic feel
                    const y = baseY
                        + Math.sin(t * Math.PI * 2 + phase * 1.2) * amplitude * 0.6
                        + Math.sin(t * Math.PI * 4 + phase * 0.8 + offset) * amplitude * 0.25
                        + Math.sin(t * Math.PI * 6 + phase * 0.5) * amplitude * 0.1;

                    // Spectrum color at this position
                    const colorIndex = ((t + phase * 0.15) % 1) * (spectrumColors.length - 1);
                    const ci = Math.floor(colorIndex);
                    const cf = colorIndex - ci;
                    const c1 = spectrumColors[ci % spectrumColors.length];
                    const c2 = spectrumColors[(ci + 1) % spectrumColors.length];

                    // Vertical glow gradient at each segment
                    const glowRadius = 30 + thickness * 8;
                    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
                    grad.addColorStop(0, c1);
                    grad.addColorStop(0.3, c2);
                    grad.addColorStop(1, 'transparent');

                    ctx.fillStyle = grad;
                    ctx.fillRect(x - segWidth * 0.5, y - glowRadius, segWidth + 1, glowRadius * 2);
                }

                // Draw a brighter core line
                ctx.globalAlpha = ribbonOpacity * 1.5;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = thickness * 0.5;
                ctx.beginPath();

                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const x = t * w;
                    const y = baseY
                        + Math.sin(t * Math.PI * 2 + phase * 1.2) * amplitude * 0.6
                        + Math.sin(t * Math.PI * 4 + phase * 0.8 + offset) * amplitude * 0.25
                        + Math.sin(t * Math.PI * 6 + phase * 0.5) * amplitude * 0.1;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.restore();
            }

            // Subtle bloom layer — a large soft glow at the center of the ribbon
            const bloomY = h * 0.52 + Math.sin(time * 0.4) * h * 0.06;
            const bloomGrad = ctx.createRadialGradient(w * 0.5, bloomY, 0, w * 0.5, bloomY, w * 0.4);
            bloomGrad.addColorStop(0, 'rgba(100, 80, 200, 0.04)');
            bloomGrad.addColorStop(0.5, 'rgba(50, 100, 255, 0.02)');
            bloomGrad.addColorStop(1, 'transparent');

            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = bloomGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';

            animId = requestAnimationFrame(draw);
        };

        animId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 block h-full w-full ${className}`}
            style={{ zIndex: 0 }}
        />
    );
}
