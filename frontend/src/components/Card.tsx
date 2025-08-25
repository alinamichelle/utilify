import React from 'react';

interface NextAction {
  label: string;
  url: string | null;
  kind: 'primary' | 'secondary';
}

interface CardProps {
  title: string;
  provider: string | null;
  source?: string;
  confidence?: 'confirmed' | 'likely' | 'unknown';
  status_text?: string | null;
  next_actions?: NextAction[];
  link?: string;
  schedule_url?: string;
  bulk_url?: string;
  meta?: Record<string, any>;
  isTrashCard?: boolean;
}

function prettifyKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function prettifyValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    likely: 'bg-amber-100 text-amber-800 border-amber-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const labels = {
    confirmed: 'Confirmed',
    likely: 'Likely',
    unknown: 'Unknown'
  };
  
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${styles[confidence as keyof typeof styles] || styles.unknown}`}>
      {labels[confidence as keyof typeof labels] || 'Unknown'}
    </span>
  );
}

function ActionButton({ action, onClick }: { action: NextAction; onClick?: () => void }) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();
    
    // GTM event tracking
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'utilify_cta_click',
        service: action.label.toLowerCase().includes('gas') ? 'gas' : 
                 action.label.toLowerCase().includes('water') ? 'water' :
                 action.label.toLowerCase().includes('electric') ? 'electric' : 'trash',
        label: action.label,
        url: action.url
      });
    }
  };
  
  if (!action.url) {
    return (
      <button
        disabled
        className="inline-block px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed text-sm"
        title="We'll add the direct link soon—contact support if needed."
      >
        {action.label}
      </button>
    );
  }
  
  if (action.kind === 'primary') {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        {action.label} →
      </a>
    );
  }
  
  return (
    <a
      href={action.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      {action.label}
    </a>
  );
}

export default function Card({ 
  title, 
  provider, 
  source, 
  confidence = 'unknown',
  status_text,
  next_actions = [],
  link, 
  schedule_url, 
  bulk_url, 
  meta, 
  isTrashCard 
}: CardProps) {
  const hasError = meta?.error;
  const note = meta?.note;
  
  // For trash cards, use the next_actions if available, otherwise fall back to legacy behavior
  if (isTrashCard && next_actions.length === 0 && (schedule_url || bulk_url)) {
    next_actions = [];
    if (schedule_url) {
      next_actions.push({
        label: 'Open My Schedule',
        url: schedule_url,
        kind: 'primary'
      });
    }
    if (bulk_url) {
      next_actions.push({
        label: 'Schedule Bulk/Brush or HHW',
        url: bulk_url,
        kind: 'secondary'
      });
    }
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border ${hasError ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <ConfidenceBadge confidence={confidence} />
      </div>
      
      {provider ? (
        <div className="space-y-3">
          <div>
            <p className="text-xl font-medium text-blue-600">{provider}</p>
            {status_text && (
              <p className="text-sm text-gray-600 mt-1">{status_text}</p>
            )}
            {source && (
              <p className="text-xs text-gray-500 mt-1">Source: {source}</p>
            )}
          </div>
          
          {next_actions.length > 0 && (
            <div className="space-y-2 pt-2">
              {next_actions.map((action, index) => (
                <div key={index}>
                  <ActionButton action={action} />
                </div>
              ))}
            </div>
          )}
          
          {note && (
            <p className="text-sm text-gray-600 italic border-t pt-3">{note}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-500 italic">No provider found for this address</p>
          {status_text && (
            <p className="text-sm text-gray-600">{status_text}</p>
          )}
        </div>
      )}
      
      {hasError && (
        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-sm text-red-600">Error: {meta.error}</p>
        </div>
      )}
      
      {meta && Object.keys(meta).length > 0 && !hasError && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            View Details
          </summary>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <dl className="space-y-1">
              {Object.entries(meta)
                .filter(([key]) => key !== 'error' && key !== 'note' && key !== 'city' && key !== 'county')
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-600">{prettifyKey(key)}:</dt>
                    <dd className="text-gray-900 font-medium text-right truncate max-w-xs">{prettifyValue(value)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </details>
      )}
    </div>
  );
}