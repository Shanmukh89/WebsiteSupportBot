"use client";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const generateStars = (width, height, count, starColor) => {
    return Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random(),
        speed: Math.random() * 0.2 + 0.05,
        color: starColor,
    }));
};

export const StarsBackground = ({
    starCount = 150,
    starColor = "#ffffff",
    className,
}) => {
    const canvasRef = useRef(null);
    const starsRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            // Use parent container dimensions instead of window to fit inside the auth panel
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                starsRef.current = generateStars(canvas.width, canvas.height, starCount, starColor);
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        let animationFrameId;

        const render = () => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            starsRef.current.forEach((star) => {
                ctx.beginPath();
                ctx.globalAlpha = star.opacity;
                ctx.fillStyle = star.color;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // twinkle
                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 1) star.opacity = 1;

                star.y -= star.speed;
                if (star.y < 0) {
                    star.y = canvas.height;
                    star.x = Math.random() * canvas.width;
                }
            });
            ctx.globalAlpha = 1.0;

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [starCount, starColor]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("pointer-events-none absolute inset-0 block h-full w-full", className)}
        />
    );
};
