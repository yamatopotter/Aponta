// Marca "Ponto Certo": anel de relógio com um check no lugar dos ponteiros —
// lê-se como "ponto" (tempo) e como aprovação ao mesmo tempo.
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="37" />
      <line x1="50" y1="8" x2="50" y2="19" />
      <polyline points="31,52 45,66 71,35" />
    </svg>
  );
}
