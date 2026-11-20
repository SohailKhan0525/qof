const ink = '#17304a';
const cobalt = '#2b58bb';
const navy = '#1b3a79';
const cream = '#fff6df';
const mint = '#b4d9c5';
const paleMint = '#dff0e6';
const forest = '#245e50';
const peach = '#f2aa87';
const palePeach = '#f7d4bb';
const gold = '#f5d587';
const width = 600;
const height = 360;

function rectangle(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
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
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function limit(value) {
  return Math.max(0, Math.min(1, value));
}

function stage(progress, start, end) {
  const position = limit((progress - start) / (end - start));
  return position * position * (3 - 2 * position);
}

function strokePath(ctx, points, color, size = 2, progress = 1) {
  if (progress <= 0) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.moveTo(...points[0]);
  if (progress >= 1) {
    for (const point of points.slice(1)) ctx.lineTo(...point);
  } else {
    const segments = points.slice(1).map(([x, y], index) =>
      Math.hypot(x - points[index][0], y - points[index][1]));
    let distance = progress * segments.reduce((sum, length) => sum + length, 0);
    for (const [index, length] of segments.entries()) {
      const [x, y] = points[index];
      const [endX, endY] = points[index + 1];
      if (distance <= length) {
        const fraction = length === 0 ? 0 : distance / length;
        ctx.lineTo(x + (endX - x) * fraction, y + (endY - y) * fraction);
        break;
      }
      ctx.lineTo(endX, endY);
      distance -= length;
    }
  }
  ctx.stroke();
}

function label(ctx, value, x, y, font, fill = ink, alignment = 'left') {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = alignment;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function grain(ctx, w, h) {
  ctx.fillStyle = '#1025420e';
  ctx.beginPath();
  for (let index = 0; index < 260; index++) {
    const x = ((index * 157) % 263) / 263 * w;
    const y = ((index * 101 + index ** 2 * 7) % 269) / 269 * h;
    ctx.rect(x, y, index % 6 === 0 ? 1.8 : 1, 1);
  }
  ctx.fill();
}

function paper(ctx, x, y, w, h, rotation, fill, edge, draw) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.translate(-w / 2, -h / 2);
  ctx.lineWidth = 1.6;
  rectangle(ctx, 3, 7, w, h, 9, '#17304a22');
  rectangle(ctx, 0, 0, w, h, 9, fill, edge);
  ctx.clip();
  grain(ctx, w, h);
  draw(ctx, w, h);
  ctx.restore();
}

function outlines(ctx, y, x, lengths, color, separation = 20, progress = 1) {
  for (const [index, length] of lengths.entries()) {
    const lineWidth = length * stage(progress, index * .16, .64 + index * .16);
    if (lineWidth > 0) rectangle(ctx, x, y + index * separation, lineWidth, 6, 3, color);
  }
}

function guides(ctx, w, h, color) {
  ctx.lineWidth = 1.2;
  rectangle(ctx, 12, 12, w - 24, h - 24, 4, null, color);
}

function check(ctx, x, y, size, color, progress) {
  strokePath(ctx, [[x - size, y], [x - size * .3, y + size * .6], [x + size, y - size * .6]], color, size / 4, progress);
}

function spark(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + 1, y - 1, x + size, y);
  ctx.quadraticCurveTo(x + 1, y + 1, x, y + size);
  ctx.quadraticCurveTo(x - 1, y + 1, x - size, y);
  ctx.quadraticCurveTo(x - 1, y - 1, x, y - size);
  ctx.fill();
}

function submit(ctx, progress, offset) {
  paper(ctx, 268, 75, 222, 218, .19, peach, '#ad6e54', (sheet, w, h) => {
    guides(sheet, w, h, '#a66b5470');
    strokePath(sheet, [[72, 41], [190, 41]], '#904d3a50');
  });
  paper(ctx, 77, 59 + offset, 360, 222, -.09, cream, '#b9a98a', (sheet, w) => {
    rectangle(sheet, 0, 0, w, 42, 0, cobalt);
    for (const x of [22, 38, 54]) circle(sheet, x, 22, 3.7, '#fbedd598');
    const addressWidth = (w - 106) * stage(progress, .03, .38);
    if (addressWidth > 0) rectangle(sheet, 84, 14, addressWidth, 15, 6, '#e2ecfc8f');
    label(sheet, 'Your website', 27, 78, '31px Georgia, serif');
    strokePath(sheet, [[28, 103], [331, 103]], '#aeb7b1', 1.2, stage(progress, .14, .44));
    rectangle(sheet, 27, 120, 78, 73, 5, mint, '#8ab19d');
    circle(sheet, 67, 156, 19, paleMint);
    sheet.strokeStyle = forest;
    sheet.lineWidth = 1.8;
    sheet.beginPath();
    sheet.ellipse(67, 156, 19, 18, 0, 0, Math.PI * 2);
    sheet.moveTo(85, 156);
    sheet.ellipse(67, 156, 8, 18, 0, 0, Math.PI * 2);
    sheet.moveTo(48, 156);
    sheet.lineTo(86, 156);
    sheet.stroke();
    outlines(sheet, 129, 125, [168, 132, 103], '#99aaaf', 20, stage(progress, .18, .78));
  });
  ctx.save();
  ctx.translate(441, 233 + offset / 2);
  ctx.rotate(.11);
  circle(ctx, 2, 5, 40, '#17304a25');
  circle(ctx, 0, 0, 40, cobalt, navy);
  strokePath(ctx, [[-14, 13], [16, -13], [16, 3]], cream, 4.6, stage(progress, .5, .9));
  strokePath(ctx, [[16, -13], [0, -13]], cream, 4.6, stage(progress, .76, .96));
  ctx.restore();
}

function review(ctx, progress, offset) {
  paper(ctx, 111, 62, 289, 240, -.19, peach, '#ad6e54', (sheet, w, h) => {
    guides(sheet, w, h, '#a66b5470');
  });
  paper(ctx, 135, 53 + offset, 282, 232, .08, paleMint, '#87ae9a', (sheet, w, h) => {
    guides(sheet, w, h, '#8fb5a7');
    label(sheet, 'Human review', 27, 49, '29px Georgia, serif', forest);
    rectangle(sheet, 27, 79, 219, 108, 7, cream, '#abbbb0');
    circle(sheet, 67, 126, 24, mint);
    circle(sheet, 67, 119, 7, forest);
    sheet.fillStyle = forest;
    sheet.beginPath();
    sheet.arc(67, 133, 13, Math.PI, Math.PI * 2);
    sheet.fill();
    outlines(sheet, 107, 110, [104, 82, 54], '#849f94', 15, stage(progress, .08, .66));
    strokePath(sheet, [[29, 201], [129, 201]], '#8fb5a7', 1.4, stage(progress, .2, .56));
  });
  ctx.save();
  ctx.translate(418, 220 - offset * .6);
  strokePath(ctx, [[30, 29], [70, 67]], '#17304a25', 18);
  strokePath(ctx, [[30, 26], [66, 62]], navy, 15);
  circle(ctx, 0, 4, 49, '#17304a20');
  ctx.lineWidth = 3;
  circle(ctx, 0, 0, 49, cream, navy);
  ctx.lineWidth = 1.2;
  circle(ctx, 0, 0, 40, mint, '#86af9a');
  check(ctx, 0, 0, 17, forest, stage(progress, .43, .89));
  ctx.restore();
  const glint = stage(progress, .77, 1);
  if (glint > 0) spark(ctx, 483, 136, 12 * glint, '#9c6039');
}

function ranking(ctx, progress, offset) {
  paper(ctx, 127, 60, 339, 241, -.13, palePeach, '#ba856a', (sheet, w, h) => {
    guides(sheet, w, h, '#ac6c504f');
  });
  paper(ctx, 129, 42 + offset, 351, 264, .045, cream, '#b7a688', (sheet) => {
    label(sheet, 'Example ranking', 28, 41, '31px Georgia, serif');
    strokePath(sheet, [[28, 66], [324, 66]], '#adad9c', 1.4, stage(progress, .05, .38));
    for (const [index, tone] of [cobalt, paleMint, palePeach].entries()) {
      const y = 81 + index * 52;
      rectangle(sheet, 28, y, 296, 42, 5, tone);
      const foreground = index === 0 ? cream : ink;
      label(sheet, `0${index + 1}`, 47, y + 22, 'bold 20px Georgia, serif', foreground);
      const bar = [126, 84, 42][index] * stage(progress, .15 + index * .1, .66 + index * .1);
      rectangle(sheet, 99, y + 16, 126, 10, 5, index === 0 ? '#7392d3' : '#263d4a21');
      if (bar > 0) rectangle(sheet, 99, y + 16, bar, 10, 5, index === 0 ? cream : foreground);
      sheet.globalAlpha = stage(progress, .48 + index * .12, .72 + index * .12);
      label(sheet, `$${30 - index * 10}`, 302, y + 22, 'bold 20px Georgia, serif', foreground, 'right');
      sheet.globalAlpha = 1;
    }
    strokePath(sheet, [[28, 245], [324, 245]], '#c5bdac', 1.4, stage(progress, .53, .95));
  });
}

function expiry(ctx, progress, offset) {
  paper(ctx, 177, 71, 269, 232, .16, mint, '#80ad95', (sheet, w, h) => {
    guides(sheet, w, h, '#78a59179');
  });
  paper(ctx, 151, 61 + offset, 291, 224, -.065, cream, '#b9a98a', (sheet, w, h) => {
    rectangle(sheet, 0, 0, w, 45, 0, cobalt);
    label(sheet, 'Placement term', 21, 24, '600 17px system-ui, sans-serif', cream);
    label(sheet, '30', 29, 110, '98px Georgia, serif', navy);
    label(sheet, 'days', 153, 132, '42px Georgia, serif', navy);
    for (let day = 0; day < 30; day++) {
      const x = 25 + (day % 15) * 16.2;
      const y = 165 + Math.floor(day / 15) * 18;
      const mark = stage(progress, .12 + day * .021, .27 + day * .021);
      if (mark < 1) rectangle(sheet, x, y, 11, 11, 2, '#b4d9c554');
      if (mark > 0) {
        const inset = (11 - 11 * mark) / 2;
        rectangle(sheet, x + inset, y + inset, 11 * mark, 11 * mark, 2, day === 0 ? cobalt : mint);
      }
    }
    strokePath(sheet, [[26, h - 19], [264, h - 19]], '#b9c1b3', 1.2);
  });
  for (const x of [205, 386]) {
    rectangle(ctx, x, 45 + offset, 18, 32, 7, navy);
    rectangle(ctx, x + 4, 50 + offset, 4, 16, 2, '#7997d6');
  }
  const glint = stage(progress, .82, 1);
  if (glint > 0) spark(ctx, 455, 175 - offset, 13 * glint, '#a0623a');
}

function ticket(ctx, progress, offset) {
  paper(ctx, 93, 105, 386, 148, .19, palePeach, '#ac7458', (sheet, w, h) => {
    guides(sheet, w, h, '#ac6c5059');
  });
  ctx.save();
  ctx.translate(303, 182 + offset);
  ctx.rotate(-.094);
  ctx.translate(-208, -84);
  // The ticket has punched sides cut into the path instead of drawn over it.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(416, 0);
  ctx.lineTo(416, 69);
  ctx.arc(416, 84, 15, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(416, 168);
  ctx.lineTo(0, 168);
  ctx.lineTo(0, 99);
  ctx.arc(0, 84, 15, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fillStyle = cream;
  ctx.fill();
  ctx.strokeStyle = '#b7a88b';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.clip();
  rectangle(ctx, 294, 0, 122, 168, 0, cobalt);
  grain(ctx, 416, 168);
  strokePath(ctx, [[21, 22], [276, 22]], '#928d7c78', 1.3, stage(progress, .07, .48));
  strokePath(ctx, [[21, 146], [276, 146]], '#928d7c78', 1.3, stage(progress, .21, .68));
  label(ctx, 'QOFENO', 30, 47, '600 14px system-ui, sans-serif', navy);
  label(ctx, 'Website placement', 30, 84, '29px Georgia, serif');
  label(ctx, '30 days', 30, 120, '18px Georgia, serif', forest);
  ctx.setLineDash([5, 5]);
  strokePath(ctx, [[294, 8], [294, 160]], cream, 1.3, stage(progress, .24, .79));
  ctx.setLineDash([]);
  circle(ctx, 354, 84, 34, navy, '#87a2dd');
  const stamp = stage(progress, .63, .98);
  if (stamp > 0) spark(ctx, 354, 84, 20 * stamp, gold);
  ctx.restore();
}

const scenes = { submit, review, ranking, expiry, ticket };

export function drawPlacementArt(ctx, viewportWidth, viewportHeight, kind, progress = 1) {
  const draw = scenes[kind];
  if (!draw || viewportWidth <= 0 || viewportHeight <= 0) return;
  const scale = Math.min(viewportWidth / width, viewportHeight / height);
  const position = limit(progress);
  const offset = (1 - stage(position, 0, .78)) * 12;

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.save();
  ctx.translate((viewportWidth - width * scale) / 2, (viewportHeight - height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx, position, offset);
  ctx.restore();
}
