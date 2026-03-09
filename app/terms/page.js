import Link from 'next/link';
import { Zap, ArrowLeft, FileText, Scale, AlertTriangle, ShoppingBag, ExternalLink, Ban, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - QuickLoot.net',
  description: 'Read the terms and conditions for using QuickLoot.net price comparison service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-7 h-7 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-black text-gray-800">QuickLoot<span className="text-orange-500">.net</span></span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-8 h-8" />
              <h1 className="text-3xl font-black">Terms of Service</h1>
            </div>
            <p className="text-white/80">Last updated: January 2025</p>
          </div>

          {/* Terms Content */}
          <div className="px-8 py-10 prose prose-gray max-w-none">
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">1. Agreement to Terms</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using QuickLoot.net, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access our service.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">2. Description of Service</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                QuickLoot.net is a price comparison platform that aggregates product prices from various online retailers. 
                Our service helps users find and compare prices to make informed purchasing decisions.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li>We do not sell products directly</li>
                <li>We redirect users to third-party retailer websites</li>
                <li>Prices are updated periodically and may not reflect real-time changes</li>
                <li>Product availability is determined by the retailer</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">3. Affiliate Links</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Some links on our website are affiliate links. This means we may receive a commission if you make a purchase 
                through these links. This does not affect the price you pay and helps support our free service.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-3">
                <p className="text-orange-800 text-sm">
                  <strong>Transparency:</strong> We always strive to show you the best prices regardless of affiliate partnerships.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">4. Disclaimer of Warranties</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">
                QuickLoot.net is provided "as is" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Accuracy or completeness of price information</li>
                <li>Availability of products at listed prices</li>
                <li>Uninterrupted or error-free service</li>
                <li>The quality of products sold by third-party retailers</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Ban className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">5. Limitation of Liability</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                QuickLoot.net and its operators shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of the service. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li>Loss of profits or revenue</li>
                <li>Loss of data</li>
                <li>Purchases made based on our information</li>
                <li>Third-party retailer disputes</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">6. User Conduct</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">When using our service, you agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use automated systems to scrape or access our data without permission</li>
                <li>Attempt to circumvent security measures</li>
                <li>Use the service for any illegal purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">7. Changes to Terms</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes 
                by updating the "Last updated" date. Continued use of the service after changes constitutes acceptance 
                of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the European Union, 
                without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of 
                the jurisdiction where QuickLoot.net is registered.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-10">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 QuickLoot.net - All rights reserved
        </div>
      </footer>
    </div>
  );
}
