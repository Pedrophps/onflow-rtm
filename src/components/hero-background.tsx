'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

const MIN_RADIUS = 7.5;
const MAX_RADIUS = 15;
const DEPTH = 3;
const NUM_POINTS = 3000; // Ajustado para 3000 conforme solicitado

const THEME_COLORS = {
    dark: {
        left: "e60000",
        right: "475569" 
    },
    light: {
        left: "e60000",
        right: "cbd5e1" 
    }
};

const getGradientStop = (ratio: number, leftColor: string, rightColor: string) => {
    ratio = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;

    const c0 = leftColor.match(/.{1,2}/g)!.map(
        (oct) => parseInt(oct, 16) * (1 - ratio)
    );
    const c1 = rightColor.match(/.{1,2}/g)!.map(
        (oct) => parseInt(oct, 16) * ratio
    );
    const ci = [0, 1, 2].map((i) => Math.min(Math.round(c0[i] + c1[i]), 255));
    const color = ci
        .reduce((a, v) => (a << 8) + v, 0)
        .toString(16)
        .padStart(6, "0");

    return `#${color}`;
};

const calculateColor = (x: number, leftColor: string, rightColor: string) => {
    const maxDiff = MAX_RADIUS * 2;
    const distance = x + MAX_RADIUS;
    const ratio = distance / maxDiff;
    return getGradientStop(ratio, leftColor, rightColor);
};

const randomFromInterval = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

export const HeroBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDark, setIsDark] = useState(false);
    const mousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };

        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = {
                x: (e.clientX / window.innerWidth) - 0.5,
                y: (e.clientY / window.innerHeight) - 0.5
            };
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            observer.disconnect();
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

    const points = useMemo(() => {
        const inner = Array.from({ length: NUM_POINTS }, (_, k) => k + 1).map((num) => {
            const randomRadius = randomFromInterval(MIN_RADIUS, MAX_RADIUS);
            const randomAngle = Math.random() * Math.PI * 2;
            const x = Math.cos(randomAngle) * randomRadius;
            const y = Math.sin(randomAngle) * randomRadius;
            const z = randomFromInterval(-DEPTH, DEPTH);
            const color = calculateColor(x, colors.left, colors.right);
            return { idx: num, position: [x, y, z], color };
        });

        const outer = Array.from({ length: NUM_POINTS / 2 }, (_, k) => k + 1).map((num) => {
            const randomRadius = randomFromInterval(MIN_RADIUS / 2, MAX_RADIUS * 3);
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * randomRadius;
            const y = Math.sin(angle) * randomRadius;
            const z = randomFromInterval(-DEPTH * 5, DEPTH * 5);
            const color = calculateColor(x, colors.left, colors.right);
            return { idx: num, position: [x, y, z], color };
        });

        return [...inner, ...outer];
    }, [colors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let rotation = 0;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        const render = () => {
            rotation += 0.004;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const scale = Math.min(canvas.width, canvas.height) / 30;

            const targetRotationX = mousePos.current.y * 0.3;
            const targetRotationY = mousePos.current.x * 0.3;

            const sortedPoints = points.map(p => {
                const x = p.position[0];
                const y = p.position[1];
                const z = p.position[2];

                const currentRot = rotation + targetRotationY;
                const rotX = x * Math.cos(currentRot) - z * Math.sin(currentRot);
                const rotZ = x * Math.sin(currentRot) + z * Math.cos(currentRot);
                
                const finalY = y * Math.cos(targetRotationX) - rotZ * Math.sin(targetRotationX);
                const finalZ = y * Math.sin(targetRotationX) + rotZ * Math.cos(targetRotationX);

                return { ...p, rotatedPos: [rotX, finalY, finalZ] };
            }).sort((a, b) => a.rotatedPos[2] - b.rotatedPos[2]);

            sortedPoints.forEach(p => {
                const [x, y, z] = p.rotatedPos;
                const perspective = 1000 / (1000 + z * scale);
                const screenX = centerX + x * scale * perspective;
                const screenY = centerY + y * scale * perspective;
                
                const size = Math.max(1.1, (z + 30) / 10 * perspective);
                const opacity = Math.min(0.9, Math.max(0.2, (z + 30) / 60));

                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = opacity;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [points]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none opacity-70 transition-opacity duration-1000"
        />
    );
};