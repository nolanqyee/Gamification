"use client";

import { useRef, useState } from "react";
import { DayHoverModal } from "./DayHoverModal";
import { useAppStore } from "@/store/useAppStore";

interface Props {
    date: string;
    dayNumber: number;
    points: number;
    isToday: boolean;
    isActive: boolean;
    isCurrentMonth: boolean;
}

// Fixed scale: 100 pts = darkest. Tinted from accent color #FF5149.
function getHeatBg(points: number, isCurrentMonth: boolean): string {
    if (!isCurrentMonth) return "#e9e9ee";
    if (points === 0) return "#ebebed";
    if (points < 20) return "#ffe8e7";
    if (points < 40) return "#ffc5c2";
    if (points < 60) return "#ff9d99";
    if (points < 80) return "#ff7470";
    if (points < 100) return "#ff5149";
    return "#cc3d38";
}

export function DayCell({
    date,
    dayNumber,
    points,
    isToday,
    isActive,
    isCurrentMonth,
}: Props) {
    const setActiveDate = useAppStore((s) => s.setActiveDate);
    const [hovered, setHovered] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const bg = getHeatBg(points, isCurrentMonth);

    return (
        <div
            ref={ref}
            onClick={() => isCurrentMonth && setActiveDate(date)}
            onMouseEnter={() => {
                if (ref.current)
                    setAnchorRect(ref.current.getBoundingClientRect());
                setHovered(true);
            }}
            onMouseLeave={() => {
                setHovered(false);
                setAnchorRect(null);
            }}
            className={`relative rounded-md transition-all duration-75 select-none h-8 ${isCurrentMonth ? "cursor-pointer" : "cursor-default"}`}
            style={{
                backgroundColor: bg,
                outline: isActive
                    ? "2px solid #18181b"
                    : isToday
                      ? "2px solid #a1a1aa"
                      : "none",
                outlineOffset: "-1px",
                opacity: isCurrentMonth ? 1 : 0.3,
            }}
        >
            {hovered && anchorRect && isCurrentMonth && (
                <DayHoverModal
                    date={date}
                    dayNumber={dayNumber}
                    anchorRect={anchorRect}
                />
            )}
        </div>
    );
}
