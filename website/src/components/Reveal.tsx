"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    delay?: number;
    direction?: "up" | "left" | "right" | "scale";
    className?: string;
}

export default function Reveal({ children, delay = 0, direction = "up", className = "" }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const initial: Record<string, string> = {
        up: "translateY(32px)",
        left: "translateX(-32px)",
        right: "translateX(32px)",
        scale: "scale(0.93)",
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : initial[direction],
                transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
                willChange: "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}
