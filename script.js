(() => {
  const opening = document.getElementById('opening');
  const invitation = document.getElementById('invitation');
  const openButton = document.getElementById('openButton');
  const skipOpening = document.getElementById('skipOpening');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const replayButton = document.getElementById('replayButton');
  let opened = false;

  // Floating "More below" cue: shown while the guest is inside the invitation,
  // hidden on the cover (which has its own button) and once the footer is reached.
  const scrollCue = document.getElementById('scrollCue');
  let coverInView = true, footerInView = false;
  function updateScrollCue() {
    const show = invitation.classList.contains('visible') && !coverInView && !footerInView;
    scrollCue.classList.toggle('is-visible', show);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      coverInView = entry.intersectionRatio > 0.35;
      updateScrollCue();
    }, { threshold: [0, 0.35, 1] }).observe(opening);
    new IntersectionObserver(([entry]) => {
      footerInView = entry.isIntersecting;
      updateScrollCue();
    }).observe(document.querySelector('.closing'));
  }
  scrollCue.addEventListener('click', () => {
    window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: 'smooth' });
  });

  function openInvitation() {
    if (opened) return;
    opened = true;
    opening.classList.add('opened');
    window.setTimeout(() => {
      invitation.classList.add('visible');
      invitation.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => invitation.classList.add('shown'));
      updateScrollCue();
      // Keep the guest on the cover. They choose when to scroll to the invitation.
      setTimeout(() => launchConfetti(), 700);
    }, 1750);
  }
  openButton.addEventListener('click', openInvitation);
  skipOpening.addEventListener('click', openInvitation);
  scrollPrompt.addEventListener('click', () => {
    document.getElementById('invitation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  replayButton.addEventListener('click', () => {
    opened = false;
    invitation.classList.remove('shown');
    invitation.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      invitation.classList.remove('visible');
      opening.classList.remove('opened');
      updateScrollCue();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 500);
  });

  function launchConfetti() {
    const layer = document.getElementById('confettiLayer');
    const colors = ['#b89a5d', '#e2d1a6', '#7b8765', '#d8b8a4', '#f8f0df', '#d7bd78', '#aab594'];
    for (let i = 0; i < 180; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      if (Math.random() > .72) piece.style.borderRadius = '50%';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--drift', ((Math.random() - .5) * 260) + 'px');
      piece.style.animationDelay = (Math.random() * .8) + 's';
      piece.style.animationDuration = (2.8 + Math.random() * 1.3) + 's';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 6500);
    }
  }

  // Countdown target: update this date/time for the real wedding.
  const weddingDate = new Date('2026-12-14T08:21:00+05:30').getTime();
  function updateCountdown() {
    const distance = Math.max(0, weddingDate - Date.now());
    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };
    Object.entries(values).forEach(([id, value]) => {
      document.getElementById(id).textContent = String(value).padStart(2, '0');
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Scratch foil. The canvas uses the exact same star geometry and aspect ratio as the SVG beneath it.
  // The foil is freshly painted on every page load; no scratch state is stored between visits.
  const scratchCards = document.querySelectorAll('.date-star-wrap');
  const scratchHint = document.querySelector('.scratch-footnote').textContent;

  scratchCards.forEach((wrap) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'scratch-canvas';
    canvas.setAttribute('aria-label', 'Scratch to reveal the date');
    wrap.appendChild(canvas);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let drawing = false, revealed = false, lastPoint = null, baselineMask = null, baselinePixels = 0;

    function starPath(context, w, h) {
      const sx = w / 240, sy = h / 230;
      context.beginPath();
      context.moveTo(120*sx, 12*sy);
      context.lineTo(148*sx, 79*sy);
      context.lineTo(221*sx, 84*sy);
      context.lineTo(165*sx, 132*sy);
      context.lineTo(182*sx, 204*sy);
      context.lineTo(120*sx, 165*sy);
      context.lineTo(58*sx, 204*sy);
      context.lineTo(75*sx, 132*sy);
      context.lineTo(19*sx, 84*sy);
      context.lineTo(92*sx, 79*sy);
      context.closePath();
    }

    function paintFoil() {
      if (revealed) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, rect.width, rect.height);

      starPath(ctx, rect.width, rect.height);
      ctx.save();
      ctx.clip();
      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, '#8f815c');
      grad.addColorStop(.18, '#e8d7a8');
      grad.addColorStop(.38, '#b5a06b');
      grad.addColorStop(.56, '#f8edce');
      grad.addColorStop(.76, '#a99562');
      grad.addColorStop(1, '#e4d09c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);
      for (let i = 0; i < 420; i++) {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,250,226,.75)' : 'rgba(92,73,39,.22)';
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.15 + .25, 0, Math.PI * 2);
        ctx.fill();
      }
      starPath(ctx, rect.width, rect.height);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#c4a65d';
      ctx.stroke();
      ctx.restore();

      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      baselineMask = new Uint8Array(canvas.width * canvas.height);
      baselinePixels = 0;
      for (let i = 0, pixel = 0; i < image.data.length; i += 4, pixel++) {
        if (image.data[i + 3] > 20) { baselineMask[pixel] = 1; baselinePixels++; }
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      canvas.style.opacity = '1';
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'auto';
      wrap.style.touchAction = 'none';
    }

    function pointFromEvent(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function scratchTo(point) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scaled = { x: point.x * dpr, y: point.y * dpr };
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(26 * dpr, wrap.clientWidth * dpr * .16);
      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(scaled.x, scaled.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(scaled.x, scaled.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      lastPoint = scaled;
    }

    function checkProgress() {
      if (revealed || !canvas.width || !canvas.height || !baselineMask || !baselinePixels) return;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let erased = 0;
      for (let pixel = 0; pixel < baselineMask.length; pixel += 4) {
        if (baselineMask[pixel] && pixels[pixel * 4 + 3] < 40) erased++;
      }
      const sampledFoil = baselinePixels / 4;
      if (sampledFoil && erased / sampledFoil > .28) {
        revealed = true;
        drawing = false;
        lastPoint = null;
        canvas.style.transition = 'opacity 900ms ease';
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
        wrap.style.touchAction = 'pan-y';
        canvas.style.touchAction = 'pan-y';
        setTimeout(() => { canvas.style.display = 'none'; }, 920);
        document.querySelector('.scratch-footnote').textContent = 'See you there ✦';
        document.getElementById('countdown').classList.add('is-visible');
      }
    }

    canvas.addEventListener('pointerdown', e => {
      if (revealed) return;
      if (!canvas.width || !canvas.height || !baselineMask) paintFoil();
      drawing = true;
      lastPoint = null;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      }
      scratchTo(pointFromEvent(e));
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing || revealed) return;
      scratchTo(pointFromEvent(e));
      e.preventDefault();
    });
    function endScratch() {
      if (!drawing) return;
      drawing = false;
      lastPoint = null;
      checkProgress();
    }
    canvas.addEventListener('pointerup', endScratch);
    canvas.addEventListener('pointercancel', endScratch);
    canvas.addEventListener('lostpointercapture', endScratch);
    window.addEventListener('resize', () => { if (!revealed) paintFoil(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (!revealed) paintFoil(); }).observe(wrap);
    window.addEventListener('pageshow', () => {
      revealed = false;
      document.getElementById('countdown').classList.remove('is-visible');
      document.querySelector('.scratch-footnote').textContent = scratchHint;
      drawing = false;
      lastPoint = null;
      requestAnimationFrame(paintFoil);
    });
    window.addEventListener('load', () => requestAnimationFrame(paintFoil));
    requestAnimationFrame(() => requestAnimationFrame(paintFoil));
    setTimeout(paintFoil, 250);
  });

  const dateButtons = [
    {
      id: 'saveDateReception',
      start: new Date('2026-12-13T19:00:00+05:30').getTime(),
      end: new Date('2026-12-14T00:00:00+05:30').getTime(),
      title: 'Reception - Arpita and Pranav',
      description: 'Reception celebrations with family and friends. Join us from 7:00 pm onwards.',
      fileName: 'reception-save-the-date.ics'
    },
    {
      id: 'saveDateMuhurtham',
      start: new Date('2026-12-14T08:21:00+05:30').getTime(),
      end: new Date('2026-12-15T00:00:00+05:30').getTime(),
      title: 'Muhurtham - Arpita and Pranav',
      description: 'Muhurtham ceremony and wedding rituals. Please bless the couple from 8:21 am onward.',
      fileName: 'muhurtham-save-the-date.ics'
    }
  ];

  dateButtons.forEach(({ id, start, end, title, description, fileName }) => {
    const button = document.getElementById(id);
    if (!button) return;

    button.addEventListener('click', () => {
      const toIcsTime = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wedding Invitation//EN',
        'BEGIN:VEVENT','UID:' + id + '@example.com',
        'DTSTAMP:' + toIcsTime(Date.now()),
        'DTSTART:' + toIcsTime(start),
        'DTEND:' + toIcsTime(end),
        'SUMMARY:' + title,
        'LOCATION:G M Convention Centre\\, Bengaluru',
        'DESCRIPTION:' + description,
        'END:VEVENT','END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });

  // Slow, graceful reveals for invitation sections only. The opening cover is untouched.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .14, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('#invitation > section, #invitation > footer').forEach(section => revealObserver.observe(section));
  document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.style.setProperty('--item-delay', `${index * 130}ms`);
    revealObserver.observe(item);
  });

  // A restrained highlight on the seconds tile gives the countdown a gentle, polished pulse.
  let previousSecond = '';
  setInterval(() => {
    const seconds = document.getElementById('seconds');
    if (!seconds || seconds.textContent === previousSecond) return;
    previousSecond = seconds.textContent;
    seconds.classList.remove('tick');
    void seconds.offsetWidth;
    seconds.classList.add('tick');
  }, 1000);
})();
