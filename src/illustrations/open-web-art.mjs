const ink = '#17304a';
const cobalt = '#2b58bb';
const cream = '#fff6df';
const coral = '#e9946b';
const mint = '#a8d3bd';
const designWidth = 620;
const designHeight = 455;

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
  ctx.beginPath();
  for (let i = 0; i < 460; i++) {
    const x = ((i * 173) % 457) / 457 * width;
    const y = ((i * 127 + i * i * 7) % 463) / 463 * height;
    ctx.rect(x, y, i % 5 === 0 ? 1.5 : .8, .7);
  }
  ctx.fill();
}

function star(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + 2, y - 2, x + radius, y);
  ctx.quadraticCurveTo(x + 2, y + 2, x, y + radius);
  ctx.quadraticCurveTo(x - 2, y + 2, x - radius, y);
  ctx.quadraticCurveTo(x - 2, y - 2, x, y - radius);
  ctx.fill();
}

function radioWaves(ctx, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 11;
  ctx.beginPath();
  for (const radius of [size * .48, size * .75, size]) {
    ctx.moveTo(x + Math.cos(-1.36) * radius, y + Math.sin(-1.36) * radius);
    ctx.arc(x, y, radius, -1.36, -.21);
  }
  ctx.stroke();
  circle(ctx, x, y, size / 8, color);
}

function openBook(ctx, x, y, size, color) {
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
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const height of [22, 28, 34]) {
    ctx.moveTo(11, height);
    ctx.quadraticCurveTo(20, height - 2, 26, height + 2);
    ctx.moveTo(38, height + 2);
    ctx.quadraticCurveTo(44, height - 2, 53, height);
  }
  ctx.stroke();
  ctx.restore();
}

function windowScene(ctx, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 100, height / 100);
  ctx.lineWidth = 1.6;
  roundedRect(ctx, 0, 0, 100, 100, 3, '#f9da99', ink);
  ctx.clip();
  circle(ctx, 68, 31, 13, coral);
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
  ctx.beginPath();
  ctx.strokeStyle = ink;
  line(ctx, 50, 0, 50, 100);
  line(ctx, 0, 51, 100, 51);
  ctx.stroke();
  ctx.restore();
}

function landforms(ctx) {
  ctx.fillStyle = '#96c7a9';
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

function globe(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.21);
  circle(ctx, 3, 5, 108, '#16326d');
  circle(ctx, 0, 0, 108, cream, '#173b83');
  ctx.save();
  ctx.clip();
  landforms(ctx);
  ctx.strokeStyle = '#315e8e60';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 73, 108, 0, 0, Math.PI * 2);
  ctx.moveTo(33, 0);
  ctx.ellipse(0, 0, 33, 108, 0, 0, Math.PI * 2);
  line(ctx, 0, -108, 0, 108);
  for (const latitude of [-63, -28, 10, 51]) {
    ctx.moveTo(-111, latitude);
    ctx.quadraticCurveTo(0, latitude + 31, 111, latitude);
  }
  ctx.stroke();
  ctx.restore();

  circle(ctx, -36, -23, 7, coral, cream);
  circle(ctx, 50, -34, 6, '#2b58bb', cream);
  circle(ctx, 27, 43, 4, '#2b58bb', cream);
  ctx.restore();
}

function radioSheet(ctx, width, height, progress) {
  grain(ctx, width, height, '#ffffff29');
  ctx.lineWidth = 1;
  roundedRect(ctx, 13, 13, width - 26, height - 26, 3, null, '#edf5ff79');
  ctx.strokeStyle = '#e9f0ff69';
  ctx.beginPath();
  line(ctx, 26, 65, width - 26, 65);
  line(ctx, 26, height - 72, width - 26, height - 72);
  ctx.stroke();
  ctx.font = '600 13px "DM Sans", Arial, sans-serif';
  ctx.fillStyle = cream;
  ctx.fillText('FIELD GUIDE TO THE WEB', 27, 46);

  const globeX = 176;
  const globeY = 198;
  ctx.strokeStyle = '#a4bded75';
  ctx.setLineDash([2, 5]);
  circle(ctx, globeX, globeY, 121, null, '#a4bdedb5');
  ctx.setLineDash([]);
  star(ctx, 46, 113, 8, cream);
  star(ctx, 295, 241, 13, '#ffcf76');
  star(ctx, 60, 269, 6, '#ffcf76');
  globe(ctx, globeX, globeY);
  // A printed station marker and its signal are visible throughout the entrance.
  radioWaves(ctx, 227, 163, 34 + 4 * progress, '#a84225');

  ctx.fillStyle = cream;
  ctx.font = '400 37px Georgia, serif';
  ctx.fillText('Radio Garden', 60, height - 30);
}

function windowSheet(ctx, width, height) {
  grain(ctx, width, height, '#af4d2833');
  roundedRect(ctx, 12, 12, width - 24, height - 24, 2, null, '#a95b46');
  ctx.strokeStyle = '#a95b46';
  ctx.beginPath();
  line(ctx, 25, 49, width - 25, 49);
  line(ctx, 25, height - 58, width - 25, height - 58);
  ctx.stroke();
  windowScene(ctx, 25, 66, width - 50, height - 143);
}

function bookSheet(ctx, width, height) {
  grain(ctx, width, height, '#315d4f2e');
  roundedRect(ctx, 9, 9, width - 18, height - 18, 3, null, '#618a7c');
  openBook(ctx, 54, 9, 58, '#28564c');
  ctx.fillStyle = '#20483f';
  ctx.font = '400 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Standard Ebooks', width / 2, height - 21);
}

function hero(ctx, progress) {
  const unsettled = 1 - progress;
  paper(ctx, 393 - 9 * unsettled, 91, 181, 278, .15 - .045 * unsettled, '#f2ab88', '#9b5945', windowSheet);
  paper(ctx, 137, 37 + 8 * unsettled, 353, 378, -.082 + .035 * unsettled, cobalt, '#214389',
    (surface, width, height) => radioSheet(surface, width, height, progress));
  paper(ctx, 28 + 7 * unsettled, 291 - 3 * unsettled, 167, 110, -.16 + .045 * unsettled, mint, '#618a7c', bookSheet);
}

function envelope(ctx, progress) {
  const unsettled = 1 - progress;
  paper(ctx, 154, 72 + 6 * unsettled, 330, 291, -.094, cream, '#c7b69b', (surface, width, height) => {
    grain(surface, width, height, '#87674c2a');
    roundedRect(surface, 14, 14, width - 28, height - 28, 3, null, '#c7b69b');
    surface.strokeStyle = '#b69477';
    surface.lineWidth = 1.2;
    surface.setLineDash([3, 6]);
    surface.beginPath();
    surface.moveTo(32, 235);
    surface.bezierCurveTo(162, 233, 121, 150, 228, 112);
    surface.stroke();
    surface.setLineDash([]);
    circle(surface, 228, 112, 5, coral, '#a85436');
    surface.fillStyle = ink;
    surface.font = '400 32px Georgia, serif';
    surface.fillText('From the open web', 29, 72);
  });
  paper(ctx, 113 - 5 * unsettled, 179, 376, 205, .087, cobalt, '#214389', (surface, width, height) => {
    grain(surface, width, height, '#ffffff29');
    surface.strokeStyle = '#a7bfec';
    surface.lineWidth = 1.5;
    surface.beginPath();
    line(surface, 2, height - 2, width / 2, 76);
    line(surface, width / 2, 76, width - 2, height - 2);
    surface.stroke();
    surface.fillStyle = '#3d6acb';
    surface.beginPath();
    surface.moveTo(0, 0);
    surface.lineTo(width, 0);
    surface.lineTo(width / 2, 126);
    surface.closePath();
    surface.fill();
    surface.stroke();
    circle(surface, width / 2, 118, 24, cream, '#214389');
    star(surface, width / 2, 118, 12, cobalt);
  });
}

/** Paint the hero or closing canvas in CSS pixels, with DPR set by the caller. */
export function drawFieldGuide(ctx, width, height, progress = 1, { variant = 'hero' } = {}) {
  ctx.clearRect(0, 0, width, height);
  if (width <= 0 || height <= 0) return;
  const scaled = Math.min(width / designWidth, height / designHeight);
  ctx.save();
  ctx.translate((width - designWidth * scaled) / 2, (height - designHeight * scaled) / 2);
  ctx.scale(scaled, scaled);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const settled = Math.max(0, Math.min(1, progress));
  if (variant === 'closing') envelope(ctx, settled);
  else hero(ctx, settled);
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
export function drawDiscoveryMark(ctx, width, height, kind) {
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
    openBook(ctx, 9, 10, 46, palette.ink);
  } else if (key === 'radio') {
    if (isCover) {
      ctx.save();
      ctx.translate(31, 32);
      ctx.scale(.19, .19);
      globe(ctx, 0, 0);
      radioWaves(ctx, 50, -28, 41, '#a84225');
      ctx.restore();
    } else radioWaves(ctx, 20, 45, 26, palette.ink);
  } else if (key === 'window') {
    windowScene(ctx, 12, 12, 40, 40);
  } else if (key === 'type') {
    ctx.fillStyle = palette.ink;
    ctx.font = '400 36px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aa', 32, 44);
  } else if (key === 'play') {
    star(ctx, 27, 33, 14, palette.ink);
    star(ctx, 44, 20, 7, '#bd7c42');
    circle(ctx, 45, 43, 4, '#bd7c42');
  } else {
    roundedRect(ctx, 14, 25, 36, 23, 3, null, palette.ink);
    roundedRect(ctx, 12, 17, 40, 9, 2, palette.paper, palette.ink);
    ctx.beginPath();
    ctx.strokeStyle = palette.ink;
    line(ctx, 27, 33, 37, 33);
    ctx.stroke();
  }
  ctx.restore();
}
