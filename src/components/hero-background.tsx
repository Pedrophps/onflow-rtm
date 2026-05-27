'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

const MIN_RADIUS = 7.5;
const MAX_RADIUS = 15;
const DEPTH = 2;
const NUM_POINTS = 2500;

// Configuração de Cores por Tema - Ajustado para RTM (Vermelho e Tons de Cinza/Prata)
const THEME_COLORS = {
    dark: {
        left: "e60000", // RTM Red
        right: "475569" // Slate 600
    },
    light: {
        left: "e60000", // RTM Red
        right: "94a3b8" // Slate 400 (Mais suave)
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

    // Detecção de Tema
    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark') || 
                              window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(isDarkMode);
        };

        checkTheme();
        
        // Observer para mudanças de classe (caso haja toggle de tema)
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

    // Memoização das partículas para evitar re-geração desnecessária, exceto na mudança de cores
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

        const outer = Array.from({ length: NUM_POINTS / 4 }, (_, k) => k + 1).map((num) => {
            const randomRadius = randomFromInterval(MIN_RADIUS / 2, MAX_RADIUS * 2);
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * randomRadius;
            const y = Math.sin(angle) * randomRadius;
            const z = randomFromInterval(-DEPTH * 10, DEPTH * 10);
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
            rotation += 0.002;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const scale = Math.min(canvas.width, canvas.height) / 40;

            const sortedPoints = points.map(p => {
                const x = p.position[0];
                const y = p.position[1];
                const z = p.position[2];

                const rotX = x * Math.cos(rotation) - z * Math.sin(rotation);
                const rotZ = x * Math.sin(rotation) + z * Math.cos(rotation);

                return { ...p, rotatedPos: [rotX, y, rotZ] };
            }).sort((a, b) => a.rotatedPos[2] - b.rotatedPos[2]);

            sortedPoints.forEach(p => {
                const [x, y, z] = p.rotatedPos;
                const perspective = 1000 / (1000 + z * scale);
                const screenX = centerX + x * scale * perspective;
                const screenY = centerY + y * scale * perspective;
                
                const size = Math.max(1, (z + 20) / 10 * perspective);
                const opacity = Math.min(1, Math.max(0.1, (z + 20) / 40));

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
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-40"
            style={{ filter: 'blur(1px)' }}
        />
    );
};
