'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Mail, Check } from 'lucide-react';

interface Provider {
  provider: string | null;
  next_actions?: Array<{
    label: string;
    url: string | null;
    kind: 'primary' | 'secondary';
  }>;
}

interface ProvidersData {
  address: string;
  providers: {
    electric: Provider;
    water: Provider;
    trash: Provider;
    gas: Provider;
  };
}

interface ResultsActionBarProps {
  data: ProvidersData;
}

export default function ResultsActionBar({ data }: ResultsActionBarProps) {
  const [copied, setCopied] = useState(false);

  const generateSummary = (): string => {
    const lines = [
      `Utility Providers for ${data.address}`,
      '=' .repeat(40),
      '',
      `Electric: ${data.providers.electric.provider || 'Unknown'}`,
      `Water: ${data.providers.water.provider || 'Unknown'}`,
      `Trash/Recycling: ${data.providers.trash.provider || 'Unknown'}`,
      `Natural Gas: ${data.providers.gas.provider || 'Unknown'}`,
      '',
      'Next Steps:',
      '-'.repeat(20),
    ];

    // Add primary action URLs
    const allProviders = [
      { name: 'Electric', data: data.providers.electric },
      { name: 'Water', data: data.providers.water },
      { name: 'Trash', data: data.providers.trash },
      { name: 'Gas', data: data.providers.gas },
    ];

    allProviders.forEach(({ name, data }) => {
      if (data.next_actions && data.next_actions.length > 0) {
        const primaryAction = data.next_actions.find(a => a.kind === 'primary');
        if (primaryAction && primaryAction.url) {
          lines.push(`${name}: ${primaryAction.label} - ${primaryAction.url}`);
        }
      }
    });

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const summary = generateSummary();
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // GTM tracking
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'utilify_cta_click',
          service: 'summary',
          label: 'copy',
        });
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmail = () => {
    const summary = generateSummary();
    const subject = encodeURIComponent(`Utility list for ${data.address}`);
    const body = encodeURIComponent(summary);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;

    // GTM tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'utilify_cta_click',
        service: 'summary',
        label: 'email',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="flex items-center gap-3 justify-end"
    >
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.98 }}
        aria-label={copied ? 'Results copied' : 'Copy results to clipboard'}
        className="inline-flex items-center gap-2 h-9 px-3 text-sm
                 bg-[var(--color-surface)] text-[var(--color-text-primary)]
                 border border-[var(--color-border)] rounded-xl
                 hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-neutral-200)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2
                 transition-colors duration-200"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-[var(--color-success)]" aria-hidden="true" />
              <span>Copied!</span>
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Copy results</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <motion.button
        onClick={handleEmail}
        whileTap={{ scale: 0.98 }}
        aria-label="Email results"
        className="inline-flex items-center gap-2 h-9 px-3 text-sm
                 bg-[var(--color-surface)] text-[var(--color-text-primary)]
                 border border-[var(--color-border)] rounded-xl
                 hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-neutral-200)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2
                 transition-colors duration-200"
      >
        <Mail className="w-4 h-4" aria-hidden="true" />
        <span>Email me this list</span>
      </motion.button>
    </motion.div>
  );
}