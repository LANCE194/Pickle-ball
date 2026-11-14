import { forwardRef } from 'react';
const V = {
  primary: 'bg-court text-white hover:brightness-95',
  book: 'bg-volt text-navy hover:brightness-95 font-semibold',          // Book Now: Volt Lime with dark text
  secondary: 'border border-court text-court dark:text-volt dark:border-volt bg-transparent hover:bg-court/10',
  danger: 'bg-alert text-alert-ink hover:brightness-105',
  ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10',
};
/** The only button. Minimum height 44 px. Never write a one-off <button> inside a feature folder. */
const Button = forwardRef(function Button({ variant = 'primary', loading = false, disabled, children, className = '', icon: I, type = 'button', full, ...p }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={`button-polish inline-flex items-center justify-center gap-2 min-h-tap min-w-tap px-4 rounded-card font-medium transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed ${full ? 'w-full' : ''} ${V[variant]} ${className}`} {...p}>
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" /> : I ? <I size={18} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
});
export default Button;
