export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device (computer, smartphone, tablet). They are created by websites 
              you visit and are used to store information about your browsing habits, preferences, and interactions with that website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. The Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication Cookies:</strong> To keep you logged in to your account</li>
              <li><strong>Session Cookies:</strong> To track your session and remember your preferences</li>
              <li><strong>Security Cookies:</strong> To prevent fraud and protect your data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Functional Cookies</h3>
            <p>
              These cookies enable us to remember choices you've made and provide enhanced, more personalized features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Language preferences</li>
              <li>UI customization settings</li>
              <li>Demo usage tracking (for free tier limits)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Analytics Cookies</h3>
            <p>
              These cookies help us understand how you use the Service and improve performance:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Page views and navigation patterns</li>
              <li>Feature usage statistics</li>
              <li>Performance metrics</li>
              <li>Error tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Managing Cookies</h2>
            <p>
              You can control cookie settings through your browser. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View what cookies have been set</li>
              <li>Clear individual cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all third-party cookies</li>
              <li>Delete cookies when you close your browser</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Note:</strong> Disabling essential cookies may impact the functionality of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Third-Party Cookies</h2>
            <p>
              We may use third-party services that place cookies on your browser for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processing (Stripe)</li>
              <li>Analytics tracking (Google Analytics)</li>
              <li>Error monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. HTTPOnly Cookies</h2>
            <p>
              We use HTTP-Only cookies for sensitive authentication data, which means they cannot be accessed by JavaScript, 
              providing protection against cross-site scripting (XSS) attacks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Duration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for extended periods (typically 30 days to 2 years)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Do Not Track</h2>
            <p>
              We respect the "Do Not Track" signals from your browser. If you enable DNT, we will not track your activity for analytics purposes.
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
