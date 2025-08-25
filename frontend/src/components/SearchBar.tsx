import * as React from "react";
import { Search as SearchIcon } from "lucide-react";

type Props = {
  value: string;
  onChange: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
};

export default function SearchBar({ value, onChange, onSubmit, loading }: Props) {
  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(e);
  }
  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex h-14 items-stretch rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-ring)]">
        <div className="flex items-center pl-4 pr-2 text-[var(--color-text-secondary)]">
          <SearchIcon aria-hidden className="h-5 w-5" />
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder="Type an Austin address…"
          autoComplete="street-address"
          className="flex-1 bg-transparent outline-none text-base text-[var(--color-text-primary)] placeholder:text-[color:rgba(71,85,105,0.6)] px-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-full px-4 md:px-5 rounded-r-2xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-600)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-60"
          aria-label="Search address"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}