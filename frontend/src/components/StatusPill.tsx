'use client';

interface StatusPillProps {
  status: 'confirmed' | 'likely' | 'unknown';
}

export default function StatusPill({ status }: StatusPillProps) {
  const styles = {
    confirmed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    likely: 'bg-[var(--color-caution)]/10 text-[var(--color-caution)]',
    unknown: 'bg-[var(--color-neutral-200)] text-[var(--color-text-secondary)]',
  };

  const labels = {
    confirmed: 'Confirmed',
    likely: 'Likely',
    unknown: 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${styles[status]}`}
      role="status"
      aria-label={`Status: ${labels[status]}`}
    >
      {labels[status]}
    </span>
  );
}