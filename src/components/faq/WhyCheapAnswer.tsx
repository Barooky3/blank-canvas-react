import { Link } from 'react-router-dom';
import { useGeoCity } from '@/hooks/useGeoCity';

/**
 * The answer to the first FAQ ("Why are the fragrances so cheap?").
 * Visitors detected (by IP) as being in Portlaoise see a replica-focused
 * explanation; everyone else sees the standard grey-market explanation.
 */
export const WhyCheapAnswer = () => {
  const { isPortlaoise } = useGeoCity();

  if (isPortlaoise) {
    return (
      <span>
        These are high-quality replica fragrances — inspired-by versions of the designer originals, not the branded bottles themselves. They&apos;re blended to smell the same as the scents you already know, using the same core notes, so on the skin they&apos;re virtually indistinguishable from the originals.{"\n\n"}
        The one trade-off is longevity: because they use a lighter concentration of aroma oils, they may last a little less on the skin than an original — typically a few hours rather than a full day.{"\n\n"}
        They&apos;re made with skin-safe ingredients and carry no risk of skin damage or irritation, so you get the same smell you love, at a fraction of the price, with complete peace of mind.
      </span>
    );
  }

  return (
    <span>
      The perfumes come from a grey market supplier. Shops often have to get rid of old stock to make space for new stock. These shops then sell their old stock in bulk at ridiculously low prices to grey market suppliers.{"\n\n"}
      A normal perfume lasts for 8-15 years before expiry, the ones we sell lasts for 2-5 years before expiry, so these have the normal smell and last 7-8 hours on skin, but with reduced shelf life meaning they expire earlier. Thats why we can sell for so cheap.{"\n\n"}
      The supplier is <a href="https://aurellemarket.com" target="_blank" rel="noopener noreferrer" className="text-accent font-medium hover:underline">aurellemarket.com</a> if youre curious about it, you can sign up so long as you have a valid site to sell on and can buy in bulk, in case you also want to start your own fragrance company.{"\n\n"}
      You get a DHL tracking number after ordering, if you don&apos;t mind us using your name we can post a vid packing your order, and you can also return if you don&apos;t like them or have issues, we have a full return and <Link to="/return-policy" className="text-accent font-medium hover:underline">refund policy</Link> on the site.
    </span>
  );
};
