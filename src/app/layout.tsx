import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aponta',
  description: 'Justificativas de ponto e chamados com o RH',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
