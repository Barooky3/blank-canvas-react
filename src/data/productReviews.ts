export interface ProductReview {
  id: number;
  name: string;
  text: string;
  verified: boolean;
  rating: number;
  date: string;
}

// STRICT ratio per product (rounded to nearest whole):
// 35% → 5★ | 20% → 4-4.5★ | 25% → 3-3.5★ niche gripes | 15% → 3★ real drawbacks | 5% → 2-2.5★
// 
// 12 reviews: 4×5★, 3×4★, 3×3.5★, 1×3★, 1×2.5★
// 10 reviews: 3×5★, 2×4★, 3×3.5★, 1×3★, 1×2.5★
//  8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
//  7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
//  6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
//  5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
//  4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★

export const productReviews: Record<string, ProductReview[]> = {
  // ===== BUNDLES =====
  // Ratio: 35% 5★, 20% 4-4.5★, 25% 3-3.5★ w/ niche gripes, 15% 3★ w/ real drawbacks, 5% 2-2.5★
  'evening-sweetheart-bundle': [
    { id: 1, name: 'Marcus', text: 'Got this expecting date night perfection but honestly two of the five smell really similar on my skin. The Le Male and Born in Roma blend into each other after an hour. Still decent value but not the variety I hoped for.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 2, name: 'Jordan', text: 'The SWY Intensely and Le Male Elixir alone are worth the price of the whole bundle. Wore the Elixir on a first date and got multiple compliments. These are legit quality oils.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'Dimi_frag', text: 'For the price this is unbeatable. I\'ve tried similar bundles from other oil houses and these are noticeably better in terms of accuracy. Le Male Elixir is almost 1:1. The Most Wanted is a bit weaker than the original though.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 4, name: 'NightOwl22', text: 'Three of the five are absolute bangers. Born in Roma Intense and SWY Intensely are the standouts. Le Male Le Parfum was a little synthetic smelling on first spray but settled nicely.', verified: true, rating: 4.5, date: '1 month ago' },
    { id: 5, name: 'Ryan', text: 'Solid bundle but honestly the "evening" theme is a stretch. Le Male Le Parfum is pretty versatile and not specifically an evening scent. Felt like they just grouped popular ones together. Still smells great though.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'ScentCollector', text: 'Bought all four bundles from this site and Evening Sweetheart is the best one by far. Every single fragrance in here is a compliment magnet. My girlfriend literally stole the Born in Roma from me.', verified: true, rating: 5, date: '5 days ago' },
    { id: 7, name: 'Tomek_PL', text: 'Longevity on the Le Male Elixir is insane, like 10+ hours on clothes. The others are more moderate, maybe 4-6 hours skin. For oils at this price point that\'s perfectly fine.', verified: true, rating: 5, date: '4 weeks ago' },
    { id: 8, name: 'LukasB', text: 'I already had SWY Intensely individually so having it again in the bundle felt redundant. Wish there was an option to swap one out. The other four are great though, especially the Most Wanted.', verified: true, rating: 3, date: '1 month ago' },
  ],
  'young-playboy-bundle': [
    { id: 1, name: 'Tyler', text: 'The Sauvage in here is good but honestly it doesn\'t have that same sharp pepper note as the original. Smells more "smooth" which I guess some people prefer. The 1 Million Elixir is the real star of this set.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 2, name: 'Jake', text: 'Perfect starter pack if you\'re getting into fragrances. Every bottle hits different but they all work. Eros and Le Male Elixir are my daily rotation now.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'Chris', text: 'Bought this as my first real collection. The SWY Absolutely is amazing for casual wear. Only complaint is the Sauvage longevity could be better, maybe 4 hours on my skin.', verified: true, rating: 4, date: '1 month ago' },
    { id: 4, name: 'FragBro99', text: 'This bundle screams "I\'m 19 and going clubbing" which is exactly what I wanted lol. All five are crowd pleasers. None of them are subtle or unique but they don\'t need to be.', verified: true, rating: 4.5, date: '3 weeks ago' },
    { id: 5, name: 'DannyK', text: 'Honestly some of these are a bit too similar. Eros and 1 Million Elixir both give that sweet-fresh vibe. Would\'ve preferred something more contrasting in the lineup. Quality is fine though.', verified: true, rating: 3, date: '4 weeks ago' },
    { id: 6, name: 'MaxScents', text: 'The Le Male Elixir in this set is identical to the one sold individually on this site. Creamy, warm, long lasting. The bundle pricing makes it a no-brainer vs buying separately.', verified: true, rating: 5, date: '1 week ago' },
    { id: 7, name: 'AdrianFR', text: 'Got this for my younger brother\'s birthday. He went absolutely crazy for it. Said the Eros gets him the most compliments at uni. Mission accomplished.', verified: true, rating: 5, date: '6 days ago' },
    { id: 8, name: 'pfraghead', text: 'The name is kinda cringe but the fragrances are solid. 1 Million Elixir is gourmand heaven and the SWY Absolutely has that fresh masculine thing going. Sauvage is just okay in oil form.', verified: true, rating: 3.5, date: '1 month ago' },
  ],
  'sleek-and-clean-bundle': [
    { id: 1, name: 'Alex', text: 'Got this for office wear but honestly the YSL Y is the only one that feels truly "clean" to me. Myself has a sweetness that\'s more date night, and the Armani Code is straight up evening wear. Misleading theme.', verified: true, rating: 3, date: '1 week ago' },
    { id: 2, name: 'Michael', text: 'These are my go-to daily drivers now. All five work perfectly in professional settings. The Sauvage and YSL Y combo alone covers 90% of my needs. Incredible value.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 3, name: 'Daniel', text: 'Quality surprised me for the price. The YSL Myself is really well done, that bergamot-lavender opening is almost identical to my retail bottle. Projection is a bit less but for an oil that\'s expected.', verified: true, rating: 4, date: '1 month ago' },
    { id: 4, name: 'ScentMinimal', text: 'Clean, fresh, and professional. Exactly what was advertised. I reach for the Acqua di Gio most mornings. The whole set has become my work rotation and I haven\'t bought a single retail bottle since.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 5, name: 'OfficeFrag', text: 'YSL Y and Sauvage are the strongest performers here, easily 6-7 hours. The Acqua di Gio is more of a 3-hour scent which is disappointing. Myself sits right in the middle.', verified: true, rating: 3.5, date: '25 days ago' },
    { id: 6, name: 'Tom_H', text: 'Ordered this and the Evening Sweetheart. This one is more versatile for sure. Every scent works day or night. Only gripe is Armani Code smells a bit synthetic compared to retail.', verified: true, rating: 4.5, date: '4 weeks ago' },
    { id: 7, name: 'ReviewerDE', text: 'Nice set but feels like it\'s trying to be too safe. Every fragrance here is a "mass appealer" which means nothing really stands out or surprises you. Good for beginners I guess.', verified: true, rating: 3.5, date: '1 month ago' },
  ],
  'jpg-bundle': [
    { id: 1, name: 'GaultierFan', text: 'Only three bottles for the price feels a bit light compared to the 5-piece bundles. The Le Male Elixir is phenomenal but Le Beau Le Parfum is quite different from what I expected. More coconut-forward than the original.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 2, name: 'Pierre_M', text: 'If you love JPG this is a must. Le Male Elixir and Le Male Le Parfum are the best representations of the originals I\'ve found in oil form. The Elixir especially is spot on with that honey-vanilla DNA.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'FragCollection', text: 'Great trio. Le Male Le Parfum is the most versatile of the three, works any season. Le Beau is specifically summer. And the Elixir is fall/winter beast mode. Smart curation.', verified: true, rating: 4.5, date: '3 weeks ago' },
    { id: 4, name: 'JuanFR', text: 'The value isn\'t as strong as the other bundles since you only get 3 fragrances. Quality is there though, especially the Elixir. Le Beau is nice but I wouldn\'t have chosen it over Scandal or Ultra Male.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'DarkHorse', text: 'Le Male Elixir alone makes this worth it. That creamy lavender-honey combo is addictive. My wife literally asks me to wear it every time we go out. The other two are solid bonuses.', verified: true, rating: 5, date: '4 days ago' },
    { id: 6, name: 'NoseKnows', text: 'Decent set but all three are in the same sweet-masculine family so there\'s not a huge range. If you want variety this isn\'t it. If you want three variations of "warm sweet guy" then go for it.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // ===== INDIVIDUAL FRAGRANCES =====

  // 12 reviews: 4×5★, 3×4★, 3×3.5★, 1×3★, 1×2.5★
  'stronger-with-you-intensely': [
    { id: 1, name: 'vinceNT', text: 'Tested this at Sephora last winter and immediately bought a bottle. The chestnut-toffee combo is genuinely cozy and addictive. My girlfriend keeps stealing sprays off my neck.', verified: true, rating: 5, date: '2 days ago' },
    { id: 2, name: 'marcosR', text: 'My girlfriend literally stole my bottle. Had to buy another one. That is the review.', verified: true, rating: 5, date: '5 days ago' },
    { id: 3, name: 'K_wells', text: 'Nice warm scent. Sits close to the skin after 2 hours which is fine for the office. Not a room-filler but people nearby notice. Adequate.', verified: true, rating: 4, date: '1 week ago' },
    { id: 4, name: 'pfragrance', text: 'Its OK but extremely overhyped online. The toffee-chestnut thing is nice but not groundbreaking. Smells like something you\'d find at a department store sale, not the "top 5 masculine" people claim it is. Decent, not legendary.', verified: true, rating: 3, date: '1 week ago' },
    { id: 5, name: 'JamieL_', text: 'Wore it to a dinner date and she kept leaning in closer the whole evening. Very cozy, slightly boozy. Perfect for cold nights.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 6, name: 'oud_head', text: 'Its OK but if you already have Spicebomb or Ultra Male you\'re covering similar territory. The chestnut note is the only differentiator and it fades fast. Longevity is mid. Wouldn\'t repurchase.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 7, name: 'SimonDK', text: 'The sage in the opening saves this from being another generic sweet designer. Balances the sweetness well. Solid overall, not life-changing.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 8, name: 'Leo_paris', text: 'Decent scent, not great. Does the sweet gourmand thing fine but its pretty linear — smells the same from open to dry down. Gets cloying above 15°C so strictly cold weather for me.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 9, name: 'toffee_king', text: 'Ive gone through 3 bottles since 2019. Signature cold weather scent for me. Nothing else in my 40+ collection gets as many compliments.', verified: true, rating: 5, date: '1 month ago' },
    { id: 10, name: 'nadiaBE', text: 'Bought for my husband and now I wear it more than he does. On women it gives this warm cozy vibe. Only issue is you need to reapply after 4-5 hours which is annoying.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 11, name: 'DaveFrags', text: 'Very overhyped. Its a decent vanilla-toffee scent but at this price there are better options. Gets unbearably sweet and cloying in any temperature above 15°C. Strictly a cold weather scent and even then its not special.', verified: true, rating: 2.5, date: '4 weeks ago' },
    { id: 12, name: 'alicja_PL', text: 'The chestnut note is a bit odd tbh. Like roasted nuts mixed with caramel. Not bad exactly but not something I\'d reach for. Smelled better on paper strips than on skin.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 10 reviews: 3×5★, 2×4★, 3×3.5★, 1×3★, 1×2.5★
  'le-male-elixir': [
    { id: 1, name: 'Jacques_fr', text: 'The honey and lavender opening is divine. Dries down into this warm, slightly animalic vanilla that\'s intoxicating. My favourite from the entire JPG line.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'F_boutique', text: 'The bottle is iconic but the juice is even better. Warm, sweet, slightly dirty in a good way. Everything a JPG should be.', verified: true, rating: 5, date: '5 days ago' },
    { id: 3, name: 'Michel42', text: 'Lavender and tobacco work surprisingly well here. Not as fresh as the original but more interesting. Decent evolution of the line.', verified: true, rating: 4, date: '1 week ago' },
    { id: 4, name: 'scent_sophie', text: 'Bought for my boyfriend and its honestly a bit too intense for everyday. The honey note is thick and can be overwhelming in warm weather. Strictly fall/winter.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 5, name: 'TomUK_89', text: 'I like the opening but the vanilla here smells kinda synthetic to me. The dry down has this slightly plasticky sweetness I can\'t ignore. Might be a skin chemistry thing.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'RaulMadrid', text: 'Beast mode projection. Sprayed at 8am and could still smell it on my jacket at midnight. The honey-tobacco base is gorgeous.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 7, name: 'noseblind99', text: 'Its fine but not sure its worth the hype. Opening is lovely, then after an hour it settles into a generic sweet-vanilla that smells similar to a lot of other things I own. Not as special as people claim.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 8, name: 'lia_scents', text: 'Gives old money vibes in the best way. Like expensive tobacco and honey in a library. Gorgeous for autumn evenings. But again, very seasonal.', verified: true, rating: 4, date: '1 month ago' },
    { id: 9, name: 'fraghead_DE', text: 'The absinth note is interesting but barely perceptible after 20 mins. Becomes a fairly standard honey-vanilla. Performance is good though, 8+ hours.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 10, name: 'marco_AT', text: 'Smells great for 30 minutes then becomes WAY too sweet for me. The honey note goes almost sickly after a while. If you like really sweet fragrances you\'ll love this, I find it headache-inducing.', verified: true, rating: 2.5, date: '4 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'le-male-le-parfum': [
    { id: 1, name: 'MarcelFR', text: 'The cardamom opening sets this apart from every other Le Male. Warm, slightly exotic. Beautiful evolution of the line.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'Henri_B', text: 'Best JPG in my opinion. More complex and sophisticated than the original, less in-your-face than Elixir. The vanilla-leather dry down is gorgeous.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'GastonP', text: 'The leather and vanilla work nicely together. Smells refined without being pretentious. Decent for date nights.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'tyler_nyc', text: 'I own the whole Le Male line and this is probably the least exciting. Its good but sits in this awkward middle ground — not as fresh as the OG, not as bold as Elixir. Just kind of... there.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 5, name: 'sofia_rose', text: 'Bought for my partner and he gets compliments constantly. The iris gives it a powdery elegance thats really attractive on men.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'noseBerlin', text: 'Performance is decent, about 6-7 hours. Not a nuclear projector but does its job. The spiced vanilla dry down is pleasant and inoffensive. Fine.', verified: true, rating: 4, date: '1 month ago' },
    { id: 7, name: 'ahmed_uae', text: 'For the price I expected more. Nice vanilla-spice scent but it doesn\'t do anything 10 other fragrances in my collection don\'t already do. The iris note gives it a powdery quality that feels dated rather than modern.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 8, name: 'laura_IT', text: 'It smells fine on my boyfriend. Has a warm quality but the sillage is moderate at best. Don\'t expect to be noticed from across the room.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'le-male': [
    { id: 1, name: 'Paul_90s', text: 'This is what my dad wore and now I wear it. Absolute classic. The lavender-vanilla combo is timeless and STILL gets compliments 30 years later.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'MartinSE', text: 'OG blue fragrance. Holds up incredibly well compared to modern releases. The mint opening is so refreshing.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'SimonW', text: 'Fresh and sweet. Works for any occasion. Can\'t go wrong with this one honestly.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'nina_scents', text: 'I associate this smell with every guy at the club in 2005 lol. Its fine but SO many people wear it. If you want something that feels unique, this isnt it because every second guy owns a bottle.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'CharlieUK', text: 'Bought it for nostalgia. Still smells as good as I remember. One of the best-balanced fragrances ever made.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'frag_collector', text: 'Its a classic but the longevity on the EDT is quite weak. 3-4 hours and gone. Beautiful scent while it lasts but you\'ll be reapplying.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 7, name: 'BenAU', text: 'Simple, effective, crowd-pleasing. Not complex at all but does what it needs to. Decent value.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 8, name: 'alexis_FR', text: 'Pleasant but feels dated in 2025. The lavender-vanilla combo has been done to death by every house since. Nothing wrong with it but nothing exciting either.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'le-beau-le-parfum': [
    { id: 1, name: 'tropicVibes', text: 'Smells like being on holiday. Coconut, vanilla, something green up top. Not complicated, just really really nice. My summer go-to.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'samG_', text: 'Smells nice but its basically "coconut body lotion: the fragrance." Very one-dimensional — the tropical phase is pleasant but there\'s zero complexity or development. You smell the same thing for hours.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 3, name: 'Lucas_BE', text: 'Blind bought based on a friend\'s rec and I\'m glad I did. Easygoing, clean, slightly sweet. My kind of warm weather fragrance.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 4, name: 'noseknows22', text: 'Pleasant but smells cheap compared to the original retail. The pineapple note has a synthetic edge that the real JPG doesn\'t have. Passable if you\'re not comparing side by side but once you notice it you can\'t unnotice.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'RyanT', text: 'Wore this every day last summer. The pineapple-coconut combo works without being tacky. Gets me compliments from people who normally don\'t comment.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'H_berg', text: 'Nice tropical vibe with some depth from the tonka. Not the most unique scent but well executed for what it is.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 7, name: 'dani_IT', text: 'The green note in the opening is interesting but disappears fast. After 30 mins its basically just sweet coconut-vanilla which you can get from cheaper fragrances. Fine but not special.', verified: true, rating: 3.5, date: '4 weeks ago' },
    { id: 8, name: 'KarenSE', text: 'Bought for my son and he loves it. Youthful without being childish. Good for a casual guy in his 20s.', verified: true, rating: 4, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'le-beau-edt': [
    { id: 1, name: 'JulesP', text: 'Lighter than Le Parfum version but I prefer this for daytime. The bergamot and coconut combo is clean and fresh. Easy reach in summer.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'andreas_GR', text: 'Very pleasant but not unique at all. Smells like nice shampoo honestly. Good for the office but don\'t expect compliments — its just "you smell clean."', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 3, name: 'MaxNL', text: 'Decent summer daily driver. Light, fresh, inoffensive. The tonka gives just enough depth. Longevity about 5-6 hours which is fine for an EDT.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 4, name: 'emma_fraghead', text: 'Bought for my boyfriend and I love how it smells on him. Clean and slightly sweet. Perfect for casual dates.', verified: true, rating: 5, date: '1 month ago' },
    { id: 5, name: 'rodrigo_BR', text: 'Forgettable. In a world with so many amazing summer fragrances this just doesn\'t stand out enough to reach for over alternatives. Nothing wrong with it, nothing special about it.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'cologneJP', text: 'Its fine for what it is but the coconut water note vanishes in 20 minutes and then you\'re left with a generic fresh scent. Hard to justify when the Parfum version exists.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'le-male-elixir-absolu': [
    { id: 1, name: 'JeanLuc', text: 'The rose addition takes this to another dimension. If Elixir is a 9, this is an 11. Stunning composition.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'fragOslo', text: 'The oud adds a niche quality but it takes getting used to. Interesting take on the Elixir formula, different from what you\'d expect from JPG.', verified: true, rating: 4, date: '1 week ago' },
    { id: 3, name: 'SarahMcG', text: 'Bought for my husband and its too intense for everyday. The oud is prominent and polarizing. Beautiful for special occasions but you cant wear this casually.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 4, name: 'perfumista_CZ', text: 'The rose-oud combo is a bit generic in 2025. Every niche house does this and JPG doesn\'t do it better. For the same money I\'d rather get an actual niche fragrance.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'danielW', text: 'Longevity is insane — 14 hours on skin. The honey and rose dry down is gorgeous. Really impressive.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'luka_HR', text: 'Nice but very close to the original Elixir on my skin. Can\'t justify owning both. If you don\'t have Elixir, get this one. If you do, skip.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 7, name: 'mariaBG', text: 'I prefer this on my partner over the regular Elixir. More character and depth. The rose saves it from being just another sweet masculine.', verified: true, rating: 4, date: '4 weeks ago' },
  ],

  // 10 reviews: 3×5★, 2×4★, 3×3.5★, 1×3★, 1×2.5★
  'ysl-y-edp': [
    { id: 1, name: 'alex_ffr', text: 'This immediately became my daily driver. The apple-ginger opening is fresh and punchy, then it settles into this smooth woody base that just works. Compliment magnet.', verified: true, rating: 5, date: '2 days ago' },
    { id: 2, name: 'lukasz_PL', text: 'Blind bought after seeing it on TikTok. Its good. Not mind-blowing but very solid. Safe, versatile, gets compliments. Sometimes thats all you need.', verified: true, rating: 4, date: '5 days ago' },
    { id: 3, name: 'samirUAE', text: 'In hot weather this is great. The apple note is crisp and the ginger gives it enough spice. 3 sprays and you\'re good for 8 hours.', verified: true, rating: 5, date: '1 week ago' },
    { id: 4, name: 'nina_K', text: 'Bought for my brother and he wears it daily. Clean, masculine, pleasant. Not too sweet, not too sharp.', verified: true, rating: 5, date: '1 week ago' },
    { id: 5, name: 'thomasVIE', text: 'Good fragrance but a bit boring honestly. Its the perfectly safe choice that will never offend anyone but also never wow anyone. I prefer something with more personality.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 6, name: 'josh_AU', text: 'Similar vibe to Sauvage but more refined. The sage gives it a green herbal quality that Sauvage lacks. Decent daily alternative.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 7, name: 'LenaDE', text: 'Quite generic tbh. Smells like something Zara could make for €20. Pleasant? Yes. Special? Absolutely not. Longevity is decent though, about 7 hours.', verified: true, rating: 3, date: '1 month ago' },
    { id: 8, name: 'omar_scents', text: 'The amberwood base is nice but not enough to save it from being "another blue fragrance." After the apple fades its pretty standard woody-amber territory.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 9, name: 'carloIT', text: 'Wore it to a job interview. Clean and professional without being invisible. Does the job well even if its not exciting.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 10, name: 'dani_bln', text: 'The definition of "safe pick." Smells exactly like what an algorithm would design if you asked it for "mass-appealing masculine fragrance." Zero personality, zero risk, zero reason to remember it. Aggressively mid.', verified: true, rating: 2.5, date: '4 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★ (+ 1×2.5★ since popular)
  'black-opium': [
    { id: 1, name: 'Chloe_xo', text: 'Coffee and vanilla perfection. Became my signature scent within a week. I get stopped by strangers asking what I\'m wearing. Truly special.', verified: true, rating: 5, date: '2 days ago' },
    { id: 2, name: 'ZoeUK', text: 'Sweet and sultry without being childish. Gets compliments every time I wear it which is rare for me. YSL knew what they were doing.', verified: true, rating: 5, date: '5 days ago' },
    { id: 3, name: 'luna_93', text: 'The orange blossom lift is beautiful but fades fast. After an hour its just sweet coffee-vanilla which is fine but not as interesting as the opening promises.', verified: true, rating: 4, date: '1 week ago' },
    { id: 4, name: 'stellaNL', text: 'Most popular women\'s fragrance for a reason. But also the problem — literally every other girl at my uni wears this. I switched to something less common because I was tired of smelling like everyone else.', verified: true, rating: 3, date: '2 weeks ago' },
    { id: 5, name: 'aurora_ES', text: 'Cozy and enchanting. I layer this with vanilla body lotion and the result is incredible. Perfect for evening wear.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 6, name: 'rach_mel', text: 'I find the coffee note a bit synthetic after a few hours. Opening is gorgeous but the dry down has this slightly chemical quality that bothers me. Might be skin chemistry.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 7, name: 'emmaW_23', text: 'Great for cold weather only. In summer it becomes overwhelmingly sweet and cloying. From October to March its nice though. Very seasonal.', verified: true, rating: 4, date: '1 month ago' },
    { id: 8, name: 'valerieParis', text: 'Way too sweet for my nose. I appreciate the craftsmanship but I prefer fresh/green fragrances and this is the opposite of that. If you love gourmands you\'ll love this, otherwise skip.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'libre': [
    { id: 1, name: 'emma_scent', text: 'Bold and confident. The lavender in a feminine fragrance is unique and just works. Makes me feel powerful every time.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'olivia_AU', text: 'Orange blossom and vanilla executed well. Gets me compliments at work. Modern and elegant.', verified: true, rating: 4, date: '1 week ago' },
    { id: 3, name: 'ava_NYC', text: 'YSL nailed the balance between fresh and warm. I reach for this more than anything else in my collection.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 4, name: 'claireIE', text: 'The lavender-vanilla formula has been done to death. Libre does it competently but there\'s nothing here that makes me think "I need THIS over a dozen similar scents." Very replaceable.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'mia_CH', text: 'On my skin the orange blossom turns soapy and generic within an hour. The opening is lovely but something in my chemistry kills the interesting notes and leaves me with "nice hand soap." Frustrating.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 6, name: 'sophie_DK', text: 'Wore it to an interview and got complimented by the interviewer. It gives this aura of quiet confidence. Not too much, not too little.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 7, name: 'amelie_FR', text: 'Very safe gift choice but thats kind of the problem — its inoffensive to the point of being forgettable. Pleasant while it lasts but doesn\'t leave a lasting impression.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'mon-paris': [
    { id: 1, name: 'marieFR', text: 'Romantic and sweet without being juvenile. The strawberry note is so well done — smells real, not like candy. Wore this on my wedding day.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'claire_bx', text: 'The strawberry-patchouli combo shouldn\'t work but it does. Playful up top, grounded in the base. Well balanced for a fruity floral.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'julie_94', text: 'Gives main character energy walking through Paris in autumn. Soft, sweet, and pretty.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 4, name: 'hannahDE', text: 'Its cute but painfully linear. Smells exactly the same from opening to dry down with zero development. No surprises, no evolution, just strawberry-sweet on repeat for hours. Gets boring fast.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'rebecaNO', text: 'Too sweet for everyday wear. Great for a night out but I can\'t imagine wearing this to the office without it being too much. Very occasion-specific.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'lisa_mel', text: 'Got this as a birthday gift and its fine. The pear and peony are soft but the sillage is weak — nobody ever notices when I wear it, which defeats the purpose.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'myself-edp': [
    { id: 1, name: 'David_FR', text: 'My perfect daily scent. The bergamot and orange blossom opening is fresh and inviting. Smells like clean laundry in the most luxurious way.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'SamuelNL', text: 'Clean and sophisticated. Works for any occasion. The Ambrofix base gives just enough presence without being loud. Solid everyday fragrance.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'nathan_CA', text: 'Wanted to love this more than I do. Its pleasant but really safe and boring. Smells like every other "clean" fragrance on the market. Nothing makes it stand out at all.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 4, name: 'KatjaFI', text: 'Bought for my partner and I love how it smells on him. Modern, fresh, slightly woody. Not trying too hard but noticeable.', verified: true, rating: 5, date: '1 month ago' },
    { id: 5, name: 'JoaoLisboa', text: 'The patchouli in the base adds some depth but not enough to save it from "generic clean fragrance" territory. Longevity about 6-7 hours.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'max_berlin', text: 'Smells exactly like YSL Y to me. Nearly identical after an hour. If you already own Y EDP there is zero reason to buy this. Redundant.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 10 reviews: 3×5★, 2×4★, 3×3.5★, 1×3★, 1×2.5★
  'sauvage-parfum': [
    { id: 1, name: 'chris_sauvage', text: 'The parfum version is genuinely above the EDT and EDP. Richer, smoother, more refined. The sandalwood is gorgeous and gives it a creamy quality the others lack.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'mattCA', text: 'This is the definitive Sauvage. The vanilla in the base makes it warmer and more interesting than the other versions. Well made.', verified: true, rating: 5, date: '5 days ago' },
    { id: 3, name: 'AndrewSYD', text: 'Everyone and their dad wears Sauvage but this version at least adds something. The incense and vanilla depth helps. Still, don\'t expect to be unique wearing this.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 4, name: 'JoshNZ', text: 'Compliment getter guaranteed. The Honda Civic of fragrances — reliable, efficient, everyone likes it. Does the job without fuss.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 5, name: 'omar_cologne', text: 'So tired of smelling this everywhere. Every uber driver, every gym bro. Good scent, I get it, but I\'m completely over it. If you want to smell like 10 million other guys, go ahead.', verified: true, rating: 2.5, date: '3 weeks ago' },
    { id: 6, name: 'erikSE', text: 'The bergamot and sandalwood combo is smooth. Out of all versions this feels most luxurious. Longevity is crazy too — easily 10+ hours.', verified: true, rating: 5, date: '1 month ago' },
    { id: 7, name: 'anna_PL', text: 'Bought for my husband and he smells decent. Not overwhelming, not invisible. Just consistently... there. I prefer this over the EDT which gave me headaches.', verified: true, rating: 4, date: '1 month ago' },
    { id: 8, name: 'kevin_frag', text: 'Solid but linear. The elemi and bergamot opening is nice but after that it settles into a smooth woody-vanilla that doesn\'t evolve at all. 8 hours of the same thing.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 9, name: 'nicolaBG', text: 'Office-friendly Sauvage. Not as aggressive as the EDT. I get about 8 hours with moderate projection. Perfectly adequate for work and nothing more.', verified: true, rating: 3.5, date: '4 weeks ago' },
    { id: 10, name: 'amelieFR', text: 'Its fine. Not revolutionary. Just a solid sandalwood fragrance with the Dior tax. You\'re paying for the name more than anything special about the juice.', verified: true, rating: 3, date: '4 weeks ago' },
  ],

  // 10 reviews: 3×5★, 2×4★, 3×3.5★, 1×3★, 1×2.5★
  'aventus': [
    { id: 1, name: 'AlexGOAT', text: 'The pineapple, birch, and musk combo is iconic. Been wearing since 2014 and it still gets compliments. Deserves the reputation.', verified: true, rating: 5, date: '2 days ago' },
    { id: 2, name: 'SebastianK', text: 'Pineapple opening is smooth, then shifts into smoky birch. Every bottle smells slightly different which is annoying but also part of the charm.', verified: true, rating: 5, date: '5 days ago' },
    { id: 3, name: 'mason_IL', text: 'Got a recent batch and its not as good as it used to be. The pineapple is weaker and the birch is almost gone. Creed has been reformulating and it shows. Not what it was in 2015.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 4, name: 'HenryUK', text: 'The smoky dry down is what makes this special. Lots of pineapple fragrances now but none have that birch-moss combo. Worth it.', verified: true, rating: 5, date: '1 week ago' },
    { id: 5, name: 'Jack_frag', text: 'CEO energy. I put this on before meetings and it makes me feel confident. 8+ hours with good projection for the first 3-4. Performs.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 6, name: 'leila_scents', text: 'I dont get the hype. Its a fruity-smoky scent. For the price you can get 5 Mancera bottles. The batch variation issue is also really annoying — you never know what you\'re getting.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 7, name: 'tomaszPL', text: 'Decent performer. 10+ hours on clothes. But the scent itself? Its pleasant, not life-changing. The mystique around this fragrance has inflated expectations beyond what the juice delivers.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 8, name: 'rashidKW', text: 'Overpriced. CDNIM gets you 80% there for 10% of the price. Unless you need the Creed name on your shelf, there are smarter ways to spend your money.', verified: true, rating: 2.5, date: '1 month ago' },
    { id: 9, name: 'claire_89', text: 'Smells incredible on my husband. Confident and masculine without being aggressive. The kind of scent that makes you want to lean closer.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 10, name: 'nikolai_CY', text: 'Its a good fragrance elevated by incredible marketing and community hype. Objectively? Its a solid fruity-woody. But "greatest of all time"? Come on.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'aventus-absolu': [
    { id: 1, name: 'DanielZH', text: 'Deeper and richer than the original. The added oud and spices give it a niche quality. My new favourite from Creed.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'MatthewUS', text: 'Longevity is insane. 12+ hours easy. The dark fruit and leather combo is gorgeous.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'AidenUK', text: 'Interesting evolution but feels over-engineered — too many notes fighting for attention. The original had an elegant simplicity this one lacks.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 4, name: 'sergioMI', text: 'I prefer the original. This is good but unnecessary if you already own Aventus. Doesn\'t add enough to justify the premium.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'jenny_frag', text: 'The oud note is well done — not harsh or medicinal. Adds warm woody depth. Worth considering if you don\'t already own the original.', verified: true, rating: 4, date: '3 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'amore-caffe': [
    { id: 1, name: 'caffelatte', text: 'Smells like walking into an Italian coffee shop on a cold morning. Warm espresso, vanilla, cream. I reach for this constantly from October through March.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'EmmK', text: 'Coffee note is realistic which I appreciate. Only issue is projection dies after the first hour. Becomes very intimate very quickly. Fine if you like that but I wanted more.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 3, name: 'Noor_S', text: 'Really cozy and comforting. Reminds me of a vanilla latte. Wore it to work and two people complimented it which basically never happens to me.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 4, name: 'isabellaR', text: 'Kind of one-note. Coffee and vanilla from start to finish, no development. If you love gourmands you\'ll enjoy it but it can feel repetitive after a while. Nothing changes over 8 hours.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'lucasW', text: 'Great scent but the coffee note turns almost burnt and acrid on my skin after 2 hours. Smells amazing on paper and on my friend but my body chemistry does something weird. Frustrating when a scent works on everyone except you.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 6, name: 'danieleM', text: 'The espresso note isn\'t bitter at all, blends into this sweet creamy thing. One of the better Mancera releases. Decent daily for cold weather.', verified: true, rating: 4, date: '4 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'born-in-roma-intense': [
    { id: 1, name: 'roma_kid', text: 'The smoked vanilla is gorgeous. Darker and richer than the original BIR. The ginger adds unexpected warmth. My favourite flanker.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'JayFrag', text: 'Warm spicy opening settles into deep vanilla-woody. Lasts 8+ hours which is unusual for Valentino. Impressed.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'MikeB_90', text: 'Almost too sweet for my taste. The vanilla is HEAVY and after a few hours it starts feeling cloying. Only works in small doses during very cold weather.', verified: true, rating: 3.5, date: '2 weeks ago' },
    { id: 4, name: 'scent_sophie', text: 'Wore this on a night out and got asked about it. Warm spicy vibe works in cold months. Not great for summer though — strictly seasonal.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 5, name: 'TobiasL', text: 'The ginger kick up top is nice. Dries down into smoky vanilla thats different from anything else I own. Solid.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'alessio_fr', text: 'Expected more complexity from the "Intense" version. Its basically the original but louder and sweeter. If thats what you want great, but its not more refined or interesting.', verified: true, rating: 3, date: '1 month ago' },
    { id: 7, name: 'ChrisW_UK', text: 'Enjoy this for evenings. The amber and vanilla give it a luxurious feel without being too niche. Crowd pleaser.', verified: true, rating: 4, date: '4 weeks ago' },
    { id: 8, name: 'fabioRO', text: 'Had high expectations from YouTube reviews and it didn\'t quite meet them. Nice vanilla-spice scent but not "best date night fragrance ever" like everyone claims. Above average, thats it.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'born-in-roma': [
    { id: 1, name: 'LeoIT', text: 'Clean but sexy. The violet leaf gives it a fresh quality that works for daytime. Goes from office to dinner seamlessly.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'CalebSA', text: 'The violet-vetiver combo is decent but nothing groundbreaking. Works as a daily driver, won\'t turn heads.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'OwenIE', text: 'Nothing spectacular but nothing bad. Does the clean-masculine thing competently. Won\'t wow anyone though.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'sergioES', text: 'Really forgettable honestly. Wore it for a week and not a single person noticed. The violet-sage combo is pleasant but lacks any personality or DNA that makes it distinctly "Valentino." Could be any brand.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'anna_milan', text: 'I love this on men. Fresh, modern, and just attractive without being overwhelming. Perfect for someone who wants to smell put-together.', verified: true, rating: 5, date: '4 weeks ago' },
    { id: 6, name: 'fredrikNO', text: 'Good all-rounder but fades fast on me. The sage is nice at first but by hour 3 its just a faint woody skin scent. Expected more from Valentino.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'born-in-roma-green-stravaganza': [
    { id: 1, name: 'LucaRM', text: 'Smells like a walk through an Italian garden. The green notes are fresh and natural. Really different from the other BIR flankers.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'jakobDK', text: 'Interesting herbal take on the BIR DNA. Works in spring and summer. Not a winter scent though.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'chris_MEL', text: 'Too "green" for my taste. Smells like freshly cut grass mixed with herbs. If you\'re into that its probably great, not for me.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 4, name: 'elenaMD', text: 'Surprisingly versatile for how fresh it smells. The vetiver base grounds it nicely. Underrated in the line.', verified: true, rating: 5, date: '1 month ago' },
    { id: 5, name: 'paul_frag', text: 'Smells like someone blended a mojito with a garden salad. The green-herbal thing is fine conceptually but on my skin it becomes weirdly vegetal. Not what I\'d call attractive. Very niche taste.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'born-in-roma-coral-fantasy': [
    { id: 1, name: 'RomeoIT', text: 'The grapefruit opening is refreshing. My go-to summer fragrance now. Bright, energetic, puts me in a good mood.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'LeonardoBR', text: 'Works surprisingly in winter too. The vanilla base gives enough warmth. Very versatile — wore this daily for 3 months.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'AlessandroNA', text: 'Good balance between fresh and sweet. Valentino nailed the formula here. Solid.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'matteoMI', text: 'Contemporary and fresh but nothing groundbreaking. After an hour becomes a generic citrus-vanilla skin scent. The opening 30 minutes are great, then it disappoints.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'oliver_AMS', text: 'Pleasant but unmemorable. In a lineup of citrus fragrances this wouldn\'t stand out. Fine for everyday but don\'t expect to be noticed.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'KarinaSE', text: 'Bought for my boyfriend and the opening is nice. But the dry down is identical to every other Valentino flanker he owns. At some point these "new releases" just start cannibalising each other. Get one BIR and skip the rest.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'spicebomb-extreme': [
    { id: 1, name: 'ViktorFan', text: 'Explosive entrance, smooth finish. The tobacco-vanilla dry down is perfect. This scent made me fall in love with fragrances.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'RolfDE', text: 'Rated as one of the most attractive fragrances in multiple surveys. Can confirm — this thing is a weapon in cold weather.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'HansCH', text: 'Dark and intense. Pepper-cinnamon opening punches you then settles into sweet tobacco. Makes you feel powerful. Decent.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'FranzAT', text: 'Winter essential but it can be too much indoors. Wore 4 sprays to an office party and it was overwhelming. 2 sprays max. Easy to overdo it.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 5, name: 'nataliePL', text: 'My husband wears this and I find the vanilla-tobacco attractive. He gets compliments regularly.', verified: true, rating: 4, date: '1 month ago' },
    { id: 6, name: 'mikeToronto', text: 'Good but smells very similar to a lot of other spicy-vanillas on the market. Nothing uniquely Spicebomb about it once you strip away the cool grenade bottle. Performance is solid though.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 7, name: 'lucaBG', text: 'Expected more from the name "Extreme." Its actually quite sweet and mild in the dry down. I wanted something more challenging and got a crowd pleaser. Disappointing.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'the-most-wanted-parfum': [
    { id: 1, name: 'LucasMad', text: 'The ginger fizz opening is genuinely unique — smells like ginger ale mixed with warm vanilla. Compliment machine in cold weather.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'HugoVIE', text: 'Perfect winter comfort scent. Like a warm vanilla hug on a freezing day. The bourbon vanilla base is well done.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'FelixDE', text: 'The toffee note is addictive. Can\'t stop sniffing my wrist. The ginger keeps it from being too sweet which is smart.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'OscarNL', text: 'Popular for a reason but very linear. Smells the same from start to finish. Good scent but I wish there was more development. Just ginger-vanilla for 8 hours.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'rebecaSP', text: 'Bought for my boyfriend after smelling it on a stranger. Sweet, warm, inviting.', verified: true, rating: 5, date: '1 month ago' },
    { id: 6, name: 'danielAR', text: 'Too sweet for anything other than winter evenings. In any warmth it becomes sickly and overwhelming. Very seasonal — useless for 6 months of the year.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 7, name: 'yuriJP', text: 'The woody notes give it more depth than expected. Not just a sweet scent. Decent from Azzaro.', verified: true, rating: 4, date: '4 weeks ago' },
    { id: 8, name: 'christinaGR', text: 'I work at a department store and everyone tests this. They like it but the bottle looks cheap which puts buyers off. The juice is fine but the presentation lets it down.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'the-most-wanted-edp-intense': [
    { id: 1, name: 'MaxBXL', text: 'More intense than the regular TMW and I prefer it. The cardamom-toffee combo gives masculine sweetness without being juvenile.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'LeoTR', text: 'Spicy and warm in a playful way. Azzaro found the balance between "gym bro sweet" and "date night sophisticated." Solid.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'FelixAT', text: 'Azzaro keeps making decent stuff that nobody notices because the brand isn\'t "cool" enough. This deserves more attention.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 4, name: 'ryanIE', text: 'Very similar to the regular Parfum version but louder. I struggle to justify owning both. If you\'re choosing between them, get this one.', verified: true, rating: 4, date: '1 month ago' },
    { id: 5, name: 'laraCA', text: 'Gifted to my brother and he says its fine. The amberwood base is warm. Not amazing, not bad. Just... adequate.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 6, name: 'niklasDE', text: 'Pleasant but extremely sweet. Like sticking your nose in a bag of toffees. Found it one-dimensional and a bit juvenile for my taste.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 7, name: 'evaHU', text: 'The cardamom opening is the star but it fades into generic sweetness after an hour. That first hour is beautiful, the remaining 7 are just fine.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'althair': [
    { id: 1, name: 'ThomasMUC', text: 'Not your basic vanilla. Creamy, rich, almost gourmand but with enough freshness to keep it elegant. PDM know how to do vanilla. Up there with Layton for me.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'NoahUS', text: 'Three people asked me what I\'m wearing on day one. The pistachio note adds something special. Compliment magnet.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'OliverSE', text: 'Worth the investment. Doesn\'t smell synthetic at any stage. 10+ hours on me with good projection for the first 4-5.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'EthanCA', text: 'Bought after smelling it on someone. Its nice but for the PDM price I expected something more exciting. Good vanilla fragrance, similar ones exist for less.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'julia_scent', text: 'Tried this hoping for the "ultimate vanilla" and it didn\'t live up. The tonka is dominant and makes it smell a bit powdery and old-fashioned. Not what I wanted from a modern PDM release.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'aoud-lemon-mint': [
    { id: 1, name: 'DavidHK', text: 'Perfect summer scent when you want fresh but interesting. The oud-citrus combo is unexpected and works well. Not your typical fresh fragrance.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'sarahNZ', text: 'The mint is refreshing and decent for hot days when you want to smell sophisticated. Works for summer office wear.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'JamesME', text: 'Unique combo but the oud and citrus fight each other on my skin. After 2 hours I get this weird medicinal quality that I dont love. Might be skin chemistry.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 4, name: 'karenBE', text: 'Interesting but niche. Not a crowd pleaser — the oud polarizes people. My husband loves it but his friends think it smells "too exotic." Know your audience.', verified: true, rating: 3.5, date: '1 month ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'aoud-vanille': [
    { id: 1, name: 'WilliamLDN', text: 'Rich and creamy. The oud adds an interesting woody dimension to vanilla. Like vanilla for adults. Nothing else in my collection has this vibe.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'MiaCPH', text: 'Cozy winter vibes in a bottle. The oud-vanilla combo is addictive. Gets me through cold Scandinavian winters.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'BenjaminZH', text: 'Warm and sensual. The oud isn\'t harsh here — smooth and well-integrated. Decent for dinner dates.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 4, name: 'charlotte_FR', text: 'The sillage is incredible which is also the downside. 2 sprays max or you\'ll choke everyone around you. I got complaints at the office. Use sparingly.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'kevinRO', text: 'Too heavy for my taste. The oud overpowers the vanilla on my skin and becomes this dense woody cloud. If you have warm skin chemistry this might not work.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  '1-million-elixir': [
    { id: 1, name: 'rodrigoBR', text: 'Paco Rabanne finally made a mature 1 Million. The apple and rose combo is gorgeous and the vanilla base gives sexy warmth. Better than the original.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'julienFR', text: 'The tuberose is interesting — slightly feminine quality that works well on men. Not what I expected from 1 Million but a pleasant surprise.', verified: true, rating: 4, date: '1 week ago' },
    { id: 3, name: 'alexPT', text: 'Smells good but reminds me too much of the original which I associate with high school. I know this is different but my brain just goes "1 Million" and I feel 16 again.', verified: true, rating: 3, date: '2 weeks ago' },
    { id: 4, name: 'monicaES', text: 'Bought for my partner and the lavender-apple opening is inviting. Settles into warm slightly spicy vanilla. Nice but a bit generic.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 5, name: 'janNL', text: 'Performance is great — 8+ hours. The smoky amber dry down is pleasant. But its too sweet for daytime in my opinion, strictly a night-out scent.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 6, name: 'igorUA', text: 'Wanted to love this but the synthetic quality of the apple note bothers me. It smells artificial in a way the rest of the composition doesn\'t. Slightly distracting.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 7, name: 'danielTR', text: 'Great clubbing fragrance. Projects like a beast and the sweet-spicy profile works for going out. Not subtle at all.', verified: true, rating: 5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  '1-million-parfum': [
    { id: 1, name: 'pedroLIS', text: 'Salty and sweet simultaneously. The solar notes give this a unique quality. Perfect for beach days and summer nights.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'markDUB', text: 'Better than the original Million but less interesting than the Elixir. Sits in a weird middle ground. The salt accord is unique at least.', verified: true, rating: 4, date: '1 week ago' },
    { id: 3, name: 'SofiaGR', text: 'My boyfriend wears this and it smells nice in summer. Fresh with warmth underneath. Decent.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 4, name: 'tobiasCH', text: 'The salt accord is polarizing — on my skin it goes almost metallic and synthetic. My wife said it smells like "pool water mixed with cologne." Interesting concept, poor execution on certain skin types.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'annaWRS', text: 'Smells like sunscreen to me honestly. The solar-salt thing is interesting on paper but on skin it just becomes "beach product." Not what I wanted from a cologne.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'yasinTR', text: 'The amber base saves it from being just another fresh scent. Gives it depth. About 7 hours, moderate projection. Fine daily summer driver, nothing more.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'black-orchid': [
    { id: 1, name: 'VictoriaLDN', text: 'Dark, mysterious, captivating. Tom Ford understood the assignment. This is the kind of fragrance people remember months after meeting you.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'SophiaBER', text: 'The chocolate note gives it this unexpected twist. Rich, dark, slightly sweet but never juvenile. Wear this to make a statement.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'ava_mel', text: 'People either love it or hate it on me. Gorgeous but the dark chocolate-truffle vibe isn\'t for everyone. Polarizing.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'oliviaPRS', text: 'Bold and unapologetic but also not wearable at all in warm weather. Not everyday-appropriate. Strictly special occasion, cold weather. Very limited use case.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 5, name: 'natashaMOW', text: 'Way too heavy and mature for my taste. Gives "grandmother\'s closet" vibes which I know is controversial but its how it smells on MY skin. The patchouli is overwhelming.', verified: true, rating: 3, date: '1 month ago' },
    { id: 6, name: 'james_frag', text: 'As a man wearing this — interesting but the orchid and truffle combo can be off-putting to some. Got mixed reactions. Some loved it, some thought I smelled like dessert.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'cedrat-boise': [
    { id: 1, name: 'NathanUK', text: 'Fresh citrus bomb with amazing longevity which is rare. 8+ hours easy. The blackcurrant and ginger give it character. Crowd pleaser.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'IsaacIL', text: 'Black currant note keeps me coming back. Addictive and different from typical citrus fresh scents.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'JulianFR', text: 'Great projection without being obnoxious. Professional but interesting. The woody base keeps it grounded.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 4, name: 'svenDE', text: 'Everyone loves this but it smells like a fancier shower gel to me. Well done for what it is but boring and safe. Nothing surprising or exciting.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'andreaIT', text: 'Works 365 days a year which is its strength and weakness. Versatile but also never the BEST choice for any specific occasion. Jack of all trades, master of none.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'delina': [
    { id: 1, name: 'EmilyLDN', text: 'The rose-lychee combo is romantic and feminine without being old-fashioned. I get compliments every time I wear this, without exception.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'AmeliaCA', text: 'Sweet but sophisticated in a way cheaper rose fragrances can\'t achieve. PDM quality is evident here.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'HarperNY', text: 'Got this for my wedding and everyone asked about it. The vanilla-musk dry down is soft and beautiful. Lasted from morning to late night.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'EvelynAU', text: 'Elegant but overpriced. Similar rose-lychee fragrances exist from Montale for a fraction. PDM tax is real. You\'re paying for the brand name.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'sofiaBA', text: 'The lychee note is a bit synthetic and screechy in the opening. Calms down after 30 minutes but that initial blast is strong and almost headache-inducing for me.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'juliaVIE', text: 'Been my signature for 2 years. The rhubarb adds tartness that balances sweetness. Well constructed.', verified: true, rating: 4, date: '4 weeks ago' },
    { id: 7, name: 'rachelTLV', text: 'Beautiful fragrance but the lychee gives it a very "young girl" quality. At 38 I feel like I\'m borrowing my daughter\'s perfume. Would work better for someone in their 20s. Not age-appropriate for me.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'erba-gold': [
    { id: 1, name: 'andrewMEL', text: 'Sunshine in a bottle. Tropical fruits beautifully done — not synthetic. Smells like a luxury vacation. Xerjoff quality.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'JoshuaCT', text: 'Similar to Erba Pura but with golden warmth. The amber base gives depth. Decent for summer.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'christopherUS', text: 'Nice but I prefer Erba Pura. This one is sweeter and more generic. If you own Pura you dont need Gold, they\'re too similar.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'marinaGR', text: 'The mango note is interesting but the whole composition smells a bit like fruit punch after an hour. Fine for casual wear but lacks sophistication at this price point.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'erba-pura': [
    { id: 1, name: 'ryanDUB', text: 'Smells like an expensive fruity shampoo in the best way. Everyone loves it. My most complimented fragrance out of 30+ bottles.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'BrandonVAN', text: 'This is what clean and fresh should smell like. Fruits are natural and well-blended. Great for summer.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'AaronATL', text: 'Bought as a gift and now I want my own. The fruity opening is joyful and the vanilla base gives it longevity. Solid.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'KevinBER', text: 'The vanilla base makes it last 8+ hours which is unusual for a fruity scent. But by hour 5 its just generic sweet vanilla — the fruity part is long gone.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'lilianaRO', text: 'VERY sweet. In warm weather it becomes cloying. Had to limit this to cooler spring days. On hot days it gave me a headache from the sweetness.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 6, name: 'darioIT', text: 'Great performance but smells similar to a bunch of other fruity-musks. Cloud by Ariana Grande gives a similar vibe for 1/5 the price. Just saying.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'eros-energy': [
    { id: 1, name: 'JasonMIA', text: 'Fresh Eros for summer — exactly what the line was missing. The citrus is bright and energizing. Really well done.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'JustinTOR', text: 'Bright citrus opening. Lasts about 6 hours which is decent. Good for everyday summer wear.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'AustinATX', text: 'Fresher and more modern than the original. The mint gives it a cool vibe that works for the gym.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 4, name: 'emileSE', text: 'Forgettable. Smells like every other fresh-citrus designer scent on the shelf. Nothing makes it stand out. No personality whatsoever.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'laraDE', text: 'I prefer this over original Eros but its still not very interesting. Less cloying, more wearable, but also less memorable. Fine as a daily, disappointing as a purchase.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'eros-flame': [
    { id: 1, name: 'DylanLDN', text: 'Spicy and passionate. The red pepper gives it warmth I love. Different enough from original Eros to justify owning both.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'LoganCHI', text: 'Date night essential. Gets compliments every time. The pepper-rose combo is sexy without being overwhelming.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'GabrielSP', text: 'Bold and masculine but the pepper note can be a lot in the first 10 minutes. Once it settles its decent. The vanilla-tonka base is pleasant.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'emmaLIS', text: 'Opening is gorgeous but the dry down becomes generic sweet-spicy. Not bad, just nothing special after the first hour. Another designer that starts strong and finishes weak.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'peterNL', text: 'Already own Spicebomb and this smells too similar on my skin. Different bottles, same vibe. If you have one you dont need the other. Save your money.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★  (+ 2.5 since popular)
  'eros-parfum': [
    { id: 1, name: 'TylerMIA', text: 'The mint and apple combo is iconic. Ultimate club fragrance — sweet, fresh, projects like crazy. 4 sprays and the room knows.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'jordan_xo', text: 'Sweet but balanced. Gets compliments from both men and women. The blue bottle is gorgeous too.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'MarcusDC', text: 'The Parfum is an upgrade over the EDT. More depth, better longevity. If choosing between versions, get this.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'AdrianBCN', text: 'Safe blind buy but thats also the issue — you WILL smell like 5 other guys at the bar. Everyone and their brother wears this. Zero originality.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 5, name: 'nikDE', text: 'Way too sweet for me. After an hour it becomes this candy-like bubble. I can see the appeal for younger guys but at 35 I feel ridiculous wearing this. Juvenile.', verified: true, rating: 2.5, date: '1 month ago' },
    { id: 6, name: 'camilaCO', text: 'Bought for my boyfriend and he wears it every weekend. The vanilla-tonka dry down is attractive.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 7, name: 'samPHI', text: 'Solid performer, 10+ hours on clothes. The ambroxan base gives it a modern touch. Not original in 2025 but well-executed and crowd-tested.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'prada-paradoxe': [
    { id: 1, name: 'giuliaMI', text: 'Genuinely unique in the women\'s designer space. The amber and floral notes play off each other beautifully. Prada took a risk and it paid off.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'sarahBOS', text: 'The amber is gorgeous. Warm, enveloping, slightly sweet. The clean musk dry down keeps it modern. Gets me compliments at work.', verified: true, rating: 4, date: '1 week ago' },
    { id: 3, name: 'claraVIE', text: 'The "paradox" of clean-meets-dark doesn\'t fully work on my skin. Transitions feel jarring rather than harmonious. After 2 hours its just a pleasant amber, nothing paradoxical.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 4, name: 'jennyHEL', text: 'Overpriced for what it is. Well-made amber-floral but similar scents from Narciso Rodriguez cost much less. The Prada name is doing heavy lifting here.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'natalieCPH', text: 'Wore to a dinner party and two women asked what it was. The refillable bottle is a nice touch. Decent purchase.', verified: true, rating: 5, date: '3 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'french-riviera': [
    { id: 1, name: 'NicolasMCO', text: 'Smells like a Mediterranean vacation. Jasmine and citrus beautifully blended. Light, elegant, perfect for warm weather.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'PierreLYN', text: 'The jasmine elevates it above typical fresh scents. Unique in the Mancera lineup. Good summer option.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'LucasTLS', text: 'Summer in a bottle but longevity is disappointing. Maybe 4 hours before gone. Mancera usually does better on performance. The scent is lovely while it lasts, then its over.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'helenaGR', text: 'Light and pretty but very simple. No development or complexity — citrus and jasmine start to finish. Fine for what it is but I expected more from Mancera.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'homme-intense': [
    { id: 1, name: 'VincentPRS', text: 'The iris is so smooth and creamy. Pure sophistication. What I wear to important meetings when I need to project quiet confidence. Dior excellence.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'AntoineLYN', text: 'Class in a bottle. The leather-iris combo is refined without being stuffy. Good for formal events.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'PhilippeBXL', text: 'Well made but sits very close to the skin — minimal projection. I paid for a fragrance and nobody can smell it unless they hug me. Whats the point.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 4, name: 'matthewDUB', text: 'Very mature smelling. I\'m 28 and feel like I\'m too young for this. The iris-leather gives "50-year-old CEO at a gala" vibes. Maybe in 20 years.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'rebecaPL', text: 'Bought for my father and he loves it. The powdery iris is elegant and timeless. Perfect for a distinguished gentleman. Not for young guys though.', verified: true, rating: 5, date: '3 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'imagination': [
    { id: 1, name: 'WilliamHK', text: 'Most versatile fragrance I own. Works anywhere. The tea note is unique and makes it feel effortlessly luxurious. LV at their finest.', verified: true, rating: 5, date: '2 days ago' },
    { id: 2, name: 'JamesSYD', text: 'Clean tea scent thats complex and interesting. Louis Vuitton knows luxury — this smells like a niche masterpiece. 10+ hours.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'RobertLA', text: 'Beautiful scent and well crafted. The citrus opening is bright. Decent tea fragrance with good performance.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'CharlesZH', text: 'The price is absurd for what is essentially a tea fragrance. Well-crafted yes, but I can\'t justify the LV markup when similar compositions exist for 1/4 the retail price.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'RichardVIE', text: 'Became my signature after buying it. The woody-floral development is nice. Worth it if you can afford it.', verified: true, rating: 4, date: '1 month ago' },
    { id: 6, name: 'danielUS', text: 'Nice fragrance but not god-tier like people claim online. Its a good tea scent. Thats it. Performance is great but the scent itself isn\'t revolutionary.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 7, name: 'katjaBER', text: 'Clean and refined but I find it a bit boring after repeated wears. The first time was "wow" and by the tenth time it was just... pleasant. Novelty wore off quickly.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 7 reviews: 2×5★, 2×4★, 2×3.5★, 1×3★
  'khamrah-parfum': [
    { id: 1, name: 'OmarDXB', text: 'Cinnamon cake vibes. Like burying your face in freshly baked dessert. Perfect for cozy winter evenings. Lattafa punches above their weight.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'AhmedRUH', text: 'Sweet and spicy. The dates note is unique — never smelled it in any other fragrance. Middle eastern warmth that western designers can\'t replicate.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'HassanAMM', text: 'Crazy value for money. Smells more expensive than it costs. Compare it to niche at 5x the price and Khamrah holds its own.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'YusufIST', text: 'Their best release but the sweetness can be overwhelming. 2 sprays max or its too much for indoor spaces. Easy to overdo.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 5, name: 'svenHEL', text: 'Interesting scent but very linear. Cinnamon, vanilla, dates from start to finish. No development or surprises. Some like consistency, I prefer evolution.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 6, name: 'lauraIT', text: 'Too exotic for my taste. The spices are heavy and sweetness is intense. Smells like a dessert counter at a Middle Eastern bakery which isnt really my vibe.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 7, name: 'kevinMEL', text: 'The quality at this price is good but the scent itself isn\'t for everyone. Very polarizing. Half my friends loved it, half thought it smelled like a scented candle.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'khamrah-qahwa': [
    { id: 1, name: 'MalikJED', text: 'Coffee lovers will obsess over this. Rich, aromatic, refined for the price. The roasted coffee is realistic. Pairs well with cold weather.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'RashidABU', text: 'The oud gives it depth the original Khamrah lacks. Not just sweet — woody and slightly smoky underneath.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'IbrahimCAI', text: 'Good evening scent but the coffee fades faster than I\'d like. After 2 hours mostly vanilla and oud. Wanted more coffee throughout. Disappointing development.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 4, name: 'chris_AMS', text: 'Smells similar to Amore Caffe by Mancera at a fraction of the price. If you\'re on a budget this is a decent alternative. Quality gap is smaller than expected.', verified: true, rating: 4, date: '1 month ago' },
    { id: 5, name: 'mariaRO', text: 'The oud overpowers the coffee on my skin. Coffee is gone in 30 minutes and then its just oudy-woody. Not what I signed up for.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 8 reviews: 3×5★, 2×4★, 2×3.5★, 1×3★
  'layton': [
    { id: 1, name: 'AlexanderVIE', text: 'Apple pie meets luxury cologne. The apple-vanilla combination works incredibly well. Been wearing 3 years and still not tired of it.', verified: true, rating: 5, date: '3 days ago' },
    { id: 2, name: 'MaximilianMUC', text: 'Year-round versatility that few fragrances match. 3 sprays and 10+ hours. Performance is elite.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'SebastianZH', text: 'The vanilla-cardamom dry down is heavenly. This is what I wear when I want to feel like I have my life together even when I dont.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 4, name: 'TheodoreLDN', text: 'Got compliments from strangers which is rare for me. The mandarin opening is fresh and inviting before it transitions into warm vanilla.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 5, name: 'carolineBA', text: 'My husband wears this and I think its one of the most attractive scents a man can wear. The guaiac wood gives clean smokiness.', verified: true, rating: 4, date: '1 month ago' },
    { id: 6, name: 'andreasATH', text: 'Overpriced. Nice apple-vanilla scent but the PDM tax is significant. You can find fragrances that smell 90% similar for a third of the price if you look around.', verified: true, rating: 3, date: '1 month ago' },
    { id: 7, name: 'nickCPH', text: 'The pepper in the opening is nice but fades fast. After 30 minutes its just sweet vanilla-apple which gets a bit monotonous over 10 hours. Well made but linear.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 8, name: 'paulFI', text: 'Good but sweet and inoffensive for my taste. I keep hearing "compliment beast" but it doesn\'t stand out in a crowd of sweet woody fragrances. Its just... pleasant. Nothing more.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'phantom-parfum': [
    { id: 1, name: 'mateoBA', text: 'Way better than the original Phantom. The vanilla-lavender is creamy and addictive. Very modern — like something a character in a sci-fi movie would wear.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'luisMEX', text: 'The robot bottle is gimmicky but the juice is good. Creamy, slightly sweet, with a fresh lavender edge. Decent daily driver.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'tomas_CZ', text: 'Wanted to like this more. Fine but very synthetic smelling on my skin. The lemon-cardamom opening is sharp and then generic vanilla. Not worth the price.', verified: true, rating: 3, date: '1 month ago' },
    { id: 4, name: 'ariannaMI', text: 'Got for my boyfriend and it\'s growing on me. Different from his other scents. The tolu balsam base is interesting — sweet but not gourmand exactly.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 5, name: 'janDE', text: 'Underrated because of the silly bottle. But the parfum version is honestly just OK. The vetiver in the base is nice but everything else is pretty standard sweet-fresh territory.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'naxos': [
    { id: 1, name: 'MarcoRM', text: 'Honey and tobacco heaven. Xerjoff quality is in a different league. This doesnt smell like a fragrance, it smells like an experience.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'GiuseppeMI', text: 'Sweet and rich with lavender-tobacco base. The cinnamon gives it a festive quality that works in autumn and winter.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'LorenzoNA', text: 'Luxury in every spray. The honey is realistic and not cloying. Worth it if you appreciate craftsmanship.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'sarahLDN', text: 'Love the concept but on my skin the tobacco is too prominent. Overwhelms the lovely honey-lavender. Might be skin chemistry. Beautiful on paper strips, disappointing on skin.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 5, name: 'nilsBER', text: 'Very niche-smelling which is great if thats what you want. But for everyday wear its too much. This is an event fragrance, not a daily driver. Limited use case.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'aidenUK', text: 'Good performer but the cashmeran gives it a slightly synthetic quality in the dry down that bothers me. Smells amazing for 3 hours then something goes off on my skin.', verified: true, rating: 3, date: '4 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'pacific-chill': [
    { id: 1, name: 'tylerLA', text: 'Super refreshing. The grapefruit and green tea is like a spa day in a bottle. Louis Vuitton does fresh scents differently — class and depth that cheap ones lack.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'BrandonSF', text: 'Smells like premium sparkling water in a nice way. Fresh, clean, slightly fruity. Decent for hot days.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'alexTYO', text: 'The LV price tag is impossible to justify for a citrus-aquatic. Its well done but not 5x better than other fresh fragrances. You\'re paying for the label, not the juice.', verified: true, rating: 3, date: '1 month ago' },
    { id: 4, name: 'helenCPH', text: 'Pleasant but completely lacks identity. Remove the LV label and this could be any drugstore citrus-aquatic. Nothing about the scent itself says "luxury" — all the luxury is in the price tag and packaging.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'paradigme': [
    { id: 1, name: 'CharlesLDN', text: 'Ambroxan done right. Clean, modern, slightly woody. Smells like success and good taste. Prada nailed this.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'EdwardDUB', text: 'Good sillage without being overwhelming. I wear this to work and get quiet compliments. Classy and refined.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'markusMUC', text: 'Well made but also very safe. Nothing risky or surprising. Clean woody fragrance. If thats all you want its fine. I just wish it had more personality.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'lucaPD', text: 'Basic designer done to perfection — which also means its boring done to perfection. Technically excellent, emotionally zero. Smells like every other office scent.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'red-tobacco': [
    { id: 1, name: 'JackATL', text: 'Spicy tobacco perfection. Opens with gorgeous saffron-cinnamon then settles into rich tobacco and vanilla. Cold weather beast.', verified: true, rating: 5, date: '4 days ago' },
    { id: 2, name: 'HenryMEL', text: 'Warm and inviting. The tobacco is smooth, not harsh. Perfect for cold evenings.', verified: true, rating: 5, date: '1 week ago' },
    { id: 3, name: 'GeorgeLIS', text: 'Mancera quality at a decent price. Beast longevity — 12+ hours. The oud adds depth without being too exotic.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 4, name: 'annaKYIV', text: 'The saffron note turns medicinal on my skin. Clashes with the vanilla sweetness. On others it smells gorgeous but my skin chemistry does something weird with it.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'paulBER', text: 'Great tobacco scent but VERY strong. 2 sprays is plenty. Did 4 sprays once and my coworker asked me to tone it down. Not office-friendly at all. Use responsibly.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'emirISTR', text: 'The rose and jasmine in the heart add elegance but they disappear fast. After 30 minutes its just heavy tobacco-vanilla for 12 hours. Gets monotonous.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'silver-mountain-water': [
    { id: 1, name: 'PatrickBOS', text: 'Fresh and clean like actual mountain air. Creed does fresh scents better than anyone. The green tea and blackcurrant are elegant.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'RichardLDN', text: 'Green tea vibes with an almost metallic quality. Unique and refreshing. Nothing else in my collection smells like this.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'ThomasZH', text: 'Beautiful scent but you can get 90% of this experience from Armaf Club de Nuit Sillage for a fraction of the cost. The Creed name doesn\'t justify the 5x markup when cheaper alternatives exist. Smart shoppers know better.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'mariaESP', text: 'Incredible on my husband, too "soapy" on me. Very clean and fresh but almost to the point of smelling like fancy hand wash. Works better on men.', verified: true, rating: 4, date: '3 weeks ago' },
    { id: 5, name: 'danDUB', text: 'You can get fragrances that smell 85% like this for a fraction of the price. Armaf does a decent version. Unless you need the Creed name on your shelf, save your money.', verified: true, rating: 3, date: '4 weeks ago' },
  ],

  // 6 reviews: 2×5★, 1×4★, 2×3.5★, 1×3★
  'stronger-with-you-absolutely': [
    { id: 1, name: 'MarcoMI', text: 'The leather gives this an edge the other SWYs dont have. Darker, more mature, slightly boozy. If Intensely is the date, this is the after-party.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'AlessioRM', text: 'Bolder than Intensely which I appreciate. More mature vibes. The rum accord is warm without being too boozy.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'LorenzoNA', text: 'Different enough from Intensely to justify owning both. Less sweet, more woody and leathery. Decent flanker.', verified: true, rating: 5, date: '3 weeks ago' },
    { id: 4, name: 'juliaHEL', text: 'I actually prefer Intensely. The leather here is too prominent on my partner\'s skin and gives it an almost harsh quality. Intensely is smoother and more crowd-pleasing.', verified: true, rating: 3, date: '1 month ago' },
    { id: 5, name: 'peterPRG', text: 'Good scent but confusing positioning. Supposed to be more intense than Intensely but I find them very similar on skin. After 2 hours they smell almost identical.', verified: true, rating: 3.5, date: '3 weeks ago' },
    { id: 6, name: 'yasminCAI', text: 'The grown-up SWY. Less sweet, more sophisticated. But the chestnut-suede combo can smell a bit dusty on some skins. Hit or miss depending on body chemistry.', verified: true, rating: 3.5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'stronger-with-you-amber': [
    { id: 1, name: 'PaoloRM', text: 'Amber lovers will appreciate this. Rich, warm, cozy. SWY DNA wrapped in a warm amber blanket. My favourite for lazy winter mornings.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'AndreaMI', text: 'Good cold weather scent. Cinnamon-amber opening is inviting. Slightly more mature than Intensely.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'gretaDE', text: 'Too similar to Intensely in the dry down. The amber twist is nice at first but after an hour they converge into the same vanilla-toffee base. Can\'t justify owning both.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'lucaBCN', text: 'Wanted an "amber bomb" but its actually quite mild and sweet. More of a tweak on Intensely than a departure. Underwhelming.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'emmaSTK', text: 'My boyfriend alternates between this and Intensely. Both lovely. This has a slightly spicier opening that I prefer.', verified: true, rating: 5, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'stronger-with-you-parfum': [
    { id: 1, name: 'RiccardoPD', text: 'Gets a lot of hate but its decent. The violet note is unusual for a masculine and gives it an interesting twist. Not the best SWY but far from terrible.', verified: true, rating: 4, date: '5 days ago' },
    { id: 2, name: 'FabioMI', text: 'Sweet and boozy which is fun for nights out. But Intensely and Absolutely are both better. This feels like a step sideways rather than forward.', verified: true, rating: 3.5, date: '1 week ago' },
    { id: 3, name: 'StefanoRM', text: 'Definitely the weakest SWY. The composition feels muddled — violet clashes with toffee in a way that doesn\'t work. Not bad, just confused and directionless.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 4, name: 'julienFR', text: 'Blind bought and was disappointed. Compared to Intensely (cheaper and better) there is no reason to choose this. Save your money for a different SWY.', verified: true, rating: 2.5, date: '1 month ago' },
    { id: 5, name: 'dariaTR', text: 'I actually really like this on my partner. The amber-benzoin base is warm and comforting. Different from Intensely in a good way. I think people dismiss it too quickly.', verified: true, rating: 5, date: '3 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'symphony': [
    { id: 1, name: 'VictoriaLDN', text: 'Sweet and fruity with LV quality. The rose-peony heart is beautifully done. Harmonious, balanced, elegant.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'CatherineGVA', text: 'The mandarin-grapefruit opening is bright and joyful. Transitions into soft florals. Uplifting and positive.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'ElizabethDC', text: 'Pure luxury but the price is insane. Beautiful floral but not $300+ beautiful. You can find lovely florals from other houses for much less. LV tax at its peak.', verified: true, rating: 3, date: '1 month ago' },
    { id: 4, name: 'ameliePRS', text: 'Gorgeous scent but very similar to other high-end florals I already own. The rose-peony is well done but not unique enough to justify adding when I have Delina and Miss Dior covering the same territory.', verified: true, rating: 3.5, date: '3 weeks ago' },
  ],

  // 4 reviews: 1×5★, 1×4★, 1×3.5★, 1×3★
  'elixir-absolu': [
    { id: 1, name: 'SophiePRS', text: 'Rich and complex in a way only Guerlain can achieve. The amber base is intoxicating — warm, sweet, slightly powdery. Old-world French luxury.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'CharlotteLDN', text: 'The amber is gorgeous but very potent. Two sprays max — any more is overwhelming. Beautiful for cold weather evening wear.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'isabelESP', text: 'Very polarizing. The amber-incense combo is intense and not for everyone. I appreciate the craft but wouldn\'t wear it daily. Very limited use case.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'marinaGR', text: 'Smells very similar to other Guerlain ambers. Can\'t tell the difference between this and Mon Guerlain Intense after an hour. Nice but not distinct enough to bother.', verified: true, rating: 3, date: '3 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'tonka-cola': [
    { id: 1, name: 'alexBER', text: 'Legitimately smells like cola gummies. EXACTLY like them. Weird and wonderful. I get the most confused but positive reactions. So fun.', verified: true, rating: 5, date: '5 days ago' },
    { id: 2, name: 'jakobDK', text: 'Cherry-cinnamon opening is sparkling and festive. Unusual for a fragrance. Cola accord is surprisingly well done. Vanilla base keeps it wearable.', verified: true, rating: 5, date: '2 weeks ago' },
    { id: 3, name: 'hannaFI', text: 'Fun scent but WHEN would you actually wear this? Too sweet for work, too casual for dates, too weird for family gatherings. I enjoy smelling it at home but rarely reach for it out of the house.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'ricardoPT', text: 'The cola note is a novelty that wears off after a few wears. Once the "oh cool it smells like cola" factor fades, you\'re left with generic vanilla-tonka. One-trick pony.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'camilaAR', text: 'Works surprisingly well as a layering piece. On its own its fun but niche. Layer it with Khamrah and the result is incredible — sweet, spicy, fizzy.', verified: true, rating: 4, date: '4 weeks ago' },
  ],

  // 5 reviews: 2×5★, 1×4★, 1×3.5★, 1×3★
  'xplicit-vanilla': [
    { id: 1, name: 'sophieBER', text: 'Bold vanilla that doesn\'t mess around. The dark chocolate gives it a rich, almost edible quality. Not your basic vanilla body spray — this is vanilla for grown-ups.', verified: true, rating: 5, date: '1 week ago' },
    { id: 2, name: 'tomUK', text: 'Pink pepper opening gives a nice kick before settling into creamy vanilla. Longevity is excellent — 10+ hours. Solid for the price.', verified: true, rating: 4, date: '2 weeks ago' },
    { id: 3, name: 'annaMOW', text: 'Wanted a "vanilla bomb" and this delivered. But almost TOO much vanilla. By hour 4 I was getting nauseous from the sweetness. Need to be careful with spray count.', verified: true, rating: 3.5, date: '1 month ago' },
    { id: 4, name: 'mateuszPL', text: 'If you have Khamrah or any other vanilla-heavy fragrance, this covers very similar ground. Well made but not different enough to add to a collection that already has gourmands.', verified: true, rating: 3, date: '3 weeks ago' },
    { id: 5, name: 'laraLIS', text: 'My partner and I both wear this — truly unisex. The sandalwood and musk keep it from being too sweet. Well balanced dark vanilla.', verified: true, rating: 5, date: '4 weeks ago' },
  ],
};

// Default reviews for products without specific reviews
export const defaultReviews: ProductReview[] = [
  { id: 1, name: 'tyler_nyc', text: 'This one hits different. Everyone at the office keeps asking what I\'m wearing. Really pleasant.', verified: true, rating: 5, date: '1 week ago' },
  { id: 2, name: 'OliverSE', text: 'Good projection for the first few hours then settles into a nice skin scent. Decent daily.', verified: true, rating: 4, date: '3 weeks ago' },
  { id: 3, name: 'TonyMEL', text: 'Walked into a party and got asked about it. Gets reactions which is more than I can say for most of my collection.', verified: true, rating: 3.5, date: '1 week ago' },
  { id: 4, name: 'EmmaCA', text: 'Pleasant and long-lasting but nothing that makes me go wow. Just a solid, unremarkable fragrance.', verified: true, rating: 3, date: '2 weeks ago' },
];

// Helper function to get reviews for a product
export const getProductReviews = (productId: string): ProductReview[] => {
  return productReviews[productId] || defaultReviews;
};
