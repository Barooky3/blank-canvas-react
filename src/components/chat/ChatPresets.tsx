import { HelpCircle } from 'lucide-react';

interface Preset {
  question: string;
  answer: string;
}

const presets: Preset[] = [
  {
    question: "Are these perfumes authentic / why are they so cheap?",
    answer: "The perfumes come from a grey market supplier. Shops often have to get rid of old stock to make space for new stock. These shops then sell their old stock in bulk at ridiculously low prices to grey market suppliers. A normal perfume lasts for 8 years before expiry, the ones we sell lasts for 3-6 years before expiry, so these have the same smell and last 7-8 hours on skin just like the original, but with reduced shelf life meaning they expire earlier. Thats why we can sell for so cheap. You get dhl tracking number after ordering and you can also return if you don't like em or have issues, we have a full return and refund policy on the site\n\n[link:/return-policy:Read our Return & Refund Policy]"
  },
  {
    question: "What is the shipping like?",
    answer: "Shipping times take around 4–6 business days to all countries in the EU and UK, and 6–8 business days outside of the EU."
  },
  {
    question: "How can I track my package?",
    answer: "After ordering, you receive a DHL tracking number and updates about your order."
  },
  {
    question: "What if I don't like the fragrance?",
    answer: "We offer a relatively flexible return and refund policy. You can read more about it on our Return Policy page, or ask us here for details!"
  },
  {
    question: "Why are the payment methods different?",
    answer: "Since I'm currently under 17, I don't have access to a proper bank account yet. This means I'm unable to set up traditional payment processing (like credit card terminals or direct bank transfers).\n\nFor now, Rewarble codes and app-based payments are the only way I can securely accept payments. I know it's not the most convenient — but there's not much I can do. If you're in doubt or don't trust it, please do some research on Rewarble, and don't hesitate to ask me questions on TikTok if you're confused!\n\nAs soon as I'm able to open a bank account, normal payment methods (card payments, direct PayPal, cash on delivery, etc.) will be added right away."
  },
  {
    question: "I don't know what to choose!",
    answer: "No worries! Just type your message below and tell us what you're looking for — your goals, the occasion, or what kind of scent you like — and we'll help you pick the perfect fragrance!"
  }
];

interface ChatPresetsProps {
  onSelect: (question: string, answer: string) => void;
}

const ChatPresets = ({ onSelect }: ChatPresetsProps) => {
  return (
    <div className="py-2 space-y-2">
      <p className="text-xs text-muted-foreground text-center">Quick answers:</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => onSelect(preset.question, preset.answer)}
            className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-muted/50 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left leading-tight"
          >
            {preset.question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatPresets;
