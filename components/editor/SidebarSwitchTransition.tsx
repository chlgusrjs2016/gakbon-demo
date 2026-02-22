"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type SidebarSwitchTransitionProps = {
  side: "left" | "right";
  isOpen: boolean;
  activeKey: string | null;
  renderPanel: (key: string) => ReactNode;
  switchDurationMs?: number;
};

export default function SidebarSwitchTransition({
  side,
  isOpen,
  activeKey,
  renderPanel,
  switchDurationMs = 220,
}: SidebarSwitchTransitionProps) {
  const [currentKey, setCurrentKey] = useState<string | null>(activeKey);
  const [switchPhase, setSwitchPhase] = useState<"idle" | "closing" | "opening">("idle");
  const queuedKeyRef = useRef<string | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (activeKey === currentKey) {
      queuedKeyRef.current = null;
      if (switchPhase !== "idle") setSwitchPhase("idle");
      return;
    }

    if (!activeKey) {
      queuedKeyRef.current = null;
      setCurrentKey(null);
      setSwitchPhase("idle");
      return;
    }

    if (!currentKey) {
      setCurrentKey(activeKey);
      setSwitchPhase("opening");
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
      });
      phaseTimerRef.current = setTimeout(() => {
        setSwitchPhase("idle");
        phaseTimerRef.current = null;
      }, switchDurationMs);
      return;
    }

    queuedKeyRef.current = activeKey;
    setSwitchPhase("closing");
    phaseTimerRef.current = setTimeout(() => {
      const nextKey = queuedKeyRef.current;
      if (!nextKey) {
        setCurrentKey(null);
        setSwitchPhase("idle");
        phaseTimerRef.current = null;
        return;
      }

      setCurrentKey(nextKey);
      setSwitchPhase("opening");

      phaseTimerRef.current = setTimeout(() => {
        setSwitchPhase("idle");
        phaseTimerRef.current = null;
      }, switchDurationMs);
    }, switchDurationMs);
  }, [activeKey, currentKey, switchDurationMs, switchPhase]);

  const openTranslateClass = side === "left" ? "translate-x-0" : "translate-x-0";
  const closedTranslateClass = side === "left" ? "-translate-x-full" : "translate-x-full";

  const containerTranslateClass = (() => {
    if (!isOpen) return closedTranslateClass;
    if (switchPhase === "closing") return closedTranslateClass;
    if (switchPhase === "opening") return openTranslateClass;
    return openTranslateClass;
  })();

  return (
    <div
      className={[
        "absolute top-0 bottom-0 z-30",
        side === "left" ? "left-0" : "right-0",
        "transition-transform duration-300 ease-in-out",
        containerTranslateClass,
      ].join(" ")}
    >
      <div className="relative h-full">{currentKey ? renderPanel(currentKey) : null}</div>
    </div>
  );
}
