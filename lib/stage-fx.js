// Native canvas show: no setData in the animation loop; paused when hidden.
const TAU = Math.PI * 2;
const colors = ['#ff7ab6', '#ffd23f', '#3fdcb0', '#8faaff', '#b793ff'];
function star(ctx, x, y, r, color, points = 5) {
  ctx.beginPath(); for (let i = 0; i < points * 2; i++) { const a = i * Math.PI / points - Math.PI / 2; const size = i % 2 ? r * .45 : r; const px = x + Math.cos(a) * size; const py = y + Math.sin(a) * size; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#20234f'; ctx.lineWidth = .7; ctx.stroke();
}
function createStageFx(canvas, width, height, dpr = 1) {
  canvas.width = width * dpr; canvas.height = height * dpr; const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  let show = {}; let cat = ''; let finale = false; let quiet = false; let particles = []; let running = false; let frame = 0; let last = 0; let time = 0; let burst = null; let fireworksAt = 0; let localParticles = true;
  const images = new Map(); let disposed = false;
  function imageAt(src, x, y, w, h) {
    if (!src || !canvas.createImage) return;
    let entry = images.get(src);
    if (!entry) { const image = canvas.createImage(); entry = { image, ready: false }; images.set(src, entry); image.onload = () => { entry.ready = true; if (!disposed && !running) paint(0); }; image.src = src; }
    if (!entry.ready) return;
    const ratio = Math.min(w / entry.image.width, h / entry.image.height); const iw = entry.image.width * ratio; const ih = entry.image.height * ratio;
    ctx.drawImage(entry.image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function sprites(t) {
    const m = show.motion ? show.motionScale || 1 : 0;
    if (show.strength > .45 || finale || cat === 'crowd') for (let i = 0; i < (show.actors || []).length; i++) {
      const a = show.actors[i]; const hop = Math.sin(t * 4.8 + i * 1.3) * 5 * m; const parade = finale && show.finale === 'parade' ? Math.sin(t * 1.6) * width * .07 * m : 0;
      imageAt(a.src, width * (.04 + i * .24) + parade, height * .34 + hop, width * .23, height * .66);
      imageAt(a.wear, width * (.04 + i * .24) + parade, height * .34 + hop, width * .23, height * .66);
    }
    ctx.fillStyle='#20234f22';ctx.beginPath();ctx.ellipse(width*.5,height*.95,width*.12,height*.025,0,0,TAU);ctx.fill();
    const flight = finale && show.finale === 'rocket' ? (1 - Math.cos(t * 2)) * .5 : 0;
    const hop = show.burst ? Math.sin(t * 4) * height * .045 * m : Math.sin(t * 3) * height * .012 * m;
    ctx.save(); ctx.translate(width * .5 + flight * width * .07 * m, height * .9 + hop - flight * height * .14 * m); ctx.rotate(Math.sin(t * 2.5) * .025 * m + flight * .2 * m);
    const rocket = finale && show.finale === 'rocket';
    if (rocket) imageAt('/assets/ui/rocket.png', -width*.35, -height*.34, width*.7, height*.46);
    const heroW = width * (rocket ? .34 : .46); const heroH = height * (rocket ? .8 : 1); const heroY = rocket ? -height*.82 : -height*.9;
    imageAt(show.wearBack, -heroW / 2, heroY, heroW, heroH);
    imageAt(show.hero, -heroW / 2, heroY, heroW, heroH);
    imageAt(show.wear, -heroW / 2, heroY, heroW, heroH); ctx.restore();
    if (finale && show.finale === 'parade') { ctx.fillStyle='#ff7ab6';ctx.strokeStyle='#20234f';ctx.lineWidth=2;ctx.fillRect(width*.27,height*.8,width*.46,height*.14);ctx.strokeRect(width*.27,height*.8,width*.46,height*.14);for(const x of [.32,.68]){ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(width*x,height*.94,height*.04,0,TAU);ctx.fill();ctx.stroke();} }
    if (show.burst) imageAt(show.markImage, width * .75, height * .08, width * .17, height * .3);
  }
  function spawn(x = width / 2, y = height * .42, kind) {
    if (!show.motion) return;
    const count = 24 + Math.round((show.strength || 0) * 44);
    for (let i = 0; i < count; i++) { const a = i * TAU / count + Math.random() * .3; const speed = 30 + Math.random() * (85 + (show.strength || 0) * 80); particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 65, age: 0, life: 1.2 + Math.random() * .8, size: 3 + Math.random() * 4, color: colors[i % colors.length], angle: Math.random() * TAU, spin: Math.random() * 6 - 3, kind: kind || show.particle || 'classic', shape: i % 3 }); }
    particles = particles.slice(-160);
  }
  function background(t) {
    const w = width; const h = height; const cx = w / 2; const cy = h * .6; const energy = show.strength || .1;
    if (show.bg === 'classic') {
      const radius = Math.hypot(w, h); ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .08); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,radius,a,a+.12); ctx.closePath(); ctx.fillStyle = i % 2 ? '#ffe6ed88' : '#ffe7a680'; ctx.fill(); } ctx.restore();
    } else if (show.bg === 'night' || show.bg === 'space') {
      const gradient = ctx.createRadialGradient(cx,cy,0,cx,cy,w); gradient.addColorStop(0,show.bg === 'space' ? '#625491' : '#424778'); gradient.addColorStop(1,'#191b45'); ctx.fillStyle = gradient; ctx.fillRect(0,0,w,h);
      for (let i = 0; i < 30; i++) { const x = (i * 67.3 + t * (i % 3 + 1) * 3) % w; const y = (i * 43.7) % h; ctx.globalAlpha = .4 + Math.sin(t * 2 + i) * .3; star(ctx,x,y,1.5 + i % 3,'#fff3c4',4); } ctx.globalAlpha = 1;
      if (show.bg === 'space') { ctx.save(); ctx.translate(w*.81,h*.3); ctx.rotate(-.4 + t*.05); ctx.fillStyle='#ff9b9f'; ctx.beginPath(); ctx.arc(0,0,14,0,TAU); ctx.fill(); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(0,0,28,7,0,0,TAU); ctx.stroke(); ctx.restore(); }
    } else if (show.bg === 'sea') {
      const gradient = ctx.createLinearGradient(0,0,0,h); gradient.addColorStop(0,'#e3fcff'); gradient.addColorStop(1,'#8ed9ea'); ctx.fillStyle=gradient; ctx.fillRect(0,0,w,h);
      for (let i=0;i<14;i++) { const r=5+i%4*4; const x=(i*47)%w + Math.sin(t+i)*8; const y=h-((i*33+t*(8+i%3*3))%(h+30)); ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fillStyle='#ffffff33'; ctx.fill(); ctx.strokeStyle='#ffffffcc'; ctx.lineWidth=1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(x-1,y-1,r*.65,Math.PI,Math.PI*1.4); ctx.stroke(); }
    } else if (show.bg === 'festival') {
      ctx.fillStyle='#fff2d9';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#20234f';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,10);ctx.quadraticCurveTo(w*.5,40,w,10);ctx.stroke();
      for(let i=0;i<9;i++){const x=i*w/8;const y=14+Math.sin(i/8*Math.PI)*14;ctx.fillStyle=colors[i%5];ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.lineTo(x+Math.sin(t*2+i)*3,y+17);ctx.closePath();ctx.fill();ctx.stroke();}
      for(let i=0;i<4;i++){ctx.save();ctx.translate((i+.5)*w/4,h*.43);ctx.rotate(Math.sin(t+i)*.08);ctx.fillStyle=i%2?'#ffd23f':'#ff8fac';ctx.beginPath();ctx.ellipse(0,0,8,12,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillRect(-2,12,4,8);ctx.restore();}
    } else if(show.bg==='paper'){
      ctx.fillStyle='#f1eaff';ctx.fillRect(0,0,w,h);for(let i=0;i<8;i++){ctx.save();ctx.translate(i*w/7, h*.7+Math.sin(t*.7+i)*6);ctx.rotate(i*.7+t*.03);ctx.fillStyle=colors[i%5]+'66';ctx.fillRect(-26,-20,52,40);ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.moveTo(-26,-20);ctx.lineTo(26,-20);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();}
    }
    if (energy > .6) { ctx.globalAlpha=.55; for(let i=0;i<5;i++) star(ctx,(i*77+21)%w,(i*41+27)%h,4+Math.sin(t*2+i),colors[i%5]);ctx.globalAlpha=1; }
  }
  function paint(dt) {
    ctx.clearRect(0,0,width,height); ctx.save(); const radius = Math.min(16, height / 8);
    ctx.beginPath();ctx.moveTo(radius,0);ctx.lineTo(width-radius,0);ctx.quadraticCurveTo(width,0,width,radius);ctx.lineTo(width,height-radius);ctx.quadraticCurveTo(width,height,width-radius,height);ctx.lineTo(radius,height);ctx.quadraticCurveTo(0,height,0,height-radius);ctx.lineTo(0,radius);ctx.quadraticCurveTo(0,0,radius,0);ctx.closePath();ctx.clip(); if (!quiet) background(show.motion ? time : 0); sprites(show.motion ? time : 0);
    for(const p of particles){p.age+=dt;if(p.age>p.life)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=85*dt;p.angle+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=Math.min(1,(p.life-p.age)*2);ctx.fillStyle=p.color;ctx.strokeStyle='#20234f';ctx.lineWidth=.7;
      if(p.kind==='bubble'){ctx.beginPath();ctx.arc(0,0,p.size,0,TAU);ctx.fillStyle=p.color+'44';ctx.fill();ctx.strokeStyle=p.color;ctx.lineWidth=1.5;ctx.stroke();}
      else if(p.kind==='note'||p.kind==='digit'){ctx.font=`bold ${p.size*2.7}px sans-serif`;ctx.fillText(p.kind==='note'?'♪':String(1+p.shape*3),-p.size,p.size);}
      else if(p.kind==='petal'){ctx.beginPath();ctx.ellipse(0,0,p.size*.55,p.size*1.2,0,0,TAU);ctx.fill();ctx.stroke();}
      else if(p.kind==='candy'){ctx.fillRect(-p.size,-p.size*.6,p.size*2,p.size*1.2);ctx.strokeRect(-p.size,-p.size*.6,p.size*2,p.size*1.2);ctx.beginPath();ctx.moveTo(-p.size,0);ctx.lineTo(-p.size*1.8,-p.size*.7);ctx.lineTo(-p.size*1.8,p.size*.7);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(p.shape===0)star(ctx,0,0,p.size,p.color);else{ctx.fillRect(-p.size,-p.size*.45,p.size*2,p.size*.9);ctx.strokeRect(-p.size,-p.size*.45,p.size*2,p.size*.9);}ctx.restore();
    }
    particles=particles.filter(p=>p.age<p.life);ctx.restore();
  }
  function tick(stamp){if(!running)return;frame=canvas.requestAnimationFrame(tick);if(last&&stamp-last<30)return;const dt=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;time+=dt*(show.motionScale||1);if(localParticles&&finale&&show.finale==='fireworks'&&time>fireworksAt){spawn(width*(.15+Math.random()*.7),height*(.12+Math.random()*.4),'classic');fireworksAt=time+.6;}paint(dt);}
  function stop(){running=false;if(frame)canvas.cancelAnimationFrame(frame);frame=0;last=0;}
  function start(){if(running||!show.motion)return;running=true;last=0;frame=canvas.requestAnimationFrame(tick);}
  return { configure(value, category='', isFinale=false, isQuiet=false, withParticles=true){show=value||{};cat=category;finale=!!isFinale;quiet=!!isQuiet;localParticles=withParticles;if(!localParticles)particles=[];if(localParticles&&show.motion&&show.burst&&show.burst!==burst){burst=show.burst;spawn();}if(!show.motion){stop();particles=[];paint(0);}else{paint(0);start();}}, stop, start, destroy(){disposed=true;stop();particles=[];images.clear();} };
}
module.exports = { createStageFx };
