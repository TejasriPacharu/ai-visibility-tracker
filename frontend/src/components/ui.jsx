import { cn } from '../lib/utils';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================
// Loading Spinner
// ============================================

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <Loader2 className={cn('animate-spin text-blue-500', sizes[size], className)} />
  );
}

// ============================================
// Loading Dots Animation
// ============================================

export function LoadingDots() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot" />
      <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot" />
      <div className="w-2 h-2 bg-blue-500 rounded-full loading-dot" />
    </div>
  );
}

// ============================================
// Card Component
// ============================================

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div 
      className={cn('card', hover && 'card-hover cursor-pointer', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// Button Component
// ============================================

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-red-500 text-white hover:bg-red-400',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        (loading || disabled) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ============================================
// Input Component
// ============================================

export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: 'var(--color-navy-300)' }}>
          {label}
        </label>
      )}
      <input 
        className={cn('input', error && 'border-red-500', className)} 
        {...props} 
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

// ============================================
// Badge Component
// ============================================

export function Badge({ children, variant = 'neutral', className }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    neutral: 'badge-neutral',
    primary: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

// ============================================
// Progress Bar
// ============================================

export function ProgressBar({ value, max = 100, className }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn('progress-bar', className)}>
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ============================================
// Metric Card
// ============================================

export function MetricCard({ 
  label, 
  value, 
  change, 
  changeDirection,
  suffix = '',
  icon: Icon,
  className 
}) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>{label}</p>
          <p className="text-3xl font-bold text-white mt-1">
            {value}
            {suffix && <span className="text-lg ml-1" style={{ color: 'var(--color-navy-400)' }}>{suffix}</span>}
          </p>
          {change !== null && change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              changeDirection === 'up' && 'text-green-400',
              changeDirection === 'down' && 'text-red-400',
              changeDirection === 'neutral' && 'text-gray-400'
            )}>
              {changeDirection === 'up' && <TrendingUp className="w-4 h-4" />}
              {changeDirection === 'down' && <TrendingDown className="w-4 h-4" />}
              {changeDirection === 'neutral' && <Minus className="w-4 h-4" />}
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Empty State
// ============================================

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: 'var(--color-navy-800)' }}>
          <Icon className="w-8 h-8" style={{ color: 'var(--color-navy-400)' }} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="max-w-md mx-auto mb-6" style={{ color: 'var(--color-navy-400)' }}>{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// Skeleton Loader
// ============================================

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <Card className="p-6">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </Card>
  );
}

// ============================================
// Tabs
// ============================================

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('flex gap-1 p-1 rounded-xl', className)} style={{ backgroundColor: 'var(--color-navy-900)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.value
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          )}
          style={activeTab !== tab.value ? { backgroundColor: 'transparent' } : {}}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-xs',
              activeTab === tab.value ? 'bg-white/20' : ''
            )}
            style={activeTab !== tab.value ? { backgroundColor: 'var(--color-navy-700)' } : {}}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Modal
// ============================================

export function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className={cn(
          'relative rounded-2xl border shadow-2xl w-full max-w-lg p-6',
          className
        )}
        style={{ 
          backgroundColor: 'var(--color-navy-900)',
          borderColor: 'var(--color-navy-800)'
        }}
        >
          {title && (
            <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}