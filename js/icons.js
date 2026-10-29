// Inline SVG icons + original road-sign drawings (no copied images)
const S=(b,v='0 0 24 24')=>`<svg viewBox="${v}" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const ICON={
 next:S('<path d="M8 4l9 8-9 8z" fill="currentColor"/>'),
 back:S('<path d="M16 4 7 12l9 8z" fill="currentColor"/>'),
 ok:S('<path d="M4 12l5 5L20 6"/>'),
 no:S('<path d="M5 5l14 14M19 5 5 19"/>'),
 audio:S('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>'),
 globe:S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
 bulb:S('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>'),
 timer:S('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
 exam:S('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
 repeat:S('<path d="M4 11a8 8 0 0 1 14-5l2 2M20 13a8 8 0 0 1-14 5l-2-2"/><path d="M20 3v5h-5M4 21v-5h5"/>'),
 book:S('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
 tv:S('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 2l4 4 4-4M10 10l4 2-4 2z"/>'),
 menu:S('<path d="M4 6h16M4 12h16M4 18h16"/>'),
 play:S('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
 tr:S('<path d="M3 5h9M7 3v2c0 4-2 7-4 8M5 9c1 2 3 4 6 4M13 20l4-9 4 9M14.5 17h5"/>'),
 home:S('<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/>'),
 eye:S('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 x:S('<path d="M6 6l12 12M18 6 6 18"/>'),
 cog:S('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
 portrait:S('<rect x="7" y="2" width="10" height="20" rx="2"/>'),
 landscape:S('<rect x="2" y="7" width="20" height="10" rx="2"/>')
};
const tri=(inner,inv)=>`<svg viewBox="0 0 100 100" class="sign">${inv?'<path d="M5 12h90L50 92z" fill="#fff" stroke="#d00" stroke-width="9" stroke-linejoin="round"/>':'<path d="M50 8 95 88H5z" fill="#fff" stroke="#d00" stroke-width="9" stroke-linejoin="round"/>'}${inner||''}</svg>`;
const disc=(inner,fill='#fff',ring='#d00')=>`<svg viewBox="0 0 100 100" class="sign"><circle cx="50" cy="50" r="44" fill="${fill}" stroke="${ring}" stroke-width="${ring=='none'?0:9}"/>${inner||''}</svg>`;
const car=(x,c)=>`<rect x="${x}" y="45" width="16" height="22" rx="4" fill="${c}"/><rect x="${x+2}" y="40" width="12" height="8" rx="2" fill="${c}"/>`;
const SIGN={
 stop:`<svg viewBox="0 0 100 100" class="sign"><path d="M30 4h40l26 26v40L70 96H30L4 70V30z" fill="#d00" stroke="#fff" stroke-width="4"/><text x="50" y="62" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" font-family="Arial">STOP</text></svg>`,
 yield:tri('',true),
 priority_road:`<svg viewBox="0 0 100 100" class="sign"><path d="M50 3 97 50 50 97 3 50z" fill="#fff" stroke="#111" stroke-width="2"/><path d="M50 18 82 50 50 82 18 50z" fill="#FFC20E"/></svg>`,
 priority_right:tri('<path d="M38 45l24 30M62 45 38 75" stroke="#111" stroke-width="7"/>'),
 danger:tri('<path d="M50 38v26" stroke="#111" stroke-width="9"/><circle cx="50" cy="75" r="5" fill="#111"/>'),
 no_entry:disc('<rect x="20" y="42" width="60" height="16" fill="#fff"/>','#d00','none'),
 no_overtaking:disc(car(28,'#d00')+car(56,'#111')),
 no_parking:disc('<path d="M22 22l56 56" stroke="#d00" stroke-width="9"/>','#1E5BB8'),
 roundabout:disc('<g fill="none" stroke="#fff" stroke-width="8"><path d="M50 24a26 26 0 0 1 24 16M74 60a26 26 0 0 1-26 16M30 68a26 26 0 0 1-4-32"/></g><path d="M80 34 72 44l-6-12zM44 84l2-14 12 6zM20 40l12-4 0 12z" fill="#fff"/>','#1E5BB8','none'),
 speed30:disc('<text x="50" y="64" text-anchor="middle" font-size="40" font-weight="900" font-family="Arial">30</text>'),
 speed50:disc('<text x="50" y="64" text-anchor="middle" font-size="40" font-weight="900" font-family="Arial">50</text>'),
 pedestrian:`<svg viewBox="0 0 100 100" class="sign"><rect x="5" y="5" width="90" height="90" rx="8" fill="#1E5BB8"/><path d="M50 14 86 80H14z" fill="#fff"/><circle cx="52" cy="40" r="5"/><path d="M50 47l-3 14 8 12M47 54l-8 6M52 52l8 4M47 61l-6 12" stroke="#111" stroke-width="4" fill="none"/></svg>`,
 built_up:`<svg viewBox="0 0 120 70" class="sign wide"><rect x="3" y="3" width="114" height="64" rx="6" fill="#fff" stroke="#111" stroke-width="4"/><text x="60" y="44" text-anchor="middle" font-size="17" font-weight="700" font-family="Arial">DORPSTAD</text></svg>`,
 motorway:`<svg viewBox="0 0 100 100" class="sign"><rect x="5" y="5" width="90" height="90" rx="8" fill="#1E5BB8"/><path d="M15 55h70M25 55v25M75 55v25M40 55l-8 25M60 55l8 25" stroke="#fff" stroke-width="5" fill="none"/><path d="M20 55q30-30 60 0" stroke="#fff" stroke-width="5" fill="none"/></svg>`
};
