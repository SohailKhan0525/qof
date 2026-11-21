const ink = '#17304a';
const cobalt = '#2b58bb';
const cream = '#fff6df';
const coral = '#e9946b';
const mint = '#a8d3bd';
const designWidth = 620;
const designHeight = 455;
const grainPaths = new Map();
let atlasTexture;

const proofs = {
  hero: {
    panel: cobalt, panelEdge: '#214389', ring: '#c9d9ffac',
    ocean: cream, land: '#96c7a9', globeEdge: '#173b83', globeShadow: '#16326d',
    grid: '#315e8e78', pin: coral, otherPins: cobalt, pinEdge: cream,
  },
  impression: {
    panel: '#22264e', panelEdge: '#151b38', ring: '#f5d79ba3',
    ocean: '#383764', land: '#9b805c', globeEdge: '#f9dc9d', globeShadow: '#171b3b',
    grid: '#fff0c1b6', pin: '#f6c276', otherPins: '#f1e4c7', pinEdge: '#343456',
  },
};

function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function circle(ctx, x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function line(ctx, x1, y1, x2, y2) {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}

function stage(progress, start, end) {
  const fraction = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return fraction * fraction * (3 - 2 * fraction);
}

function traceLine(ctx, x1, y1, x2, y2, progress) {
  if (progress > 0) line(ctx, x1, y1, x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
}

function traceLatitude(ctx, y, progress) {
  if (progress <= 0) return;
  const controlX = -111 + 111 * progress;
  const controlY = y + 31 * progress;
  ctx.moveTo(-111, y);
  ctx.quadraticCurveTo(controlX, controlY, controlX + 111 * progress, controlY + 31 * progress * (1 - 2 * progress));
}

function traceStroke(ctx, length, progress) {
  if (progress <= 0) return;
  if (progress >= 1) {
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.setLineDash([length * progress, length]);
  ctx.stroke();
  ctx.restore();
}

function printText(ctx, text, x, y, progress) {
  if (progress <= 0) return;
  if (progress >= 1) {
    ctx.fillText(text, x, y);
    return;
  }
  const width = ctx.measureText(text).width;
  const left = ctx.textAlign === 'center' ? x - width / 2 : x;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left - 2, y - 55, (width + 4) * progress, 65);
  ctx.clip();
  ctx.fillText(text, x, y);
  ctx.restore();
}

function paper(ctx, x, y, width, height, tilt, fill, edge, paint) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(tilt);
  ctx.translate(-width / 2, -height / 2);
  // Two solid translucent offsets suggest stacked paper without a filter pass.
  roundedRect(ctx, 3, 8, width, height, 8, '#17304a16');
  roundedRect(ctx, 1, 3, width, height, 8, '#17304a23');
  roundedRect(ctx, 0, 0, width, height, 7, fill, edge);
  ctx.clip();
  paint(ctx, width, height);
  ctx.restore();
}

function grain(ctx, width, height, color) {
  ctx.fillStyle = color;
  const key = `${width}:${height}`;
  let texture = grainPaths.get(key);
  if (!texture) {
    // Keep resize-driven cover sizes from growing this cache indefinitely.
    if (grainPaths.size >= 16) grainPaths.delete(grainPaths.keys().next().value);
    texture = new Path2D();
    for (let i = 0; i < 460; i++) {
      const x = ((i * 173) % 457) / 457 * width;
      const y = ((i * 127 + i * i * 7) % 463) / 463 * height;
      texture.rect(x, y, i % 5 === 0 ? 1.5 : .8, .7);
    }
    grainPaths.set(key, texture);
  }
  ctx.fill(texture);
}

function star(ctx, x, y, radius, color) {
  if (radius <= 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + 2, y - 2, x + radius, y);
  ctx.quadraticCurveTo(x + 2, y + 2, x, y + radius);
  ctx.quadraticCurveTo(x - 2, y + 2, x - radius, y);
  ctx.quadraticCurveTo(x - 2, y - 2, x, y - radius);
  ctx.fill();
}

function radioWaves(ctx, x, y, size, color, progress = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 11;
  ctx.beginPath();
  const radii = [size * .48, size * .75, size];
  for (const [index, radius] of radii.entries()) {
    const extension = stage(progress, index * .16, .54 + index * .16);
    if (extension <= 0) continue;
    ctx.moveTo(x + Math.cos(-1.36) * radius, y + Math.sin(-1.36) * radius);
    ctx.arc(x, y, radius, -1.36, -1.36 + 1.15 * extension);
  }
  ctx.stroke();
  circle(ctx, x, y, size / 8 * stage(progress, 0, .3), color);
}

function openBook(ctx, x, y, size, color, progress = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.25;
  ctx.beginPath();
  ctx.moveTo(32, 48);
  ctx.bezierCurveTo(25, 40, 14, 41, 5, 42);
  ctx.lineTo(5, 15);
  ctx.bezierCurveTo(16, 12, 26, 14, 32, 20);
  ctx.bezierCurveTo(38, 14, 48, 12, 59, 15);
  ctx.lineTo(59, 42);
  ctx.bezierCurveTo(50, 41, 39, 40, 32, 48);
  line(ctx, 32, 20, 32, 48);
  traceStroke(ctx, 170, stage(progress, 0, .67));
  ctx.lineWidth = 1.6;
  for (const [index, height] of [22, 28, 34].entries()) {
    ctx.beginPath();
    ctx.moveTo(11, height);
    ctx.quadraticCurveTo(20, height - 2, 26, height + 2);
    ctx.moveTo(38, height + 2);
    ctx.quadraticCurveTo(44, height - 2, 53, height);
    traceStroke(ctx, 17, stage(progress, .41 + index * .09, .8 + index * .09));
  }
  ctx.restore();
}

function windowScene(ctx, x, y, width, height, progress = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 100, height / 100);
  ctx.lineWidth = 1.6;
  roundedRect(ctx, 0, 0, 100, 100, 3, '#f9da99', ink);
  ctx.clip();
  circle(ctx, 68, 31, 13 * stage(progress, .14, .55), coral);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 100 * stage(progress, 0, .66), 100);
  ctx.clip();
  ctx.fillStyle = '#92bba5';
  ctx.beginPath();
  ctx.moveTo(0, 76);
  ctx.quadraticCurveTo(22, 33, 51, 59);
  ctx.quadraticCurveTo(78, 83, 100, 62);
  ctx.lineTo(100, 100);
  ctx.lineTo(0, 100);
  ctx.fill();
  ctx.fillStyle = '#4e7d6c';
  ctx.beginPath();
  ctx.moveTo(0, 91);
  ctx.quadraticCurveTo(40, 73, 58, 80);
  ctx.quadraticCurveTo(87, 93, 100, 69);
  ctx.lineTo(100, 100);
  ctx.lineTo(0, 100);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = ink;
  traceLine(ctx, 50, 0, 50, 100, stage(progress, .35, .8));
  traceLine(ctx, 0, 51, 100, 51, stage(progress, .5, 1));
  ctx.stroke();
  ctx.restore();
}

function landforms(ctx, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-107, -48);
  ctx.bezierCurveTo(-93, -61, -77, -64, -59, -60);
  ctx.bezierCurveTo(-49, -73, -43, -58, -32, -54);
  ctx.bezierCurveTo(-15, -53, -29, -35, -47, -33);
  ctx.bezierCurveTo(-60, -27, -53, -19, -64, -16);
  ctx.bezierCurveTo(-57, -2, -47, -2, -44, 10);
  ctx.bezierCurveTo(-59, 7, -71, -5, -74, -16);
  ctx.bezierCurveTo(-89, -24, -94, -22, -107, -27);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-43, 16);
  ctx.bezierCurveTo(-28, 8, -18, 27, -3, 26);
  ctx.bezierCurveTo(2, 41, -21, 55, -17, 69);
  ctx.bezierCurveTo(-28, 78, -32, 93, -41, 87);
  ctx.bezierCurveTo(-44, 74, -37, 60, -43, 48);
  ctx.bezierCurveTo(-52, 38, -54, 26, -43, 16);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(20, -32);
  ctx.bezierCurveTo(34, -38, 37, -44, 36, -58);
  ctx.bezierCurveTo(46, -66, 49, -49, 56, -53);
  ctx.bezierCurveTo(66, -81, 101, -70, 120, -47);
  ctx.lineTo(121, 22);
  ctx.bezierCurveTo(100, 30, 95, 9, 88, 4);
  ctx.bezierCurveTo(80, -16, 69, -1, 61, -6);
  ctx.bezierCurveTo(56, 2, 56, 14, 49, 18);
  ctx.bezierCurveTo(44, 13, 48, -3, 33, -4);
  ctx.bezierCurveTo(28, -7, 10, -14, 20, -32);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(18, -14);
  ctx.bezierCurveTo(26, -17, 37, -10, 46, -5);
  ctx.bezierCurveTo(47, 8, 35, 15, 37, 29);
  ctx.bezierCurveTo(29, 35, 25, 57, 15, 58);
  ctx.bezierCurveTo(6, 50, 11, 31, 4, 25);
  ctx.bezierCurveTo(-7, 16, -5, -4, 18, -14);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(74, 42);
  ctx.bezierCurveTo(79, 29, 94, 32, 101, 45);
  ctx.bezierCurveTo(106, 53, 101, 61, 94, 58);
  ctx.bezierCurveTo(82, 51, 69, 61, 74, 42);
  ctx.fill();
}

function globe(ctx, x, y, progress = 1, proof = proofs.hero) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.21);
  circle(ctx, 3, 5, 108, proof.globeShadow);
  circle(ctx, 0, 0, 108, proof.ocean, proof.globeEdge);
  ctx.save();
  ctx.clip();
  const mapProgress = stage(progress, 0, .59);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-108, -108, 216 * mapProgress, 216);
  ctx.clip();
  landforms(ctx, proof.land);
  ctx.restore();
  ctx.strokeStyle = proof.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [index, longitude] of [73, 33].entries()) {
    const sweep = stage(progress, .1 + index * .12, .64 + index * .1);
    if (sweep <= 0) continue;
    ctx.moveTo(longitude, 0);
    ctx.ellipse(0, 0, longitude, 108, 0, 0, Math.PI * 2 * sweep);
  }
  traceLine(ctx, 0, -108, 0, 108, stage(progress, .24, .72));
  for (const [index, latitude] of [-63, -28, 10, 51].entries()) {
    traceLatitude(ctx, latitude, stage(progress, .13 + index * .075, .57 + index * .075));
  }
  ctx.stroke();
  ctx.restore();

  const points = [[-36, -23, 7, proof.pin], [50, -34, 6, proof.otherPins], [27, 43, 4, proof.otherPins]];
  for (const [index, [pinX, pinY, radius, colour]] of points.entries()) {
    const stamped = stage(progress, .45 + index * .095, .64 + index * .095);
    if (stamped > 0) circle(ctx, pinX, pinY, radius * stamped, colour, proof.pinEdge);
  }
  ctx.restore();
}

function websiteProof(ctx, width, height, progress, proof) {
  grain(ctx, width, height, '#87674c20');
  ctx.fillStyle = '#f9efdc';
  ctx.fillRect(0, 0, width, 53);
  roundedRect(ctx, 69, 12, width - 101, 28, 5, '#fffcf3', '#e2d4bc');
  for (const [index, fill] of ['#ca775c', '#d9aa56', '#699785'].entries()) {
    circle(ctx, 20 + index * 14, 26, 3.5, fill);
  }
  ctx.fillStyle = ink;
  ctx.font = '600 15px Figtree, Arial, sans-serif';
  ctx.fillText('loopproof.me', 83, 31);
  ctx.strokeStyle = '#c9ba9f';
  ctx.beginPath();
  traceLine(ctx, 0, 53, width, 53, stage(progress, 0, .48));
  ctx.stroke();

  ctx.save();
  const contentX = 26;
  const contentY = 76;
  const contentWidth = width - 52;
  const contentHeight = height - 102;
  roundedRect(ctx, contentX, contentY, contentWidth, contentHeight, 5, proof.panel, proof.panelEdge);
  ctx.clip();
  ctx.translate(contentX, contentY);
  grain(ctx, contentWidth, contentHeight, '#ffffff36');
  const globeX = contentWidth - 102;
  const globeY = contentHeight / 2;
  ctx.strokeStyle = proof.ring;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.arc(globeX, globeY, 92, 0, Math.PI * 2 * stage(progress, .20, .88));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(globeX, globeY);
  ctx.scale(.73, .73);
  globe(ctx, 0, 0, .43 + .57 * stage(progress, .10, .86), proof);
  ctx.restore();
  ctx.fillStyle = cream;
  ctx.font = '600 52px Raleway, Arial, sans-serif';
  ctx.fillText('Qofeno.', 27, 100);
  ctx.font = '500 18px Figtree, Arial, sans-serif';
  ctx.fillText('The website board', 30, 138);
  star(ctx, globeX - 78, globeY + 55, 8 * stage(progress, .70, .94), '#ffcf76');
  ctx.restore();
}

function prepareAtlas() {
  const contours = new Path2D();
  const dots = new Path2D();
  // Broad folds lead toward the card from opposite corners of the printing plate.
  for (let index = 0; index < 8; index++) {
    const gap = 12 * index;
    contours.moveTo(322 + gap, -42);
    contours.bezierCurveTo(391 + gap, 75, 473 + gap, 10, 506 + gap, 53);
    contours.bezierCurveTo(547 + gap, 108, 509 + gap, 162, 651 + gap, 198);
    contours.moveTo(-45, 224 + gap);
    contours.bezierCurveTo(61, 227 + gap, 36, 297 + gap, 105, 319 + gap);
    contours.bezierCurveTo(181, 345 + gap, 197, 309 + gap, 248, 367 + gap);
    contours.bezierCurveTo(285, 412 + gap, 314, 423 + gap, 383, 433 + gap);
  }
  // Distinct, softly tapering halftone deposits suggest ink rolled onto paper.
  for (const [centerX, centerY, width, height] of [[98, 84, 149, 67], [542, 298, 111, 155]]) {
    for (let column = -width; column < width; column += 6) {
      for (let row = -height; row < height; row += 6) {
        const strength = 1 - Math.hypot(column / width, row / height);
        if (strength <= .11) continue;
        const x = centerX + column;
        const y = centerY + row + (column % 12 ? 3 : 0);
        const radius = .24 + .83 * strength;
        dots.moveTo(x + radius, y);
        dots.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
  }
  return { contours, dots };
}

function printAtlas(ctx) {
  atlasTexture ??= prepareAtlas();
  ctx.save();
  ctx.lineWidth = .95;
  ctx.strokeStyle = '#637ca44e';
  ctx.stroke(atlasTexture.contours);
  ctx.fillStyle = '#617aa655';
  ctx.fill(atlasTexture.dots);
  grain(ctx, designWidth, designHeight, '#61594920');

  ctx.strokeStyle = '#5f779a76';
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(37, 352);
  ctx.bezierCurveTo(157, 440, 475, 83, 571, 105);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const [x, y] of [[37, 352], [571, 105]]) {
    circle(ctx, x, y, 7, null, '#637ca488');
    circle(ctx, x, y, 2.2, '#637ca4be');
  }

  ctx.strokeStyle = '#8e836970';
  ctx.beginPath();
  line(ctx, 29, 57, 29, 41);
  line(ctx, 29, 41, 45, 41);
  line(ctx, 576, 408, 592, 408);
  line(ctx, 592, 408, 592, 392);
  ctx.stroke();
  ctx.restore();
}

function hero(ctx, progress, proof) {
  const arrival = 1 - stage(progress, 0, .8);
  printAtlas(ctx);
  paper(ctx, 84, 67 + 9 * arrival, 448, 314, .076, '#e0e8f2', '#8a9fbc', (surface, width, height) => {
    grain(surface, width, height, '#315e8e2e');
    roundedRect(surface, 13, 13, width - 26, height - 26, 3, null, '#91a6c3');
  });
  paper(ctx, 52 + 6 * arrival, 83 + 6 * arrival, 497, 292, -.032 + .03 * arrival, '#fff8e9', '#baad96',
    (surface, width, height) => websiteProof(surface, width, height, progress, proof));
  const unsettled = 1 - stage(progress, .30, .9);
  paper(ctx, 374 + 12 * unsettled, 345 + 5 * unsettled, 171, 48, -.08 + .055 * unsettled, mint, '#6f9886', (surface, width, height) => {
    grain(surface, width, height, '#315d4f2e');
    circle(surface, 21, 24, 4, '#225642');
    surface.fillStyle = '#214536';
    surface.font = '700 16px Figtree, Arial, sans-serif';
    surface.fillText('Owner placement', 34, 30);
  });
}

function envelope(ctx, progress) {
  const unsettled = 1 - progress;
  paper(ctx, 154, 72 + 6 * unsettled, 330, 291, -.094, cream, '#c7b69b', (surface, width, height) => {
    grain(surface, width, height, '#87674c2a');
    roundedRect(surface, 14, 14, width - 28, height - 28, 3, null, '#c7b69b');
    surface.save();
    surface.beginPath();
    surface.rect(31, 107, 205 * stage(progress, .19, .72), 131);
    surface.clip();
    surface.strokeStyle = '#b69477';
    surface.lineWidth = 1.2;
    surface.setLineDash([3, 6]);
    surface.beginPath();
    surface.moveTo(32, 235);
    surface.bezierCurveTo(162, 233, 121, 150, 228, 112);
    surface.stroke();
    surface.restore();
    const mark = stage(progress, .65, .86);
    surface.lineWidth = 1.2;
    if (mark > 0) circle(surface, 228, 112, 5 * mark, coral, '#a85436');
    surface.fillStyle = ink;
    surface.font = '400 32px Georgia, serif';
    printText(surface, 'From the open web', 29, 72, stage(progress, .07, .66));
  });
  paper(ctx, 113 - 5 * unsettled, 179, 376, 205, .087, cobalt, '#214389', (surface, width, height) => {
    grain(surface, width, height, '#ffffff29');
    surface.strokeStyle = '#a7bfec';
    surface.lineWidth = 1.5;
    surface.beginPath();
    traceLine(surface, 2, height - 2, width / 2, 76, stage(progress, .03, .48));
    traceLine(surface, width / 2, 76, width - 2, height - 2, stage(progress, .35, .73));
    surface.stroke();
    surface.save();
    surface.beginPath();
    surface.rect(0, 0, width, 126 * stage(progress, 0, .57));
    surface.clip();
    surface.fillStyle = '#3d6acb';
    surface.beginPath();
    surface.moveTo(0, 0);
    surface.lineTo(width, 0);
    surface.lineTo(width / 2, 126);
    surface.closePath();
    surface.fill();
    surface.restore();
    traceStroke(surface, 830, stage(progress, .22, .76));
    const seal = stage(progress, .68, .95);
    if (seal > 0) circle(surface, width / 2, 118, 24 * seal, cream, '#214389');
    star(surface, width / 2, 118, 12 * stage(progress, .78, 1), cobalt);
  });
}

/** Paint the hero or closing canvas in CSS pixels, with DPR set by the caller. */
export function drawFieldGuide(ctx, width, height, progress = 1, { variant = 'hero' } = {}) {
  ctx.clearRect(0, 0, width, height);
  if (width <= 0 || height <= 0) return;
  const isClosing = variant === 'closing';
  const scaled = isClosing
    ? Math.min(width / designWidth, height / designHeight)
    : Math.min(width / 566, height / 414);
  ctx.save();
  ctx.translate((width - designWidth * scaled) / 2, (height - designHeight * scaled) / 2);
  ctx.scale(scaled, scaled);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const settled = Math.max(0, Math.min(1, progress));
  if (isClosing) envelope(ctx, settled);
  else hero(ctx, settled, variant === 'impression' ? proofs.impression : proofs.hero);
  ctx.restore();
}

const marks = {
  archive: { paper: '#f6e9d5', ink: '#69442d' },
  book: { paper: '#e1f0e7', ink: '#255d4f' },
  radio: { paper: '#dce8fb', ink: '#254b9b' },
  window: { paper: '#f8e1d3', ink },
  type: { paper: '#e9e8f6', ink: '#4b4982' },
  play: { paper: '#f9edcc', ink: '#845525' },
};

/** Each editorial pick gets its own drawing, keyed by the kind of site. */
export function drawDiscoveryMark(ctx, width, height, kind, progress = 1) {
  ctx.clearRect(0, 0, width, height);
  if (width <= 0 || height <= 0) return;
  const key = kind === 'books' ? 'book' : kind;
  const palette = marks[key] ?? marks.archive;
  const isCover = width / height >= 1.5;
  const scaled = Math.min(width, height) / 64;
  ctx.save();
  if (isCover) {
    const fieldWidth = width / scaled;
    ctx.save();
    ctx.scale(scaled, scaled);
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, fieldWidth, 64);
    grain(ctx, fieldWidth, 64, palette.ink + '0b');
    ctx.globalAlpha = .23;
    ctx.lineWidth = .45;
    roundedRect(ctx, 6, 6, fieldWidth - 12, 52, 2, null, palette.ink);
    ctx.strokeStyle = palette.ink;
    ctx.beginPath();
    line(ctx, 13, 13, 13, 18);
    line(ctx, 13, 13, 18, 13);
    line(ctx, fieldWidth - 13, 51, fieldWidth - 18, 51);
    line(ctx, fieldWidth - 13, 51, fieldWidth - 13, 46);
    ctx.stroke();
    ctx.restore();
  }
  ctx.translate((width - 64 * scaled) / 2, (height - 64 * scaled) / 2);
  ctx.scale(scaled, scaled);
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (!isCover) roundedRect(ctx, 0, 0, 64, 64, 7, palette.paper);
  if (key === 'book') {
    openBook(ctx, 9, 10, 46, palette.ink, progress);
  } else if (key === 'radio') {
    if (isCover) {
      ctx.save();
      ctx.translate(31, 32);
      ctx.scale(.19, .19);
      globe(ctx, 0, 0, stage(progress, 0, .83));
      radioWaves(ctx, 50, -28, 41, '#a84225', stage(progress, .37, 1));
      ctx.restore();
    } else radioWaves(ctx, 20, 45, 26, palette.ink, progress);
  } else if (key === 'window') {
    windowScene(ctx, 12, 12, 40, 40, progress);
  } else if (key === 'type') {
    ctx.fillStyle = palette.ink;
    ctx.font = '400 36px Georgia, serif';
    ctx.textAlign = 'center';
    printText(ctx, 'Aa', 32, 44, stage(progress, .04, .94));
  } else if (key === 'play') {
    star(ctx, 27, 33, 14 * stage(progress, 0, .62), palette.ink);
    star(ctx, 44, 20, 7 * stage(progress, .31, .8), '#bd7c42');
    circle(ctx, 45, 43, 4 * stage(progress, .58, .93), '#bd7c42');
  } else {
    roundedRect(ctx, 14, 25, 36, 23, 3);
    ctx.strokeStyle = palette.ink;
    traceStroke(ctx, 115, stage(progress, .05, .73));
    roundedRect(ctx, 12, 17, 40, 9, 2, palette.paper);
    traceStroke(ctx, 96, stage(progress, .28, .9));
    ctx.beginPath();
    traceLine(ctx, 27, 33, 37, 33, stage(progress, .67, .99));
    ctx.stroke();
  }
  ctx.restore();
}
