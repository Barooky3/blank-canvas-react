import { Package, Truck, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

const addBusinessDays = (start: Date, days: number): Date => {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
};

interface DeliveryInfoProps {
  method?: 'standard' | 'express';
}

export const DeliveryInfo = ({ method = 'standard' }: DeliveryInfoProps) => {
  const { t } = useLanguage();
  const today = new Date();
  const orderDate = today;
  const orderReadyEnd = addBusinessDays(today, 1);
  const deliveryStart = addBusinessDays(today, method === 'express' ? 2 : 4);
  const deliveryEnd = addBusinessDays(today, method === 'express' ? 4 : 6);

  const steps = [
    {
      icon: Package,
      label: t('delivery.ordered'),
      date: formatDate(orderDate),
      active: true,
    },
    {
      icon: Truck,
      label: t('delivery.orderReady'),
      date: `${formatDate(orderDate)} – ${formatDate(orderReadyEnd)}`,
      active: false,
    },
    {
      icon: MapPin,
      label: t('delivery.delivered'),
      date: `${formatDate(deliveryStart)} – ${formatDate(deliveryEnd)}`,
      active: false,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border border-accent/30 px-5 py-4"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <Clock className="h-5 w-5 text-accent" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {t('delivery.orderToday')}
            </p>
            <p className="text-sm text-foreground/80">
              <span className="font-bold text-accent">{formatDate(deliveryStart)}</span>
              {' '}{t('delivery.and')}{' '}
              <span className="font-bold text-accent">{formatDate(deliveryEnd)}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Timeline steps */}
      <div className="relative flex items-start justify-between px-2">
        {/* Connecting line */}
        <div className="absolute top-5 left-[calc(16.67%)] right-[calc(16.67%)] h-[2px] bg-border/60">
          <div className="h-full w-[33%] bg-accent rounded-full" />
        </div>

        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.1 }}
            className="relative flex flex-col items-center text-center flex-1"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                step.active
                  ? 'bg-accent text-accent-foreground shadow-[0_0_16px_hsl(var(--accent)/0.4)]'
                  : 'bg-secondary border border-border/60 text-muted-foreground'
              }`}
            >
              <step.icon className="h-[18px] w-[18px]" strokeWidth={step.active ? 2.5 : 1.5} />
            </div>
            <p className={`text-[11px] mt-2 font-semibold tracking-wide ${step.active ? 'text-accent' : 'text-foreground/70'}`}>
              {step.label}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {step.date}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
