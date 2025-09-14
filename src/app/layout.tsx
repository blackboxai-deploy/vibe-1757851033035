import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dinstar SMS Module - CRM Worksuite',
  description: 'SMS Module i integruar me Dinstar Gateway për CRM Worksuite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sq">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}