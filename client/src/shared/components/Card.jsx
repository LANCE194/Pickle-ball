export default function Card({ children, className = '', as: T = 'div', ...p }) {
  return <T className={`surface surface-card rounded-card shadow-card border line p-4 ${className}`} {...p}>{children}</T>;
}
