const ink = '#17304a';
const cobalt = '#2b58bb';
const softBlue = '#dce8fb';
const cream = '#fff8e7';
const mint = '#cde5d7';
const moss = '#356455';
const peach = '#f4b796';
const ochre = '#a94e35';
const guide = '#17304a30';
const designWidth = 600;
const designHeight = 360;

function stage(progress, start, end) {
  const elapsed = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return elapsed * elapsed * (3 - 2 * elapsed);
}

function rect(ctx, x, y, width, height, radius, fill, stroke) {
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

function dot(ctx, x, y, radius, fill, stroke) {
  if (radius <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function line(ctx, x1, y1, x2, y2, color, width = 1.5, progress = 1) {
  if (progress <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function arc(ctx, x, y, radius, start, end, color, width, progress) {
  if (progress <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, radius, start, start + (end - start) * progress, end < start);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// de Casteljau subdivision lets the drawn end follow the original curve.
function interpolate(from, to, progress) {
  return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];
}

function quadraticTo(ctx, from, control, end, progress) {
  const a = interpolate(from, control, progress);
  const b = interpolate(control, end, progress);
  ctx.quadraticCurveTo(...a, ...interpolate(a, b, progress));
}

function cubicTo(ctx, from, first, second, end, progress) {
  const a = interpolate(from, first, progress);
  const b = interpolate(first, second, progress);
  const c = interpolate(second, end, progress);
  const d = interpolate(a, b, progress);
  const e = interpolate(b, c, progress);
  ctx.bezierCurveTo(...a, ...d, ...interpolate(d, e, progress));
}

function label(ctx, text, x, y, { font = '600 14px "DM Sans", Arial, sans-serif', color = ink } = {}) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y);
}

function card(ctx, { x, y, width, height, angle = 0, fill, edge = ink }, draw) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.translate(-width / 2, -height / 2);
  ctx.lineWidth = 1.5;
  rect(ctx, 3, 6, width, height, 9, '#17304a18');
  rect(ctx, 0, 0, width, height, 9, fill, edge);
  ctx.clip();
  draw(ctx, width, height);
  ctx.restore();
}

function cropMarks(ctx, x, y, width, height, color = guide) {
  ctx.save();
  ctx.beginPath();
  const inset = 12;
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    ctx.moveTo(cx + inset * dx, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + inset * dy);
  }
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function browserBar(ctx, width, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, 34);
  line(ctx, 0, 34, width, 34, guide);
  for (const x of [17, 30, 43]) dot(ctx, x, 17, 3.2, ink);
  rect(ctx, 67, 10, width - 86, 14, 6, '#ffffff83');
}

function drawDiscovery(ctx, p, offset) {
  cropMarks(ctx, 47, 32, 504, 292);
  card(ctx, { x: 239, y: 44, width: 253, height: 163, angle: .12, fill: softBlue, edge: cobalt }, (layer, width) => {
    browserBar(layer, width, '#b8cbef');
    cropMarks(layer, 24, 57, 202, 81, '#2b58bb69');
    dot(layer, 157, 98, 28, '#b8cbef');
    dot(layer, 178, 81, 10 * stage(p, .14, .39), cobalt);
    line(layer, 39, 83, 111, 83, cobalt, 4, stage(p, .04, .28));
    line(layer, 39, 100, 99, 100, '#2b58bb70', 3, stage(p, .11, .35));
    line(layer, 39, 118, 88, 118, '#2b58bb70', 3, stage(p, .17, .41));
  });

  card(ctx, { x: 76, y: 105, width: 331, height: 182, angle: -.075, fill: cream }, (layer, width) => {
    browserBar(layer, width, mint);
    rect(layer, 22, 56, 100, 102, 5, '#f7d6ac');
    dot(layer, 87, 82, 15, peach);
    layer.beginPath();
    layer.moveTo(22, 136);
    layer.quadraticCurveTo(49, 89, 81, 124);
    layer.quadraticCurveTo(100, 148, 122, 117);
    layer.lineTo(122, 157);
    layer.lineTo(22, 157);
    layer.closePath();
    layer.fillStyle = '#90baab';
    layer.fill();
    line(layer, 138, 78, 250, 78, ink, 7, stage(p, .1, .38));
    line(layer, 138, 103, 221, 103, guide, 4, stage(p, .19, .47));
    line(layer, 138, 120, 232, 120, guide, 4, stage(p, .26, .54));
    rect(layer, 137, 141, 65, 18, 5, softBlue);
  });

  ctx.save();
  ctx.translate(offset, offset / 2);
  const handle = stage(p, .45, .81);
  line(ctx, 414, 236, 487, 303, '#17304a25', 31, handle);
  line(ctx, 409, 230, 483, 298, ink, 28, handle);
  line(ctx, 409, 230, 483, 298, peach, 22, handle);
  dot(ctx, 370, 187, 66, '#dce8fbc9');
  arc(ctx, 370, 187, 66, -Math.PI / 2, Math.PI * 1.5, cobalt, 6, stage(p, .19, .77));
  dot(ctx, 370, 187, 56, '#e9f4ff58');
  arc(ctx, 370, 187, 56, -Math.PI / 2, Math.PI * 1.5, '#2b58bb70', 1.5, stage(p, .38, .85));
  arc(ctx, 370, 187, 42, Math.PI * 1.03, Math.PI * 1.58, '#ffffffc0', 5, stage(p, .75, 1));
  ctx.restore();
}

function drawMessage(ctx, p, offset) {
  cropMarks(ctx, 61, 39, 478, 280);
  card(ctx, { x: 218, y: 49, width: 260, height: 180, angle: .14, fill: mint, edge: moss }, (layer, width, height) => {
    cropMarks(layer, 16, 16, width - 32, height - 32, '#35645560');
    rect(layer, 172, 25, 57, 57, 5, '#edf6e9', moss);
    line(layer, 186, 53, 216, 53, moss, 2, stage(p, .2, .42));
    line(layer, 201, 38, 201, 68, moss, 2, stage(p, .32, .54));
  });
  card(ctx, { x: 120, y: 62, width: 296, height: 219, angle: -.09, fill: cream }, (layer, width) => {
    line(layer, 28, 42, width - 30, 42, '#17304a50', 1.5, stage(p, 0, .24));
    label(layer, 'Say hello', 28, 81, { font: '32px Georgia, serif' });
    line(layer, 29, 105, 232, 105, '#17304a50', 2, stage(p, .14, .38));
    line(layer, 29, 127, 202, 127, '#17304a50', 2, stage(p, .22, .46));
  });

  card(ctx, { x: 173, y: 162, width: 309, height: 147, angle: .055, fill: peach, edge: ochre }, (layer, width, height) => {
    line(layer, 0, height, width / 2, 44, '#a94e3550', 2, stage(p, .12, .43));
    line(layer, width, height, width / 2, 44, '#a94e3550', 2, stage(p, .12, .43));
    layer.beginPath();
    layer.moveTo(0, 0);
    layer.lineTo(width, 0);
    layer.lineTo(width / 2, 91);
    layer.closePath();
    layer.fillStyle = '#f7c8aa';
    layer.fill();
    layer.strokeStyle = ochre;
    layer.lineWidth = 1.5;
    layer.stroke();
    dot(layer, width / 2, 87, 23 * stage(p, .4, .65), cobalt);
    line(layer, 145, 89, 151, 95, cream, 2.5, stage(p, .61, .73));
    line(layer, 151, 95, 165, 79, cream, 2.5, stage(p, .73, .9));
  });

  ctx.save();
  ctx.translate(474 + offset, 111);
  ctx.rotate(.18);
  for (const [index, y] of [0, 12, 24].entries()) {
    const wave = stage(p, .61 + index * .09, .8 + index * .09);
    if (!wave) continue;
    ctx.beginPath();
    ctx.moveTo(0, y);
    quadraticTo(ctx, [0, y], [23, y - 14], [46, y], wave);
    ctx.strokeStyle = cobalt;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawRecovery(ctx, p, offset) {
  cropMarks(ctx, 56, 35, 488, 288);
  card(ctx, { x: 125, y: 54, width: 349, height: 216, angle: .095, fill: softBlue, edge: cobalt }, (layer, width, height) => {
    cropMarks(layer, 16, 16, width - 32, height - 32, '#2b58bb65');
  });
  card(ctx, { x: 83, y: 72, width: 347, height: 219, angle: -.095, fill: cream }, (layer, width) => {
    layer.fillStyle = mint;
    layer.fillRect(0, 0, width, 48);
    line(layer, 0, 48, width, 48, guide);
    label(layer, 'Recovery code', 24, 95, { font: '31px Georgia, serif' });
    rect(layer, 22, 116, 218, 48, 6, softBlue, '#2b58bb70');
    for (const [index, x] of [49, 82, 115, 148, 181, 214].entries()) {
      const start = .13 + index * .065;
      dot(layer, x, 140, 3.8 * stage(p, start, start + .16), cobalt);
    }
    line(layer, 24, 191, 135, 191, guide, 3, stage(p, 0, .29));
    arc(layer, 306, 27, 8, Math.PI, 2 * Math.PI, moss, 4, stage(p, .04, .37));
    rect(layer, 293, 27, 26, 18, 4, moss);
  });

  ctx.save();
  ctx.translate(437 + offset, 207 + offset / 2);
  ctx.rotate(-.63);
  // Reveal the key from round bow to teeth as if it were inked left to right.
  const key = stage(p, .38, .93);
  ctx.beginPath();
  ctx.rect(-78, -42, 185 * key, 84);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(-36, 0, 40, Math.PI * .38, Math.PI * 1.62);
  ctx.lineTo(93, -15);
  ctx.lineTo(105, -3);
  ctx.lineTo(94, 19);
  ctx.lineTo(72, 19);
  ctx.lineTo(72, 6);
  ctx.lineTo(59, 6);
  ctx.lineTo(59, 19);
  ctx.lineTo(43, 19);
  ctx.lineTo(43, 10);
  ctx.lineTo(23, 10);
  ctx.lineTo(23, 19);
  ctx.lineTo(-21, 19);
  ctx.closePath();
  ctx.moveTo(-40 + 15, 0);
  ctx.arc(-40, 0, 15, 0, Math.PI * 2, true);
  ctx.fillStyle = cobalt;
  ctx.fill('evenodd');
  ctx.lineWidth = 2;
  ctx.strokeStyle = ink;
  ctx.stroke();
  line(ctx, -13, -8, 84, -8, '#e2edfe7a', 1.6, stage(p, .64, 1));
  ctx.restore();
}

const visitorCurve = [
  [[29, 159], [60, 165], [67, 119], [105, 125]],
  [[105, 125], [141, 133], [148, 150], [174, 129]],
  [[174, 129], [203, 107], [216, 107], [253, 95]],
];

function drawVisitors(ctx, p, offset) {
  cropMarks(ctx, 48, 35, 505, 291);
  card(ctx, { x: 68, y: 61, width: 320, height: 221, angle: -.062, fill: cream }, (layer, width) => {
    label(layer, 'Day', 23, 51, { font: '28px Georgia, serif' });
    line(layer, 23, 65, width - 24, 65, guide, 1.5, stage(p, 0, .19));
    for (const y of [90, 133, 176]) line(layer, 23, y, 267, y, guide);
    for (const x of [27, 84, 141, 198, 255]) line(layer, x, 89, x, 177, guide);
    const route = stage(p, .16, .83) * visitorCurve.length;
    if (route > 0) {
      layer.beginPath();
      layer.moveTo(...visitorCurve[0][0]);
      for (const [index, points] of visitorCurve.entries()) {
        if (route <= index) break;
        cubicTo(layer, ...points, Math.min(1, route - index));
      }
      layer.strokeStyle = cobalt;
      layer.lineWidth = 4;
      layer.setLineDash([5, 7]);
      layer.stroke();
      layer.setLineDash([]);
    }
    dot(layer, 29, 159, 4.5 * stage(route, 0, .27), cobalt);
    dot(layer, 105, 125, 4.5 * stage(route, 1, 1.27), cobalt);
    dot(layer, 174, 129, 4.5 * stage(route, 2, 2.27), cobalt);
    dot(layer, 253, 95, 5.5 * stage(p, .8, .93), ochre);
  });

  card(ctx, { x: 330, y: 108, width: 199, height: 185, angle: .11, fill: softBlue, edge: cobalt }, (layer, width) => {
    label(layer, 'Month', 19, 43, { font: '27px Georgia, serif' });
    line(layer, 18, 57, width - 18, 57, '#2b58bb50');
    rect(layer, 17, 71, 165, 94, 6, '#f7fbff', '#2b58bb60');
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 7; column++) {
        const selected = (row === 1 && column === 3) || (row === 2 && column === 4) || (row === 3 && column === 5);
        const start = .20 + (row * 7 + column) * .019;
        const radius = (selected ? 4.5 : 2.2) * stage(p, start, start + .15);
        dot(layer, 35 + column * 21, 88 + row * 20, radius, selected ? cobalt : '#8aa9dc');
      }
    }
  });

  ctx.save();
  ctx.translate(offset, offset / 2);
  ctx.lineWidth = 1.5;
  dot(ctx, 490, 82, 22 * stage(p, .67, .85), mint, moss);
  line(ctx, 482, 82, 487, 87, moss, 2.4, stage(p, .8, .89));
  line(ctx, 487, 87, 499, 76, moss, 2.4, stage(p, .89, 1));
  ctx.restore();
}

function drawRadio(ctx, p, offset) {
  ctx.save();
  ctx.translate(285, 187);
  ctx.rotate(-.16);
  dot(ctx, 4, 8, 129, '#17304a2b');
  ctx.lineWidth = 3;
  dot(ctx, 0, 0, 129, cream, ink);
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-121, -45);
  ctx.bezierCurveTo(-99, -65, -57, -67, -41, -51);
  ctx.bezierCurveTo(-22, -24, -67, -37, -60, -10);
  ctx.bezierCurveTo(-42, 3, -82, 1, -91, -15);
  ctx.lineTo(-132, -16);
  ctx.closePath();
  ctx.moveTo(-41, 13);
  ctx.bezierCurveTo(-8, -4, 13, 24, 0, 47);
  ctx.bezierCurveTo(-14, 79, -23, 101, -35, 110);
  ctx.bezierCurveTo(-49, 99, -32, 41, -51, 28);
  ctx.closePath();
  ctx.moveTo(47, -67);
  ctx.bezierCurveTo(84, -79, 113, -77, 133, -65);
  ctx.lineTo(133, 19);
  ctx.bezierCurveTo(109, 25, 106, -21, 77, -11);
  ctx.bezierCurveTo(61, -3, 76, 37, 55, 62);
  ctx.bezierCurveTo(34, 63, 32, 13, 39, -13);
  ctx.bezierCurveTo(2, -17, 16, -52, 47, -67);
  ctx.closePath();
  ctx.fillStyle = '#91bba5';
  ctx.fill();

  ctx.strokeStyle = '#2b58bb55';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (const [index, width] of [60, 103].entries()) {
    const globeLine = stage(p, .06 + index * .08, .46 + index * .08);
    if (!globeLine) continue;
    ctx.moveTo(width, 0);
    ctx.ellipse(0, 0, width, 129, 0, 0, Math.PI * 2 * globeLine);
  }
  for (const [index, y] of [-71, -24, 27, 76].entries()) {
    const globeLine = stage(p, .13 + index * .047, .49 + index * .047);
    if (!globeLine) continue;
    ctx.moveTo(-131, y);
    quadraticTo(ctx, [-131, y], [0, y + 32], [131, y], globeLine);
  }
  ctx.stroke();
  ctx.restore();
  dot(ctx, -69, -29, 7 * stage(p, .36, .54), cobalt);
  dot(ctx, -23, 55, 6 * stage(p, .44, .62), cobalt);
  ctx.restore();

  ctx.save();
  ctx.translate(389 + offset * .45, 103);
  ctx.lineWidth = 2;
  dot(ctx, 0, 0, 8 * stage(p, .5, .69), ochre, cream);
  for (const [index, radius] of [25, 48, 71].entries()) {
    arc(ctx, 0, 0, radius, -Math.PI / 2, -.05, ochre, 7, stage(p, .57 + index * .09, .82 + index * .09));
  }
  ctx.restore();
}

const utilityDrawings = {
  discover: drawDiscovery,
  message: drawMessage,
  radio: drawRadio,
  recovery: drawRecovery,
  visitors: drawVisitors,
};

export function drawUtilityArt(ctx, width, height, kind, progress = 1) {
  const drawing = utilityDrawings[kind];
  if (!drawing || width <= 0 || height <= 0) return;

  const scale = Math.min(width / designWidth, height / designHeight);
  const frame = Math.max(0, Math.min(1, progress));
  const offset = 12 * (1 - frame);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate((width - designWidth * scale) / 2, (height - designHeight * scale) / 2);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawing(ctx, frame, offset);
  ctx.restore();
}
