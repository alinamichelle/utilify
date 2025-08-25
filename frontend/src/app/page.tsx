'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import ProviderCard, { ServiceKind } from '@/components/ProviderCard';
import ResultsActionBar from '@/components/ResultsActionBar';

interface Location {
  lat: number;
  lng: number;
  display_name: string;
}

interface NextAction {
  label: string;
  url: string | null;
  kind: 'primary' | 'secondary';
}

interface Provider {
  provider: string | null;
  source?: string;
  confidence?: 'confirmed' | 'likely' | 'unknown';
  status_text?: string | null;
  next_actions?: NextAction[];
  link?: string;
  schedule_url?: string;
  bulk_url?: string;
  meta?: Record<string, any>;
}

interface ProvidersResponse {
  address: string;
  location: Location;
  providers: {
    electric: Provider;
    water: Provider;
    trash: Provider;
    gas: Provider;
  };
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProvidersResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
      const response = await fetch(
        `${apiBase}/api/v1/providers?${new URLSearchParams({ address })}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch provider information');
    } finally {
      setLoading(false);
    }
  };

  const services: { kind: ServiceKind; data: Provider | null }[] = data ? [
    { kind: 'electric', data: data.providers.electric },
    { kind: 'water', data: data.providers.water },
    { kind: 'trash', data: data.providers.trash },
    { kind: 'gas', data: data.providers.gas },
  ] : [];

  return (
    <>
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* Hero Section */}
        <section className="mx-auto max-w-2xl px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
          <Header />
          <div className="mt-8 md:mt-10">
            <SearchBar
              value={address}
              onChange={setAddress}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
        </section>

        {/* Results Section */}
        <section className="mx-auto max-w-5xl px-4 md:px-6 space-y-6 md:space-y-8 pb-24">
          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-[var(--color-error)]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <div className="animate-pulse">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-[var(--color-neutral-100)] rounded"></div>
                        <div className="h-5 bg-[var(--color-neutral-100)] rounded w-32"></div>
                      </div>
                      <div className="h-7 bg-[var(--color-neutral-100)] rounded w-48 mb-2"></div>
                      <div className="h-4 bg-[var(--color-neutral-100)] rounded w-64"></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence mode="wait">
            {data && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Summary Line and Actions */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-secondary)] truncate">
                        Results for {data.location.display_name}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]/70 mt-1 font-mono">
                        {data.location.lat.toFixed(4)}, {data.location.lng.toFixed(4)}
                      </p>
                    </div>
                    <ResultsActionBar data={data} />
                  </div>
                </motion.div>

                {/* Provider Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {services.map(({ kind, data }, index) => (
                    <ProviderCard
                      key={kind}
                      kind={kind}
                      data={data || { provider: null, confidence: 'unknown' }}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!data && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-lg text-[var(--color-text-secondary)]">
                Enter an Austin address to find your utility providers
              </p>
            </motion.div>
          )}
        </section>
      </main>
    </>
  );
}