export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
        
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Overview</h2>
            <p>
              At Elevate Spaces, we stand behind the quality of our AI virtual staging service. This policy outlines our refund procedures 
              for credit purchases and subscription services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. AI Credit Purchases</h2>
            
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Refund Eligibility</h3>
            <p>
              Requests for refunds on credit purchases must be submitted within 14 days of purchase. Eligibility criteria:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credits have not been used to process images</li>
              <li>No AI staging requests have been submitted using those credits</li>
              <li>The purchase was not a promotional or discounted offer</li>
              <li>No violation of our Terms of Service occurred</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">Partial Refunds</h3>
            <p>
              If you have used some but not all of your purchased credits, we can offer a prorated refund based on:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Number of images processed</li>
              <li>Approximate usage percentage</li>
              <li>Service quality and satisfaction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Subscription Refunds</h2>
            <p>
              Monthly and annual subscriptions have a 7-day money-back guarantee from the date of purchase.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full refund if requested within 7 days of subscription start</li>
              <li>After 7 days, you can cancel anytime (no refund, but no future charges)</li>
              <li>Annual subscriptions may be prorated if canceled after day 7</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Non-Refundable Items</h2>
            <p>The following are non-refundable:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credits that have been fully used for AI processing</li>
              <li>Demo staging sessions (free tier usage)</li>
              <li>Promotional credits or bonus credits</li>
              <li>Photographer booking fees (governed by separate booking agreements)</li>
              <li>Services provided by third-party vendors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Visit your account settings and go to "Billing & Payments"</li>
              <li>Click "Refund Request" next to the transaction</li>
              <li>Provide a reason for your refund request</li>
              <li>Submit your request</li>
              <li>Our support team will review and respond within 5-7 business days</li>
            </ol>
            <p className="mt-4">Alternatively, contact us at: support@elevate-spaces.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Processing Time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests are processed within 5-7 business days</li>
              <li>Refunds are returned to your original payment method</li>
              <li>Bank processing time: 3-5 business days depending on your financial institution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Service Quality Issues</h2>
            <p>
              If you're unsatisfied with the quality of AI staging results, we offer:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free re-processing of images with different AI parameters</li>
              <li>Credit toward future purchases if repeated attempts don't meet expectations</li>
              <li>Full refund in cases of service failure or API errors</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Special Circumstances</h2>
            <p>
              We reserve the right to process refunds outside of this policy's guidelines in cases of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Duplicate charges</li>
              <li>Unauthorized transactions (fraud)</li>
              <li>Technical errors on our part</li>
              <li>Service downtime exceeding 4 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Disputes</h2>
            <p>
              If you dispute a charge with your credit card company, we will cooperate with the chargeback process. 
              However, this may result in temporary or permanent suspension of your account while under investigation.
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
