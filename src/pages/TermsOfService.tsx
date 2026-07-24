const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4 text-center">
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-12 text-center">
            Last updated: February 2026
          </p>

          <div className="space-y-10 text-foreground">
            <section>
              <h2 className="font-display text-2xl mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Parfumistry, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">2. Nature of Products</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Parfumistry offers a curated selection of premium fragrances. When you make a purchase:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>You are purchasing fragrances from our collection</li>
                <li>All products are sourced from trusted suppliers</li>
                <li>Delivery times may vary depending on your location</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">3. Returns & Refund Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We want you to be happy with your purchase. Refunds or returns may be granted under the following conditions:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>There is a verified issue with delivery (e.g. lost, damaged, or incorrect item)</li>
                <li>The product has been used minimally — less than 5ml of the fragrance has been consumed</li>
                <li>The return request is submitted within 30 days of receiving your order</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To request a return or refund, please contact us through our Contact page with your order number and a brief description of the issue. Refunds are processed within 5-10 business days once approved.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">4. Shipping & Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                Delivery times vary depending on your location. We aim to process and dispatch all orders within 1-3 business days. Parfumistry is not liable for delays caused by postal or courier services, customs, or other factors outside our control.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">5. Account Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you create an account with us:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on Parfumistry, including but not limited to text, graphics, logos, images, and software, is the property of Parfumistry or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Parfumistry shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. This includes damages for loss of profits, data, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the European Union. Any disputes arising from these terms shall be resolved in the appropriate courts of the EU.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on this page. Your continued use of the service after any changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our Contact page. We will respond to your inquiry as soon as possible.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
