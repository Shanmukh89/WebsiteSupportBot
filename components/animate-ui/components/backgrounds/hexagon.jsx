import React, { useEffect, useRef } from 'react';

export const HexagonBackground = ({ className = "" }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width = 0;
        let height = 0;

        // Mouse coordinates for interactive glow
        let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

        const hexSize = 35; // Size of hexagons
        const hexWidth = Math.sqrt(3) * hexSize;
        const hexHeight = 2 * hexSize;
        const xOffset = hexWidth;
        const yOffset = hexHeight * 0.75;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            width = rect.width;
            height = rect.height;

            // Setup high-dpi canvas
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };

        const drawHexagon = (x, y, radius, distance) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const hx = x + radius * Math.cos(angle);
                const hy = y + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();

            // Base subtle grid line style
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Highlight style based on distance to mouse
            const maxGlowDist = 250;
            if (distance < maxGlowDist) {
                const intensity = Math.pow(1 - (distance / maxGlowDist), 2);

                // Glow effect corresponding to Site2Agent blue (--dt-accent-blue)
                ctx.fillStyle = `rgba(91, 91, 214, ${intensity * 0.15})`;
                ctx.fill();

                ctx.strokeStyle = `rgba(91, 91, 214, ${intensity * 0.6})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        };

        const render = () => {
            // Smoothly interpolate mouse position for fluid glow
            mouse.x += (mouse.targetX - mouse.x) * 0.1;
            mouse.y += (mouse.targetY - mouse.y) * 0.1;

            ctx.clearRect(0, 0, width, height);

            // Calculate grid bounds
            const cols = Math.ceil(width / xOffset) + 2;
            const rows = Math.ceil(height / yOffset) + 2;

            for (let row = -1; row < rows; row++) {
                for (let col = -1; col < cols; col++) {
                    const x = col * xOffset + (Math.abs(row) % 2 === 1 ? xOffset / 2 : 0);
                    const y = row * yOffset;

                    const dx = mouse.x - x;
                    const dy = mouse.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Slightly smaller radius to leave a pixel gap
                    drawHexagon(x, y, hexSize * 0.95, distance);
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.targetX = e.clientX - rect.left;
            mouse.targetY = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.targetX = -1000;
            mouse.targetY = -1000;
        };

        window.addEventListener('resize', resize);

        // Use parent for mouse tracking if we want it to react to the whole section
        const trackElement = canvas.parentElement || canvas;
        trackElement.addEventListener('mousemove', handleMouseMove);
        trackElement.addEventListener('mouseleave', handleMouseLeave);

        resize();

        // Init mouse starting pos immediately instead of interpolating from -1000
        mouse.x = -1000;
        mouse.y = -1000;

        render();

        return () => {
            window.removeEventListener('resize', resize);
            trackElement.removeEventListener('mousemove', handleMouseMove);
            trackElement.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none ${className}`}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                opacity: 0.8
            }}
        />
    );
};
