'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import StatusPill from './StatusPill';
import ProviderActions from './ProviderActions';

export type ServiceKind = 'electric' | 'water' | 'trash' | 'gas';

interface Provider {
  provider: string | null;
  source?: string;
  confidence?: 'confirmed' | 'likely' | 'unknown';
  status_text?: string | null;
  next_actions?: Array<{
    label: string;
    url: string | null;
    kind: 'primary' | 'secondary';
  }>;
  meta?: Record<string, any>;
}

interface ProviderCardProps {
  kind: ServiceKind;
  data: Provider;
  index?: number;
}

const serviceConfig = {
  electric: { icon: '⚡', label: 'Electric' },
  water: { icon: '💧', label: 'Water/Wastewater' },
  trash: { icon: '♻️', label: 'Trash/Recycling/Compost' },
  gas: { icon: '🔥', label: 'Natural Gas' },
};

export default function ProviderCard({ kind, data, index = 0 }: ProviderCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const config = serviceConfig[kind];
  const confidence = data.confidence || 'unknown';

  // Default status text based on confidence if not provided
  const statusText = data.status_text || (
    confidence === 'confirmed' ? `Inside ${data.provider} service area` :
    confidence === 'likely' ? 'Territory data suggests this provider—confirm before you schedule' :
    "We couldn't confirm service; please check locally"
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.18,
        delay: index * 0.05,
        ease: 'easeOut',
      },
    },
  };

  const prettifyKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const prettifyValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{config.icon}</span>
          <h3 className="text-base font-medium text-[var(--color-text-primary)]">
            {config.label}
          </h3>
        </div>
        <StatusPill status={confidence} />
      </div>

      {/* Provider Info */}
      {data.provider ? (
        <div>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
            {data.provider}
          </p>
          {statusText && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {statusText}
            </p>
          )}
          {data.source && (
            <p className="mt-1 text-xs text-[color:rgba(71,85,105,0.7)]">
              Source: {data.source}
            </p>
          )}

          {/* Actions */}
          {data.next_actions && data.next_actions.length > 0 && (
            <ProviderActions actions={data.next_actions} service={kind} />
          )}
        </div>
      ) : (
        <div>
          <p className="text-base text-[var(--color-text-secondary)] italic mb-2">
            No provider found for this address
          </p>
          {statusText && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {statusText}
            </p>
          )}
        </div>
      )}

      {/* Note */}
      {data.meta?.note && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)] italic border-t border-[var(--color-border)] pt-4">
          {data.meta.note}
        </p>
      )}

      {/* Details Disclosure */}
      {data.meta && Object.keys(data.meta).filter(key => key !== 'note' && key !== 'error').length > 0 && (
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? 'Hide details' : 'View details'}
          className="mt-4 text-sm text-[var(--color-text-secondary)] hover:underline cursor-pointer flex items-center gap-1"
        >
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          View details
        </button>
      )}

      {/* Details Content */}
      {detailsOpen && data.meta && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 rounded-xl bg-[var(--color-surface-muted)] p-4 text-xs leading-relaxed"
        >
          <dl className="space-y-1.5">
            {Object.entries(data.meta)
              .filter(([key]) => key !== 'error' && key !== 'note')
              .slice(0, 8)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <dt className="text-[var(--color-text-secondary)] font-mono">
                    {prettifyKey(key)}:
                  </dt>
                  <dd className="text-[var(--color-text-primary)] font-mono text-right max-w-[60%] truncate">
                    {prettifyValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </motion.div>
      )}

      {/* Error State */}
      {data.meta?.error && (
        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-600">Error: {data.meta.error}</p>
        </div>
      )}
    </motion.div>
  );
}