export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
            <p>
              Elevate Spaces ("we", "us", "our") operates the Service. This page informs you of our policies regarding the collection, 
              use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Types of Data Collected:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Email address, name, phone number, demographic information</li>
              <li><strong>Usage Data:</strong> Browser type and version, IP address, pages you visit, time and date of your visit, time spent on pages</li>
              <li><strong>Image Data:</strong> Images you upload for AI processing (processed for staging only, not stored permanently by default)</li>
              <li><strong>Device Data:</strong> Device type, operating system, device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Use of Data</h2>
            <p>Elevate Spaces uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer care and support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Image Data Privacy</h2>
            <p>
              Any images you upload to Elevate Spaces are processed by our AI system for virtual staging purposes. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Images are sent to Gemini AI API for processing</li>
              <li>Processed images are stored in your account for your review</li>
              <li>You control the retention and deletion of your images</li>
              <li>We do not share your images with third parties without explicit consent</li>
              <li>Images containing personally identifiable information should not be uploaded</li>
              <li>Demo images contain watermarks and are view-only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet is 100% secure. 
              While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Third-Party Service Providers</h2>
            <p>
              We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, 
              perform Service-related services or assist us in analyzing how our Service is used. These third parties have access 
              to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any 
              other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Links to Other Sites</h2>
            <p>
              Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, 
              you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every 
              site you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: privacy@elevate-spaces.com
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500 border-t">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
