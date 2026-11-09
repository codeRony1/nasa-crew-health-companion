/* Anatomy scan detailing for the interactive inline SVG in index.html.
   Keeps the existing region/view/layer IDs intact for app.js. */
(function () {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('human-body-svg');
  if (!svg) return;

  function node(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }
  function append(parent, tag, attrs) {
    const el = node(tag, attrs);
    parent.appendChild(el);
    return el;
  }
  function path(parent, d, attrs = {}) {
    return append(parent, 'path', Object.assign({ d }, attrs));
  }

  // Replace the old schematic outline with a more natural human silhouette.
  // These paths follow the existing 540 × 960 anatomy coordinate system, so
  // organ positions, leader lines, zooms, and region targets remain aligned.
  const humanOutline = [
    'M270 27',
    'C241 27 225 49 225 82',
    'C225 111 234 132 247 145',
    'C250 152 250 164 247 174',
    'C224 179 204 190 188 207',
    'C168 226 158 253 151 286',
    'C143 324 130 367 115 411',
    'C105 442 94 476 82 500',
    'C76 512 69 520 64 517',
    'C59 514 62 504 66 494',
    'L78 466 L67 495 Q62 505 57 501 Q53 497 59 484',
    'L73 451 L62 480 Q57 490 52 486 Q48 482 54 469',
    'L71 438 L61 463 Q57 472 52 468 Q49 464 54 451',
    'L79 421 Q93 377 101 338',
    'C108 301 116 265 132 240',
    'C143 222 162 207 180 201',
    'C197 195 211 198 224 208',
    'C214 230 210 260 206 292',
    'C200 328 194 370 194 407',
    'C194 434 201 455 211 476',
    'C199 513 193 556 192 601',
    'C191 632 190 652 188 670',
    'C184 716 179 768 176 813',
    'C173 853 168 887 158 909',
    'C151 925 166 933 190 934',
    'C210 935 222 926 226 908',
    'C235 863 245 813 251 768',
    'C258 721 262 680 270 662',
    'C278 680 282 721 289 768',
    'C295 813 305 863 314 908',
    'C318 926 330 935 350 934',
    'C374 933 389 925 382 909',
    'C372 887 367 853 364 813',
    'C361 768 356 716 352 670',
    'C350 652 349 632 348 601',
    'C347 556 341 513 329 476',
    'C339 455 346 434 346 407',
    'C346 370 340 328 334 292',
    'C330 260 326 230 316 208',
    'C329 198 343 195 360 201',
    'C378 207 397 222 408 240',
    'C424 265 432 301 439 338',
    'C447 377 461 421 468 438',
    'L486 451 Q491 464 486 468 Q481 472 477 463',
    'L467 438 L484 469 Q490 482 486 486 Q481 490 476 480',
    'L465 451 L479 484 Q485 497 481 501 Q476 505 471 495',
    'L460 466 L472 494 Q477 504 472 517 Q467 520 462 512',
    'C450 476 439 442 429 411',
    'C414 367 401 324 393 286',
    'C386 253 376 226 356 207',
    'C340 190 320 179 293 174',
    'C290 164 290 152 293 145',
    'C306 132 315 111 315 82',
    'C315 49 299 27 270 27 Z'
  ].join(' ');

  svg.querySelectorAll('.skin-contour').forEach(el => el.setAttribute('d', humanOutline));
  const immuneHit = svg.querySelector('#region-immune .skin-hit-path');
  if (immuneHit) immuneHit.setAttribute('d', humanOutline);

  // Add fine anatomical contour and webbing after the existing layer artwork,
  // but before click targets so decoration can never intercept a pointer.
  {
    const view = svg;
    const targets = view.querySelector('.interactive-regions-layer');
    if (!targets) return;
    const detail = node('g', { class: 'figure-detail-overlay', 'pointer-events': 'none', fill: 'none' });
    const stroke = '#51eaff';
    detail.setAttribute('stroke', stroke);
    detail.setAttribute('stroke-width', '0.8');
    detail.setAttribute('stroke-linecap', 'round');
    detail.setAttribute('stroke-linejoin', 'round');
    detail.setAttribute('opacity', '.58');

    // Clavicle, shoulder, elbow, wrist and palm contours articulate the limbs.
    path(detail, 'M182 196 Q213 180 251 190 M358 196 Q327 180 289 190', { opacity: '.85' });
    path(detail, 'M174 220 Q154 246 145 282 M366 220 Q386 246 395 282');
    path(detail, 'M145 282 Q126 348 108 418 M395 282 Q414 348 432 418');
    path(detail, 'M108 418 Q95 462 81 505 M432 418 Q445 462 459 505');
    path(detail, 'M81 505 Q77 520 74 536 M459 505 Q463 520 466 536');
    // Shoulder and forearm muscle fascicles.
    path(detail, 'M178 230 Q164 254 159 278 M184 235 Q172 260 168 281 M362 230 Q376 254 381 278 M356 235 Q368 260 372 281', { opacity: '.65' });
    path(detail, 'M134 315 Q125 365 113 402 M406 315 Q415 365 427 402 M98 440 Q91 474 84 490 M442 440 Q449 474 456 490', { opacity: '.62' });

    // Natural torso taper, abdominal wall, hip crease, knee and ankle contours.
    path(detail, 'M188 211 Q211 202 236 205 M352 211 Q329 202 304 205 M208 306 Q222 340 231 377 Q236 403 224 442 M332 306 Q318 340 309 377 Q304 403 316 442');
    path(detail, 'M239 318 Q270 327 301 318 M242 341 Q270 349 298 341 M246 366 Q270 373 294 366 M250 392 Q270 397 290 392', { opacity: '.68' });
    path(detail, 'M202 453 Q225 466 253 465 M338 453 Q315 466 287 465 M195 661 Q218 672 242 663 M345 661 Q322 672 298 663');
    path(detail, 'M204 692 Q218 701 232 692 M308 692 Q322 701 336 692 M184 858 Q201 867 220 859 M320 859 Q339 867 356 858');

    // Fine triangulated scan mesh across torso, arms and legs.
    const mesh = node('g', { class: 'figure-mesh', opacity: '.25', stroke: '#52dcff', 'stroke-width': '.52' });
    [
      'M190 220 L230 248 L270 220 L310 248 L350 220',
      'M205 255 L245 278 L270 250 L295 278 L335 255',
      'M198 292 L238 310 L270 286 L302 310 L342 292',
      'M224 330 L270 350 L316 330 M232 370 L270 386 L308 370',
      'M238 410 L270 430 L302 410 M228 452 L270 470 L312 452',
      'M215 548 L235 592 L216 638 L242 674 M325 548 L305 592 L324 638 L298 674',
      'M210 704 L226 752 L204 804 L219 851 M330 704 L314 752 L336 804 L321 851',
      'M137 306 L160 350 L125 394 L148 438 M403 306 L380 350 L415 394 L392 438'
    ].forEach(d => path(mesh, d));
    detail.appendChild(mesh);

    // Hands with separated fingers and thumb contours, in a relaxed A-pose.
    const hands = node('g', { class: 'hand-anatomy', opacity: '.9' });
    hands.setAttribute('stroke', stroke);
    hands.setAttribute('stroke-width', '1');
    hands.setAttribute('fill', 'rgba(0,240,255,.035)');
    const leftHand = 'M72 529 Q68 535 67 546 L60 570 Q59 577 63 578 Q67 579 69 573 L76 554 L72 579 Q72 586 76 586 Q80 586 81 579 L83 558 L82 583 Q83 590 87 589 Q91 588 90 581 L91 557 L94 578 Q96 584 100 581 Q103 579 101 573 L99 548 Q97 537 87 531 Z M74 548 L66 540 Q62 537 60 541 Q58 545 63 549 L74 559';
    const rightHand = 'M468 529 Q472 535 473 546 L480 570 Q481 577 477 578 Q473 579 471 573 L464 554 L468 579 Q468 586 464 586 Q460 586 459 579 L457 558 L458 583 Q457 590 453 589 Q449 588 450 581 L449 557 L446 578 Q444 584 440 581 Q437 579 439 573 L441 548 Q443 537 453 531 Z M466 548 L474 540 Q478 537 480 541 Q482 545 477 549 L466 559';
    [leftHand, rightHand].forEach(d => path(hands, d));
    // Fine finger joints and palm creases.
    path(hands, 'M69 562 L74 564 M80 567 L86 568 M92 563 L97 562 M74 545 Q82 550 92 546 M461 562 L466 564 M450 567 L454 568 M439 563 L444 562 M466 545 Q458 550 448 546', { fill: 'none', opacity: '.72' });
    detail.appendChild(hands);

    // Feet and separated toes refine the lower silhouette.
    const feet = node('g', { class: 'foot-anatomy', opacity: '.88', fill: 'none' });
    feet.setAttribute('stroke', stroke);
    feet.setAttribute('stroke-width', '.95');
    path(feet, 'M177 900 Q174 915 163 920 Q155 926 166 931 Q183 937 207 932 Q220 929 222 919 M363 900 Q366 915 377 920 Q385 926 374 931 Q357 937 333 932 Q320 929 318 919');
    path(feet, 'M164 925 Q156 927 153 932 M171 929 L165 937 M180 932 L177 939 M190 933 L190 940 M200 932 L203 938 M376 925 Q384 927 387 932 M369 929 L375 937 M360 932 L363 939 M350 933 L350 940 M340 932 L337 938');
    detail.appendChild(feet);
    view.insertBefore(detail, targets);

    // Small targets on the hands remain part of the existing immune region.
    const immune = document.getElementById('region-immune');
    if (immune) {
      ['M60 538 Q51 550 58 580 Q64 592 79 591 L104 584 L105 544 Q95 529 74 530 Z',
       'M480 538 Q489 550 482 580 Q476 592 461 591 L436 584 L435 544 Q445 529 466 530 Z'].forEach(d => {
        append(immune, 'path', { d, fill: 'transparent', stroke: 'transparent', 'stroke-width': '1', 'pointer-events': 'all', class: 'generous-hit-target hand-hit-target' });
      });
    }
  }

  // Animated telemetry traces and particles live behind the anatomy and do not
  // steal interaction from any of the eight health regions.
  const backdrop = node('g', { class: 'holo-data-rain', 'pointer-events': 'none', opacity: '.34' });
  for (let i = 0; i < 22; i += 1) {
    const x = 18 + ((i * 47) % 504);
    const y = (i * 83) % 760;
    const length = 24 + ((i * 29) % 90);
    append(backdrop, 'line', { x1: x, y1: y, x2: x, y2: y + length, stroke: i % 4 === 0 ? '#ff38b8' : '#00dfff', 'stroke-width': '.65', class: 'data-rain-line', style: `--rain-delay:${(i % 11) * -0.47}s;--rain-duration:${5 + (i % 5)}s` });
  }
  for (let i = 0; i < 32; i += 1) {
    append(backdrop, 'circle', { cx: 24 + ((i * 71) % 492), cy: 22 + ((i * 97) % 820), r: i % 7 === 0 ? '1.5' : '.8', fill: i % 3 === 0 ? '#f45bff' : '#67efff', class: 'holo-particle', style: `--particle-delay:${(i % 9) * -0.65}s` });
  }
  svg.insertBefore(backdrop, svg.firstElementChild);
})();
