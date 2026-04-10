"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, width = 460, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.52)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        data-modal-scrollable
        style={{
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          width,
          maxWidth: "calc(100vw - 40px)",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "var(--shadow-lg)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Remove scrollbar in webkit browsers */}
        <style>{`
          div[data-modal-scrollable]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "var(--cloud)",
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
