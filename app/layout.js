import './globals.css';
import { Inter } from 'next/font/google';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'QuickLoot.net - Compare Prices, Save More',
  description: 'Find the best deals from Amazon, eBay, AliExpress and hundreds of online stores. Compare prices and save money.',
  keywords: 'price comparison, best deals, shopping, amazon, ebay, aliexpress, compare prices',
  openGraph: {
    title: 'QuickLoot.net - Compare Prices, Save More',
    description: 'Find the best deals from hundreds of online stores.',
    type: 'website',
    url: 'https://quickloot.net',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </head>
      <body className={inter.className}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
