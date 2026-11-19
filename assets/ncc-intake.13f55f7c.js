
(function(){
  var d=document, $=function(s,c){return (c||d).querySelector(s)}, $$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO='IntersectionObserver' in window;

  /* Reveal on scroll, with a count-up on the numbers */
  function countUp(el){
    var end=+el.getAttribute('data-count'), suf=el.getAttribute('data-suffix')||'', t0=null, dur=1400;
    if(reduce){el.textContent=end+suf;return}
    function step(t){ if(!t0)t0=t; var p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,4);
      el.textContent=Math.round(end*e)+(p===1?suf:''); if(p<1)requestAnimationFrame(step) }
    el.textContent='0'; requestAnimationFrame(step);
  }
  function show(el){ if(el.classList.contains('in'))return; el.classList.add('in'); $$('[data-count]',el).forEach(countUp) }
  var rs=$$('[data-r]');
  if(hasIO&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    rs.forEach(function(el){io.observe(el)});
    setTimeout(function(){rs.forEach(function(el){var r=el.getBoundingClientRect(); if(r.top<innerHeight)show(el)})},1200);
  } else { rs.forEach(function(el){el.classList.add('in')}) }

  /* Opening animation: numbers count up as each slice appears; replay button */
  (function(){
    var stage=$('#stage'), nums=$$('[data-count]',stage), tm=[], rp=$('#replay');
    var ball=$('.orb-ball',stage), pics=$('.orb-pics',stage), slides=[], cur=0, show=null,
        SRC=["assets/img/ph/e1-800.webp","assets/img/ph/f2a-800.webp","assets/img/ph/h6c-800.webp","assets/img/ph/f2d-800.webp","assets/img/ph/fv1-4-800.webp"];
    function load(){ if(slides.length)return; SRC.forEach(function(src){ var im=new Image(); im.className='slide'; im.alt=''; im.decoding='async'; im.src=src; pics.appendChild(im); slides.push(im) }) }
    function pic(i){ cur=i; slides.forEach(function(im,k){im.classList.toggle('on',k===i-1)}) }   /* 0 is the main photo */
    function next(){ var n=(cur+1)%(slides.length+1), im=slides[n-1]; if(n&&!(im.complete&&im.naturalWidth))return; pic(n) }
    function play(){ if(reduce||show||!stage.classList.contains('ready'))return; load(); ball.classList.add('zoom'); show=setInterval(next,2600); setTimeout(function(){if(show)next()},800) }
    function rest(){ clearInterval(show); show=null; ball.classList.remove('zoom'); pic(0) }
    ball.addEventListener('mouseenter',play); ball.addEventListener('mouseleave',rest);
    ball.addEventListener('click',function(){ if(window.matchMedia&&matchMedia('(hover: none)').matches){ if(show)rest(); else play() } });
    function run(d0){ tm.forEach(clearTimeout); tm=[]; rest(); stage.classList.remove('ready'); if(reduce)return;
      tm.push(setTimeout(function(){ stage.classList.add('ready'); load() },d0+3000));
      nums.forEach(function(el,i){ tm.push(setTimeout(function(){countUp(el)},d0+8650+i*180)) }) }
    var ph=$('.orb-ball img',stage); if(ph&&ph.decode){ph.decode().catch(function(){})}
    var h1=$('h1',stage), col=$('.stage-copy',stage);
    function hup(){ stage.style.setProperty('--hup',(h1.offsetTop-col.firstElementChild.offsetTop)+'px') }
    hup(); addEventListener('resize',hup); addEventListener('load',hup); if(d.fonts&&d.fonts.ready)d.fonts.ready.then(hup);
    if(reduce){rp.hidden=true}
    rp.addEventListener('click',function(){ stage.style.setProperty('--d0','.3s'); stage.classList.remove('play'); void stage.offsetWidth; stage.classList.add('play'); run(300) });
    run(1000);
    run();
  })();

  /* Sticky nav: progress line, current section, mobile menu, floating WhatsApp */
  var ln=$('#ln'), bar=$('#bar'), fab=$('#fab'), endBtn=$('.final-cta .btn'), tick=false;
  function onScroll(){
    tick=false;
    var h=d.documentElement, max=h.scrollHeight-innerHeight, y=window.pageYOffset||h.scrollTop;
    bar.style.setProperty('--p',max>0?Math.min(1,y/max):0);
    /* the pill steps aside once the final button is on screen */
    if(endBtn) fab.classList.toggle('off', endBtn.getBoundingClientRect().top < innerHeight-24);
  }
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});
  addEventListener('resize',onScroll); onScroll();
  var links=$$('.ln-links a');
  if(hasIO){
    var nio=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){
      links.forEach(function(a){ if(a.getAttribute('href')==='#'+e.target.id)a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current') }) } })},{rootMargin:'-45% 0px -50% 0px'});
    $$('[data-nav]').forEach(function(s){nio.observe(s)});
  }
  var tg=$('.ln-toggle');
  tg.addEventListener('click',function(){var o=ln.classList.toggle('open'); tg.setAttribute('aria-expanded',o)});
  links.forEach(function(a){a.addEventListener('click',function(){ln.classList.remove('open');tg.setAttribute('aria-expanded','false')})});

  /* Segmented controls: sliding thumb */
  function thumb(seg){
    var on=$('[aria-selected="true"],[aria-pressed="true"]',seg), t=$('.thumb',seg); if(!on||!t)return;
    t.style.width=on.offsetWidth+'px'; t.style.height=on.offsetHeight+'px'; t.style.transform='translate('+on.offsetLeft+'px,'+on.offsetTop+'px)';
  }
  function segInit(seg,attr,cb){
    var bs=$$('button',seg);
    function pick(b,focus){ bs.forEach(function(x){x.setAttribute(attr,x===b?'true':'false'); if(attr==='aria-selected')x.tabIndex=x===b?0:-1});
      thumb(seg); if(focus)b.focus(); if(b.scrollIntoView&&seg.parentNode.classList.contains('seg-scroll')){var p=seg.parentNode; p.scrollTo({left:b.offsetLeft-(p.clientWidth-b.offsetWidth)/2,behavior:reduce?'auto':'smooth'})} cb(b) }
    bs.forEach(function(b,i){
      b.addEventListener('click',function(){pick(b)});
      b.addEventListener('keydown',function(e){ var k=e.key, n=null;
        if(k==='ArrowRight')n=bs[(i+1)%bs.length]; if(k==='ArrowLeft')n=bs[(i-1+bs.length)%bs.length];
        if(n){e.preventDefault();pick(n,true)} });
    });
    thumb(seg);
  }
  function rethumb(){$$('.seg').forEach(thumb)}
  addEventListener('resize',rethumb); addEventListener('load',rethumb);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(rethumb);

  /* Route: 9 or 14 months */
  var R={ '9':{m:9,c:120,s:2,u:'6 to 7',mix:'units: 4 core + 2 or 3 optional',s2:'Two or three optional units'},
          '14':{m:14,c:180,s:3,u:'8 to 9',mix:'units: 4 core, then optional units',s2:'Optional units, choose any two'} };
  function tween(el,to){ var from=parseInt(el.textContent,10)||0; if(reduce||from===to){el.textContent=to;return}
    var t0=null; (function f(t){ if(!t0)t0=t; var p=Math.min(1,(t-t0)/600), e=1-Math.pow(1-p,3); el.textContent=Math.round(from+(to-from)*e); if(p<1)requestAnimationFrame(f) })(performance.now()) }
  segInit($('#pace-seg'),'aria-pressed',function(b){
    var r=R[b.getAttribute('data-route')];
    tween($('#r-months'),r.m); tween($('#r-credits'),r.c); tween($('#r-sems'),r.s);
    $('#r-units').textContent=r.u; $('#r-mix').textContent=r.mix; $('#r-s2').textContent=r.s2;
    $('#track').lastElementChild.classList.toggle('off',r.s<3);
  });

  /* Pathway tabs */
  segInit($('#path-seg'),'aria-selected',function(b){
    $$('.panel').forEach(function(p){ var on=p.id===b.getAttribute('aria-controls'); p.hidden=!on; p.classList.remove('show'); if(on){void p.offsetWidth;p.classList.add('show')} });
  });

  /* Entry requirements */
  var E={o:'Five subjects at grade C or above, including English and Mathematics.',m:'At least 55% marks.',a:'Apply based on your completed qualifications.'};
  segInit($('#entry-seg'),'aria-pressed',function(b){
    var o=$('#entry-out'); $('b',o).textContent=E[b.getAttribute('data-k')]; o.classList.remove('swap'); void o.offsetWidth; o.classList.add('swap');
  });

  /* Unit tiles: plus button */
  $$('.plus').forEach(function(b){ b.addEventListener('click',function(){ var u=b.parentNode, o=u.classList.toggle('open'); b.setAttribute('aria-expanded',o) }) });

  /* Scrolling rows (countries, leadership, faculty, what's included): arrow buttons move the row; they hide when everything already fits */
  $$('.gal.row').forEach(function(g){
    var track=$('.gal-track',g), items=[].slice.call(track.children), prev=$('.prev',g), next=$('.next',g), ctl=$('.gal-ctl',g);
    function upd(){ prev.disabled=track.scrollLeft<8; next.disabled=track.scrollLeft>track.scrollWidth-track.clientWidth-8;
      ctl.style.display=track.scrollWidth<=track.clientWidth+8?'none':'' }
    function step(dir){ var w=items[0].offsetWidth+20, n=Math.max(1,Math.floor((track.clientWidth-40)/w)); track.scrollBy({left:dir*w*n,behavior:reduce?'auto':'smooth'}) }
    prev.addEventListener('click',function(){step(-1)}); next.addEventListener('click',function(){step(1)});
    track.addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); addEventListener('load',upd); upd();
  });

  /* Phones only: How? sits in the middle of the part of its slice you can actually see
     (above the WhatsApp pill and the screen edge), the way Why? sits in the middle of its slice. */
  (function(){
    var stage=$('#stage'), ray=$('.ray',stage), lab=ray&&$('.ray-t',ray), fab=$('#fab'), ball=$('.orb-ball',stage),
        mq=window.matchMedia?matchMedia('(max-width:559.98px)'):null, RAD=Math.PI/180;
    if(!lab||!mq) return;
    function clear(){ ['--cx','--sy','--tr'].forEach(function(k){ lab.style.removeProperty(k) }) }
    function place(){
      if(!mq.matches){ clear(); return }
      /* measured from the layout, not the screen, so the opening animation can't throw it off */
      var ox=-scrollX, oy=-scrollY, el=ray; while(el){ ox+=el.offsetLeft; oy+=el.offsetTop; el=el.offsetParent }
      var rb={left:ox, top:oy, width:ray.offsetWidth, height:ray.offsetHeight}, sc=Math.min(rb.width,rb.height)/100;
      if(!sc) return;
      var cx=rb.left+(rb.width-100*sc)/2+100*sc, cy=rb.top+(rb.height-100*sc)/2+100*sc, R2=99.3*sc,
          rin=ball.offsetWidth/2+8, lh=lab.offsetHeight||40, lw=lab.offsetWidth||40,
          yMax=Math.min(innerHeight, stage.getBoundingClientRect().bottom)-8, sx=0, sy=0, n=0, x, y;
      if(fab&&!fab.classList.contains('off')&&!fab.classList.contains('aside')) yMax=Math.min(yMax, fab.getBoundingClientRect().top-8);
      for(y=cy-R2; y<=yMax; y+=3) for(x=cx-R2; x<=cx; x+=3){
        if(x<8) continue;
        var dx=cx-x, dy=cy-y, r=Math.sqrt(dx*dx+dy*dy), a=Math.atan2(dy,dx)/RAD;
        if(r<rin||r>R2-6||a<-45||a>22.5) continue;
        sx+=x; sy+=y; n++ }
      if(!n){ clear(); return }
      var px=sx/n, py=Math.min(sy/n, yMax-lh/2-2), ddx=cx-px, ddy=cy-py, d=Math.sqrt(ddx*ddx+ddy*ddy);
      /* keep it clear of the photo and inside the screen */
      d=Math.max(d, rin+Math.max(lw,lh)/2+4);
      lab.style.setProperty('--tr', d+'px','important');
      lab.style.setProperty('--cx', (ddx/Math.sqrt(ddx*ddx+ddy*ddy)).toFixed(4),'important');
      lab.style.setProperty('--sy', (ddy/Math.sqrt(ddx*ddx+ddy*ddy)).toFixed(4),'important');
    }
    place(); addEventListener('load',place); addEventListener('resize',place); ray.addEventListener('animationend',place);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(place);
    if(mq.addEventListener) mq.addEventListener('change',place); else if(mq.addListener) mq.addListener(place);
  })();

  /* Why? and How? on phones: a tap turns that slice red and grows it just enough for its statement,
     which is laid out line by line inside the slice's own shape. The X, a second tap, or a tap elsewhere closes it.
     The WhatsApp pill steps aside while a slice is open. Wider screens keep their hover behaviour and are not touched by this. */
  (function(){
    var stage=$('#stage'), rays=$$('.ray',stage), fab=$('#fab'), mq=window.matchMedia?matchMedia('(max-width:559.98px)'):null,
        cv=d.createElement('canvas').getContext('2d'), RAD=Math.PI/180;
    function phone(){ return !!(mq&&mq.matches) }
    function shut(){ rays.forEach(function(r){ r.classList.remove('open') }); stage.classList.remove('wheel-open'); if(fab)fab.classList.remove('aside') }
    function tw(t,font,ls){ cv.font=font; if('letterSpacing' in cv)cv.letterSpacing=ls+'px'; return cv.measureText(t).width }
    function lay(r){
      var k=rays.indexOf(r), a1=(k===0?-45:22.5)*RAD, a2=(k===0?22.5:90)*RAD,
          full=$('.full',r), xb=$('.full-x',full), src=$('.full-t',full), svg=r.firstElementChild,
          lbl=$('b',src).textContent.toUpperCase(), words=$('span',src).textContent.trim().split(/\s+/),
          fam=getComputedStyle($('span',src)).fontFamily, rb=r.getBoundingClientRect(), sc=Math.min(rb.width,rb.height)/100,
          cx=rb.left+(rb.width-100*sc)/2+100*sc, cy=rb.top+(rb.height-100*sc)/2+100*sc, R0=99.3*sc,
          rin=$('.orb-ball',stage).getBoundingClientRect().width/2+9,
          st=stage.getBoundingClientRect(), nav=$('#ln').getBoundingClientRect(),
          /* How? sits low on the screen: if the opening screen runs past the bottom edge, the page is nudged up so the whole slice shows */
          shift=k===0?Math.max(0,Math.min(st.bottom-innerHeight,innerHeight*.25)):0,
          yMin=Math.max(st.top,nav.bottom+shift)+10, yMax=Math.min(innerHeight+shift,st.bottom)-12, xMin=12, M=10,
          fs0=Math.max(12.5,Math.min(15,innerWidth*.035)), fit=$('.fit',full), s1=Math.sin(a1), c1=Math.cos(a1), s2=Math.sin(a2), c2=Math.cos(a2);
      if(!fit){ fit=d.createElement('div'); fit.className='fit'; fit.setAttribute('aria-hidden','true'); full.insertBefore(fit,xb) }
      svg.style.transformOrigin=(cx-rb.left)+'px '+(cy-rb.top)+'px';
      function closeAt(Ro){ /* the X sits in the slice's outer top corner, kept on screen */
        var rho=Math.min(Ro-30,(cx-xMin-20)/Math.cos(a2-.12)), th=a2-Math.min(.5,24/rho), x=cx-rho*Math.cos(th), y=Math.max(cy-rho*Math.sin(th),yMin+6);
        return {x:x,y:y,r:22} }
      function row(y,Ro,X){ /* the part of a horizontal line at height y that lies inside the slice, clear of its edges, the photo and the X */
        var dy=cy-y, ro=Ro-12, lo=4, hi=cx-xMin;
        if(Math.abs(dy)>=ro) return null;
        hi=Math.min(hi,Math.sqrt(ro*ro-dy*dy));
        if(Math.abs(dy)<rin) lo=Math.max(lo,Math.sqrt(rin*rin-dy*dy));
        lo=Math.max(lo,(M+dy*c2)/s2);
        if(s1>0) hi=Math.min(hi,(dy*c1-M)/s1); else if(s1<0) lo=Math.max(lo,(M-dy*c1)/(-s1));
        if(hi-lo<=0) return null;
        if(Math.abs(y-X.y)<X.r){ var e1=cx-X.x-X.r, e2=cx-X.x+X.r;
          if(e2>lo&&e1<hi){ if(e1-lo>=hi-e2) hi=Math.min(hi,e1); else lo=Math.max(lo,e2) } }
        return hi-lo>0?[cx-hi,cx-lo]:null }
      function band(y1,y2,Ro,X){ var a=row(y1,Ro,X), b=row((y1+y2)/2,Ro,X), c=row(y2,Ro,X); if(!a||!b||!c)return null;
        var l=Math.max(a[0],b[0],c[0]), h=Math.min(a[1],b[1],c[1]); return h-l>0?[l,h]:null }
      function attempt(Ro,fs){
        var font='500 '+fs+'px '+fam, lh=Math.round(fs*1.38*10)/10, ls=-.012*fs, ww=words.map(function(w){return tw(w,font,ls)}),
            sp=tw(' ',font,ls), lw=tw(lbl,'600 10.5px '+fam,1.155)+3, X=closeAt(Ro), ok=[], y0;
        for(y0=yMin;y0<=yMax-40;y0+=3){
          var y=y0, b=band(y,y+15,Ro,X), out, i=0, j, cur;
          if(!b||b[1]-b[0]<lw) continue;
          out=[{t:lbl,lb:1,x:b[0],w:b[1]-b[0],y:y}]; y+=20;
          while(i<words.length){
            if(y+lh>yMax){out=null;break}
            b=band(y,y+lh,Ro,X); if(!b){out=null;break}
            var av=b[1]-b[0]-4; cur=ww[i]; if(cur>av){out=null;break}
            for(j=i+1;j<words.length&&cur+sp+ww[j]<=av;j++) cur+=sp+ww[j];
            out.push({t:words.slice(i,j).join(' '),x:b[0],w:b[1]-b[0],y:y}); y+=lh; i=j }
          if(out) ok.push({lines:out,top:y0,bot:y}) }
        if(!ok.length) return null;
        /* centre the words in the room the slice gives them, so the red never looks empty on one side */
        var mid=(ok[0].top+ok[ok.length-1].bot)/2, best=ok[0];
        ok.forEach(function(o){ if(Math.abs((o.top+o.bot)/2-mid)<Math.abs((best.top+best.bot)/2-mid)) best=o });
        best.fs=fs; best.lh=lh; best.X=X; return best }
      /* grow only as much as needed at normal reading size; past the point where the slice already reaches the screen edges, growing no longer helps, so the type steps down a little instead */
      var res=null, g, fs, gMax=Math.max(1.06,(Math.max(cx-xMin,cy-yMin)+40)/R0);
      for(g=1.04;g<=gMax+.0001&&!res;g+=.03) res=attempt(R0*g,fs0);
      if(res) g-=.03; else {
        for(fs=fs0-.5;!res&&fs>=10.5;fs-=.5) res=attempt(R0*gMax,fs);
        if(res){ fs=res.fs; for(g=1.04;g<gMax;g+=.03){ var r2=attempt(R0*g,fs); if(r2){res=r2;break} } if(g>gMax)g=gMax } else g=gMax }
      fit.innerHTML='';
      if(!res) return;
      if(shift>2) window.scrollBy({top:shift,behavior:reduce?'auto':'smooth'});
      r.style.setProperty('--sg',g.toFixed(3));
      res.lines.forEach(function(L){ var e=d.createElement('p'); if(L.lb)e.className='lb';
        else { e.style.fontSize=res.fs+'px'; e.style.lineHeight=res.lh+'px' }
        e.textContent=L.t; e.style.left=(L.x-rb.left)+'px'; e.style.top=(L.y-rb.top)+'px'; e.style.width=(L.w)+'px'; fit.appendChild(e) });
      xb.style.left=(res.X.x-rb.left-15)+'px'; xb.style.top=(res.X.y-rb.top-15)+'px'; xb.style.right='auto';
    }
    function toggle(r){ var was=r.classList.contains('open'); shut(); if(!was){ lay(r); r.classList.add('open'); stage.classList.add('wheel-open'); if(fab)fab.classList.add('aside') } }
    rays.forEach(function(r){
      r.addEventListener('click',function(){ if(!phone())return; toggle(r); if(r.blur)r.blur() });
      r.addEventListener('keydown',function(e){ if(!phone())return; if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(r)} else if(e.key==='Escape'){shut()} });
    });
    d.addEventListener('pointerdown',function(e){ if(stage.classList.contains('wheel-open')&&!(e.target.closest&&e.target.closest('.ray')))shut() });
    addEventListener('resize',function(){ if(phone())rays.forEach(function(r){ if(r.classList.contains('open'))lay(r) }) });
    if(mq){ var chg=function(){ if(!mq.matches)shut() }; if(mq.addEventListener)mq.addEventListener('change',chg); else if(mq.addListener)mq.addListener(chg) }
  })();

  /* Galleries */
  function centre(track,el){ track.scrollTo({left:el.offsetLeft-(track.clientWidth-el.offsetWidth)/2,behavior:reduce?'auto':'smooth'}) }
  function nearest(track,items){ var mid=track.scrollLeft+track.clientWidth/2, best=0, bd=1e9;
    items.forEach(function(it,i){var c=it.offsetLeft+it.offsetWidth/2, dd=Math.abs(c-mid); if(dd<bd){bd=dd;best=i}}); return best }

  /* Highlights: dots, autoplay, play and pause */
  (function(){
    var g=$('#hl'), track=$('.gal-track',g), items=$$('.hl',g), dots=$('.dots',g), pp=$('.pp',g), cur=0, timer=null, DUR=3830, want=!reduce, inView=false;
    g.style.setProperty('--dur',DUR+'ms');
    items.forEach(function(it,i){ var b=d.createElement('button'); b.type='button'; b.className='dot'; b.setAttribute('aria-label','Highlight '+(i+1)+' of '+items.length+': '+$('h3',it).textContent); var tk=d.createElement('span'); tk.className='tk'; tk.appendChild(d.createElement('i')); b.appendChild(tk);
      b.addEventListener('click',function(){go(i,true)}); dots.appendChild(b) });
    var ds=$$('.dot',dots);
    function mark(i){ cur=i; items.forEach(function(it,j){it.classList.toggle('on',j===i)}); ds.forEach(function(x,j){ if(j===i)x.setAttribute('aria-current','true'); else x.removeAttribute('aria-current') }) }
    function go(i,user){ mark(i); centre(track,items[i]); if(user)restart() }
    function stop(){ clearTimeout(timer); timer=null; g.classList.remove('playing') }
    function start(){ stop(); if(!want||!inView)return; g.classList.add('playing'); var a=ds[cur].querySelector('i'); a.style.animation='none'; void a.offsetWidth; a.style.animation='';
      timer=setTimeout(function(){ go((cur+1)%items.length); start() },DUR) }
    function restart(){ if(want)start() }
    function label(){ pp.setAttribute('aria-label',want?'Pause highlights':'Play highlights'); g.classList.toggle('playing',want&&inView) }
    pp.addEventListener('click',function(){ want=!want; label(); if(want)start(); else stop() });
    var st=null; track.addEventListener('scroll',function(){ clearTimeout(st); st=setTimeout(function(){ var n=nearest(track,items); if(n!==cur){mark(n);restart()} },120) },{passive:true});
    ['pointerdown','keydown'].forEach(function(ev){ track.addEventListener(ev,function(){ if(want){want=false;label();stop()} },{passive:true}) });
    if(hasIO){ new IntersectionObserver(function(es){ inView=es[0].isIntersecting; if(inView)start(); else stop() },{threshold:.45}).observe(track) }
    mark(0); label();
  })();

})();

/* Meta Pixel and Google Analytics, the same set-up as the rest of the site (site.js) */
(function () {
  var PIXEL_ID = '1787740949492785';
  if (window.fbq) return;
  var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!window._fbq) window._fbq = n;
  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
  var t = document.createElement('script'); t.async = true; t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(t);
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  window.fbq('track', 'ViewContent', { content_name: 'NCC Intake Jan 2027' });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^https:\/\/wa\.me\//.test(h)) window.fbq('track', 'Contact', { content_name: 'WhatsApp' });
    else if (/^tel:/.test(h)) window.fbq('track', 'Contact', { content_name: 'Call' });
  }, true);
})();
(function () {
  var GA_ID = 'G-QJ33453WKK';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  var t = document.createElement('script'); t.async = true; t.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(t);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^https:\/\/wa\.me\//.test(h)) window.gtag('event', 'whatsapp_click', { link_url: location.pathname });
    else if (/^tel:/.test(h)) window.gtag('event', 'phone_click', { link_url: location.pathname });
  }, true);
})();
