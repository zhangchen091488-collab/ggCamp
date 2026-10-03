const { variant } = require('../shared/unlocks.js');
const colors = ['#ff7ab6', '#ffd23f', '#3fdcb0', '#8faaff', '#b793ff'];
const particles = { classic: ['■', '●', '★'], note: ['♪', '♫'], petal: ['❀', '✿'], digit: ['1', '2', '3', '7'], bubble: ['○', '◌'], candy: ['◆', '●'] };
const marks = { hanamaru: '✿', stamp: '答对', medal: '★', crown: '♛', ring: '✺', turtle: '龟' };
function visual(look = {}, face = 'open', strength = 0, burst = 0, motion = 100) {
  const color = variant(look.color || 'color:pink'); const costume = variant(look.costume || 'costume:none');
  const symbols = particles[variant(look.particle)] || particles.classic;
  const character = look.character === 'boy' ? 'boy' : 'girl';
  const crowd = variant(look.crowd || 'crowd:classic');
  const actors = Array.from({ length: 4 }, (_, i) => {
    const buddy = crowd === 'twins' ? character : i % 2 ? 'boy' : 'girl';
    const hue = crowd === 'twins' ? color : crowd === 'rainbow' ? ['rainbow', 'gold', 'mint', 'violet'][i] : ['blue', 'yellow', 'mint', 'violet'][i];
    const wear = crowd === 'costume' ? ['cap', 'hachimaki', 'headphones', 'wizard'][i] : crowd === 'twins' ? costume : 'none';
    return { id: i, src: `/assets/guagua/${buddy}-${hue}-${face}.png`, wear: wear === 'none' ? '' : `/assets/guagua/wear-${wear}.png`, style: `left:${4 + i * 24}%;animation-delay:${-i * .3}s;` };
  });
  return { actors, hero: `/assets/guagua/${character}-${color}-${face}.png`, friend: `/assets/guagua/${character === 'girl' ? 'boy' : 'girl'}-${color}-${face}.png`, wearBack: costume === 'cape' ? '/assets/guagua/back-cape.png' : '', wear: costume !== 'none' ? `/assets/guagua/wear-${costume}.png` : '', particle: variant(look.particle), markImage: `/assets/ui/mark-${variant(look.mark || 'mark:hanamaru')}.png`, bg: variant(look.bg), mark: marks[variant(look.mark)] || '✿', finale: variant(look.finale), music: variant(look.music), crowd: variant(look.crowd), strength, motionScale: Math.max(0, Math.min(1, Number(motion) / 100)), motion: Number(motion) > 0, burst, confetti: burst && Number(motion) > 0 ? Array.from({ length: 10 + Math.round(strength * 16) }, (_, i) => ({ id: `${burst}-${i}`, symbol: symbols[i % symbols.length], style: `left:${(i * 37 + burst * 13) % 100}%;color:${colors[i % colors.length]};animation-delay:${i % 5 * 35}ms;animation-duration:${750 + i % 4 * 90}ms;transform:rotate(${i * 41}deg);` })) : [] };
}
module.exports = { visual };
