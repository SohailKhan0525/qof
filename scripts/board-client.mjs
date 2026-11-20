// Keep the recovered bundle as a baseline. These guarded edits act only on the
// presentation layer and fail the build if an upstream replacement changes it.
function replaceOnce(source, search, replacement) {
  const index = source.indexOf(search);
  if (index === -1 || source.indexOf(search, index + search.length) !== -1) {
    throw new Error(`Expected one board presentation anchor: ${search.slice(0, 100)}`);
  }
  return source.slice(0, index) + replacement + source.slice(index + search.length);
}

export function boardClient(source, houseModule) {
  const start = source.indexOf('function Lt({board:');
  const end = source.indexOf('function Rt({enabled:', start);
  if (start < 0 || end < 0) throw new Error('Recovered board component not found');
  const originalBoard = source.slice(start, end);
  const gallery = originalBoard.indexOf(',(0,P.jsxs)(`section`,{id:`discover`,');
  if (gallery < 0) throw new Error('Recovered editorial component not found');
  let board = originalBoard.slice(0, gallery) + '}';
  board = replaceOnce(board, 'return(0,P.jsxs)(P.Fragment,{children:[', 'return');
  board = replaceOnce(board, ',[f,p]=(0,_.useState)(``),[m,h]=(0,_.useState)(`all`),[g,v]=(0,_.useState)(!1),{savedIds:y,toggle:b,persistent:x}=ut()', '');
  board = replaceOnce(board, ',C=Qe.filter(e=>(m===`all`||e.category===m)&&(!g||y.includes(`editorial-${e.id}`))&&`${e.title} ${e.description} ${e.host}`.toLowerCase().includes(f.trim().toLowerCase()))', '');
  board = replaceOnce(board, '(0,P.jsxs)(`div`,{className:`rank-board-summary`', 'renderHousePlacement(P),(0,P.jsx)(`h3`,{className:`paid-placements-heading`,children:`Paid placements`}),(0,P.jsxs)(`div`,{className:`rank-board-summary`');
  board = replaceOnce(board, '`01 / Paid placements`', '`Live listings`');
  board = replaceOnce(board, 'children:[`The front `,(0,P.jsx)(`em`,{children:`row.`})]', 'children:`The website board.`');
  board = replaceOnce(board, 'children:[`Every website gets room to be read.`,(0,P.jsx)(`br`,{}),`Active spend sets the order. Every purchase has an expiry.`]', 'children:`Browse active websites. Paid placements are ordered by active spend.`');
  board = replaceOnce(board, '` active placements`', '` active paid placements`');
  board = replaceOnce(board, '(0,P.jsxs)(`figure`,{className:`rank-empty-art`,children:[(0,P.jsx)(Nt,{kind:`ranking`}),(0,P.jsx)(`figcaption`,{children:`Example amounts · not live placements`})]}),', '');
  board = replaceOnce(board, 'children:[`A new board.`,(0,P.jsx)(`br`,{}),`An honest beginning.`]', 'children:`Be first on the paid board.`');
  board = replaceOnce(board, 'We’re starting with zero advertisers. A placement buys a listing for 30 days, not a promise of visitors. Explore the picks below before deciding.', 'A placement runs for 30 days after approval. Every listing gets a description, a dedicated page and a link to your site.');
  board = replaceOnce(board, ',(0,P.jsxs)(`a`,{className:`text-link`,href:`#discover`,children:[`Browse editorial picks `,(0,P.jsx)(me,{size:17})]})', '');

  let client = source.slice(0, start) + board + source.slice(end);
  const edits = [
    ['(0,P.jsx)(bn,{enabled:i,onBuy:e}),', ''],
    ['{id:`discover`,title:`Editorial discoveries`,description:`A few good finds, chosen independently.`},', ''],
    ['(0,P.jsx)(`a`,{href:`/#discover`,children:`Editorial discoveries`}),', ''],
    ['[`Are the editorial discoveries paid placements?`,`No. Editorial discoveries are selected separately to give visitors interesting websites to explore. They are labeled and kept outside the paid ranking. Buying a placement does not buy editorial selection or an endorsement.`],', ''],
    ['Independent websites. A paid front row.', 'Independent websites. One shared board.'],
    ['children:[`Independent websites.`,(0,P.jsx)(`br`,{}),`One shared place to be discovered.`]', 'children:`Browse the board or add your own website. Paid placements run for 30 days after approval.`'],
    ['Discover independent websites through editorial picks and a readable paid ranking.', 'Browse active websites and list your own on Qofeno.'],
    ['Explore the Qofeno paid board and editorial discoveries or contact support@loopproof.me.', 'Explore the Qofeno website board or contact support@loopproof.me.'],
    ['Editorial discoveries are selected separately from paid placements; payment does not buy editorial selection.', 'The Qofeno owner placement is labeled and excluded from paid ranking.'],
    ['Editorial discoveries are separate from paid advertisements and do not imply a partnership with the featured website.', 'Qofeno’s own placement is labeled and excluded from paid ranking.'],
    ['Saved placements and editorial discoveries are stored as IDs', 'Any previously saved placements are stored as IDs'],
  ];
  for (const [search, replacement] of edits) client = replaceOnce(client, search, replacement);
  return `import { housePlacementElement as renderHousePlacement } from './${houseModule}';\n${client}`;
}
