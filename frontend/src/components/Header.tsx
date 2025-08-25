'use client';

import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center text-[var(--color-text-primary)]">
        Utilify — Who serves this address?
      </h1>
      <p className="mt-3 text-base md:text-lg text-[var(--color-text-secondary)] text-center leading-relaxed">
        We confirm who serves this address and give you direct next steps. If a result says 'Likely', follow the confirm link before you schedule.
      </p>
    </motion.header>
  );
}