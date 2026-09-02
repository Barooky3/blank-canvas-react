import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { WhyCheapAnswer } from '@/components/faq/WhyCheapAnswer';

const faqs = [
  {
    question: "Why are the fragrances so cheap, is there a catch?",
    answer: "why-cheap"
  },
  {
    question: "How can I know my package will be shipped?",
    answer: "packaging-video"
  },
  {
    question: "What is the shipping like?",
    answer: "Shipping times take around 4–6 business days to all countries in the EU and UK, and 6–8 business days outside of the EU. Express delivery times is 2-4 business days worldwide."
  },
  {
    question: "How can I track my package?",
    answer: "After ordering, you receive a DHL tracking number and updates about your order."
  },
  {
    question: "What if i dont like the fragrance or change my mind?",
    answer: "return-policy"
  },
  {
    question: "What if i dont know what to choose?",
    answer: "tiktok-help"
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen py-14 md:py-20 bg-background">
      <div className="container">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
              <HelpCircle className="h-6 w-6 text-accent" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about ordering, shipping, and returns.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                <AccordionTrigger className="text-sm md:text-base text-foreground text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {faq.answer === "why-cheap" ? (
                    <WhyCheapAnswer />
                  ) : faq.answer === "return-policy" ? (
                    <span>
                      We offer a relatively flexible return and refund policy. Please read it{' '}
                      <Link to="/return-policy" className="text-accent font-medium hover:underline">here</Link>.
                    </span>
                  ) : faq.answer === "tiktok-help" ? (
                    <span>
                      Message us on our{' '}
                      <a href="https://www.tiktok.com/@parfora_xs" target="_blank" rel="noopener noreferrer" className="text-accent font-medium hover:underline">TikTok</a>
                      {' '}and we'll help you choose based on your goals and intended purpose!
                    </span>
                  ) : faq.answer === "packaging-video" ? (
                    <span>
                      As an optional service, we allow customers to see a video of their items being packaged in real time and their name visible, with bonus samples and gifts added if you consent to it being posted. If you{' '}
                      <a href="https://www.tiktok.com/@parfora_xs" target="_blank" rel="noopener noreferrer" className="text-accent font-medium hover:underline">message us on TikTok</a>
                      {' '}and give us your order number and email as soon as you order, we'll send you a video of us packing your exact items with your name showing in the background for authenticity, it will only be posted with your consent.
                    </span>
                  ) : (
                    faq.answer
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground">
              Still have questions? Contact us on{' '}
              <a
                href="https://www.tiktok.com/@parfora_xs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold hover:underline"
              >
                TikTok @parfora_xs
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
