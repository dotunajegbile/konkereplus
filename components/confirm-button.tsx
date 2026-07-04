"use client";

// Submit button that asks for confirmation first (for destructive actions).
export function ConfirmButton({
  children, message, className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
