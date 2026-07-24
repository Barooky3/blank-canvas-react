import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
const logo = '/images/logo.png';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialLinks = [
  { icon: TikTokIcon, href: 'https://www.tiktok.com/@fragranceprofs', label: 'TikTok' },
];

export const Footer = () => {
  const { t } = useLanguage();

  const footerLinks = {
    shop: [
      { label: t('footer.menCollection'), href: '/shop/men' },
      { label: t('footer.womenCollection'), href: '/shop/women' },
      { label: t('footer.allProducts'), href: '/shop' },
    ],
    support: [
      { label: t('footer.contactUs'), href: '/contact' },
      { label: t('footer.privacyPolicy'), href: '/privacy-policy' },
      { label: t('footer.returnsRefunds'), href: '/return-policy' },
      { label: t('footer.termsOfService'), href: '/terms-of-service' },
      { label: t('footer.faq'), href: '/#faq' },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Parfumistry" width={800} height={533} loading="lazy" className="h-20 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">{t('footer.description')}</p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors" aria-label={social.label}>
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase mb-5 text-accent">{t('footer.shop')}</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase mb-5 text-accent">{t('footer.support')}</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase mb-5 text-accent">{t('footer.stayUpdated')}</h4>
            <p className="text-sm text-primary-foreground/70 mb-4">{t('footer.subscribeDesc')}</p>
            <form className="flex">
              <input type="email" placeholder={t('footer.enterEmail')} className="flex-1 h-12 px-4 bg-transparent border border-primary-foreground/20 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent" />
              <Button type="submit" className="h-12 px-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-none">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-14 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} Parfumistry. {t('footer.rights')}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-primary-foreground/40">{t('footer.secureCheckout')}</span>
              <div className="flex items-center gap-2">
                <div className="bg-primary-foreground/10 px-2 py-1 rounded text-[10px] font-medium">PayPal</div>
                <div className="bg-primary-foreground/10 px-2 py-1 rounded text-[10px] font-medium">Visa</div>
                <div className="bg-primary-foreground/10 px-2 py-1 rounded text-[10px] font-medium">MC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
