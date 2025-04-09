import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="content-wrapper page-wrapper">
      <div className="page-container py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-gray-300">
                At Entropy AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our website and services. Please read this privacy policy 
                carefully. By using Entropy AI, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <h3 className="text-xl font-medium text-white mt-6 mb-3">Code and Content</h3>
              <p className="text-gray-300 mb-4">
                When you use our code review and analysis services, we collect:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Code snippets you submit for review</li>
                <li>Programming language preferences</li>
                <li>Analysis results and feedback</li>
                <li>Usage patterns and interactions with our tools</li>
              </ul>

              <h3 className="text-xl font-medium text-white mt-6 mb-3">Technical Data</h3>
              <p className="text-gray-300 mb-4">
                We automatically collect certain information when you visit our website:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage statistics and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use the collected information for:</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Providing and improving our code analysis services</li>
                <li>Training and improving our AI models</li>
                <li>Personalizing your experience</li>
                <li>Analyzing usage patterns to improve our services</li>
                <li>Communicating with you about our services</li>
                <li>Ensuring the security and integrity of our platform</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organizational security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data storage and processing practices</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-300 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Service providers who assist in our operations</li>
                <li>Law enforcement when required by law</li>
                <li>Third-party analytics services</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
              <p className="text-gray-300 mb-4">
                We use cookies and similar tracking technologies to improve your experience and collect usage data. 
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300">
                Our services are not intended for users under the age of 13. We do not knowingly collect information 
                from children under 13. If you become aware that a child has provided us with personal information, 
                please contact us.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              {/* <div className="mt-4 text-gray-300">
                <p>Email: contact@entropy-ai.com</p>
                <p>Website: <Link to="/" className="text-cyan-500 hover:text-cyan-400">www.entropy-ai.com</Link></p>
              </div> */}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 