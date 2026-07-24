const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4 text-center">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12 text-center">
            Last updated: February 2026
          </p>

          <div className="space-y-10 text-foreground">
            <section>
              <h2 className="font-display text-2xl mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you make a purchase on Parfumistry, we collect the following information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Email address (for order confirmation and shipping updates)</li>
                <li>Name and billing address (for payment processing)</li>
                <li>Payment information (processed securely through our payment providers)</li>
                <li>Purchase history (to manage your orders and returns)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Deliver your orders and products to you</li>
                <li>Send order confirmations and updates</li>
                <li>Respond to customer service inquiries</li>
                <li>Improve our website and services</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal information. Payment processing is handled by trusted third-party providers who comply with PCI DSS standards. We do not store your complete payment card information on our servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">4. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies to enhance your browsing experience, remember your preferences (such as currency selection), and maintain your shopping cart. You can disable cookies in your browser settings, though this may affect some website functionality.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information with third-party service providers who assist us in operating our website, processing payments, and delivering our services. These providers are contractually obligated to protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Under GDPR and other applicable laws, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us through our Contact page. We will respond to your inquiry within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
