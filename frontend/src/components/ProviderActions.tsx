'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface Action {
  label: string;
  url: string | null;
  kind: 'primary' | 'secondary';
}

interface ProviderActionsProps {
  actions: Action[];
  service: string;
}

export default function ProviderActions({ actions, service }: ProviderActionsProps) {
  if (!actions || actions.length === 0) return null;

  const handleClick = (action: Action) => {
    // GTM event tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'utilify_cta_click',
        service: service.toLowerCase(),
        label: action.label,
        url: action.url,
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.map((action, index) => {
        if (!action.url) {
          return (
            <button
              key={index}
              disabled
              aria-disabled="true"
              title="We'll add the direct link soon—contact support if needed."
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm
                       bg-gray-100 text-gray-400 rounded-xl
                       cursor-not-allowed opacity-60"
            >
              {action.label}
            </button>
          );
        }

        if (action.kind === 'primary') {
          return (
            <motion.a
              key={index}
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(action)}
              whileTap={{ scale: 0.98 }}
              aria-label={`${action.label} (opens in new tab)`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 
                       bg-[var(--color-accent)] text-white font-medium 
                       hover:bg-[var(--color-accent-600)]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]
                       transition-colors duration-200"
            >
              {action.label}
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </motion.a>
          );
        }

        return (
          <a
            key={index}
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(action)}
            aria-label={`${action.label} (opens in new tab)`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm
                     text-[var(--color-text-secondary)] 
                     hover:underline
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]
                     transition-colors duration-200"
          >
            {action.label}
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}