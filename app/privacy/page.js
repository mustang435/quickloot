import Link from 'next/link';
import { Zap, ArrowLeft, Shield, Lock, Eye, Database, Cookie, Globe, Mail, FileText } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - QuickLoot.net',
  description: 'Learn how QuickLoot.net collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8" />
              <h1 className="text-3xl font-black">Privacy Policy</h1>
            </div>
            <p className="text-white/80">Last updated: January 2025</p>
          </div>

          {/* Policy Content */}
          <div className="px-8 py-10 prose prose-gray max-w-none">
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">1. Introduction</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Welcome to QuickLoot.net. We are committed to protecting your personal information and your right to privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">2. Information We Collect</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited, time spent, and search queries.</li>
                <li><strong>Device Information:</strong> Browser type, IP address, operating system, and device identifiers.</li>
                <li><strong>Cookies:</strong> Small data files stored on your device to enhance your experience.</li>
                <li><strong>Contact Information:</strong> If you contact us, we may collect your name and email address.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">3. How We Use Your Information</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide and maintain our price comparison service</li>
                <li>Improve and personalize your experience</li>
                <li>Analyze usage patterns to enhance our website</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Cookie className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">4. Cookies and Tracking</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">We use the following types of cookies:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                You can control cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">5. Data Security</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Rate limiting and brute force protection</li>
                <li>Regular security audits</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">6. Your Rights (GDPR)</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-3">Under GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request copies of your personal data.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data.</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten").</li>
                <li><strong>Restrict Processing:</strong> Request limitation of data processing.</li>
                <li><strong>Data Portability:</strong> Request transfer of your data.</li>
                <li><strong>Object:</strong> Object to processing of your data.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-800 m-0">7. Contact Us</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mt-3 border border-gray-200">
                <p className="text-gray-700 font-medium">QuickLoot.net</p>
                <p className="text-gray-600">Email: privacy@quickloot.net</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">8. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date.
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
