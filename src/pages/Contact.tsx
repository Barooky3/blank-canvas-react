import { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: t('contact.messageSent'), description: t('contact.messageSentDesc') });
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-4 uppercase">{t('contact.getInTouch')}</p>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">{t('contact.title')}</h1>
            <p className="text-muted-foreground">
              {t('contact.helpText')}<br />
              <span className="text-sm">{t('contact.orderNote')}</span>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="border border-border p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">{t('contact.yourEmail')}</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="your@email.com" required className="pl-11 h-12 bg-background border-border rounded-none focus:border-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">{t('contact.subject')}</Label>
                <Input id="subject" type="text" placeholder={t('contact.subjectPlaceholder')} required className="h-12 bg-background border-border rounded-none focus:border-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">{t('contact.yourMessage')}</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                  <Textarea id="message" placeholder={t('contact.messagePlaceholder')} required className="pl-11 min-h-[160px] bg-background border-border rounded-none focus:border-foreground resize-none" />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full h-14 text-xs font-medium tracking-[0.15em] uppercase rounded-none gap-2" disabled={isSubmitting}>
                <Send className="h-4 w-4" />
                {isSubmitting ? t('contact.sending') : t('contact.sendMessage')}
              </Button>
            </div>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-8">{t('contact.responseTime')}</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
