const goods = [
  { name: 'Paper', color: '#d4a536', headerInk: '#17211c' },
  { name: 'Cotton', color: '#b8a06a', headerInk: '#17211c' },
  { name: 'Lenses', color: '#d27655', headerInk: '#17211c' },
  { name: 'Bento', color: '#37413c', headerInk: '#f2eddf' },
  { name: 'Bulbs', color: '#a1afc6', headerInk: '#17211c' },
  { name: 'Clocks', color: '#78a66d', headerInk: '#17211c' },
];

const countInputs = [...document.querySelectorAll('input[name="player-count"]')];
const tileTotal = document.querySelector('#tile-total');
const countNote = document.querySelector('#count-note');
const resultsSection = document.querySelector('#results-section');
const setupPage = document.querySelector('#setup-page');
const outputPage = document.querySelector('#output-page');
const pageIndicator = document.querySelector('#page-indicator');
const goodsGrid = document.querySelector('#goods-grid');
const drawSummary = document.querySelector('#draw-summary');
const copyStatus = document.querySelector('#copy-status');
let currentDraw = [];

function showPage(page) {
  const isOutput = page === 'output';
  setupPage.hidden = isOutput;
  outputPage.hidden = !isOutput;
  pageIndicator.innerHTML = isOutput ? 'FACTORY DRAW <span>/</span> 02' : 'FACTORY DRAW <span>/</span> 01';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function randomIndex(max) {
  const range = 0x100000000;
  const limit = range - (range % max);
  const randomValue = new Uint32Array(1);
  do {
    crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= limit);
  return randomValue[0] % max;
}

function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function playerCount() {
  return Number(document.querySelector('input[name="player-count"]:checked').value);
}

function updatePlayerCount() {
  const count = playerCount();
  tileTotal.textContent = `${count * goods.length} TILES`;
  countNote.textContent = `${count} factories per good`;
  localStorage.setItem('zaibatsu-player-count', String(count));
}

function makeDraw() {
  const count = playerCount();
  return goods.map((good) => ({
    ...good,
    factories: shuffle([1, 2, 3, 4]).slice(0, count).map((number) => ({
      number,
      side: randomIndex(2) === 0 ? 'A' : 'B',
    })),
  }));
}

function renderDraw() {
  currentDraw = makeDraw();
  goodsGrid.replaceChildren();

  currentDraw.forEach((good, goodIndex) => {
    const card = document.createElement('article');
    card.className = 'good-card';
    card.style.animationDelay = `${goodIndex * 35}ms`;
    card.style.setProperty('--good-color', good.color);
    card.style.setProperty('--good-ink', good.headerInk);

    const heading = document.createElement('h3');
    heading.className = 'good-heading';
    const name = document.createElement('span');
    name.textContent = good.name;
    heading.append(name);

    const list = document.createElement('div');
    list.className = 'factory-list';
    list.setAttribute('aria-label', `${good.name} factory tiles`);
    good.factories.forEach((factory) => {
      const chip = document.createElement('span');
      chip.className = 'factory-chip';
      chip.setAttribute('aria-label', `Tile ${factory.number}, side ${factory.side}`);
      const number = document.createElement('span');
      number.className = 'tile-number';
      number.textContent = factory.number;
      const side = document.createElement('span');
      side.className = 'side-badge';
      side.textContent = factory.side;
      chip.append(number, side);
      list.append(chip);
    });

    card.append(heading, list);
    goodsGrid.append(card);
  });

  drawSummary.textContent = `${playerCount() * goods.length} FACTORIES · 6 GOODS`;
  copyStatus.textContent = '';
}

countInputs.forEach((input) => input.addEventListener('change', updatePlayerCount));
document.querySelector('#draw-button').addEventListener('click', () => {
  renderDraw();
  history.pushState({ page: 'output' }, '', '#output');
  showPage('output');
});
document.querySelector('#reroll-button').addEventListener('click', renderDraw);
document.querySelector('#back-button').addEventListener('click', () => {
  if (history.state?.page === 'output') history.back();
  else showPage('setup');
});
window.addEventListener('popstate', () => showPage(history.state?.page === 'output' ? 'output' : 'setup'));
document.querySelector('#copy-button').addEventListener('click', async () => {
  const lines = ['Nippon: Zaibatsu factory draw'];
  currentDraw.forEach((good) => {
    lines.push(`${good.name}: ${good.factories.map((factory) => `${factory.number}${factory.side}`).join(', ')}`);
  });
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    copyStatus.textContent = 'Copied';
  } catch {
    copyStatus.textContent = 'Clipboard unavailable';
  }
});

const savedCount = Number(localStorage.getItem('zaibatsu-player-count'));
if ([2, 3, 4].includes(savedCount)) document.querySelector(`#count-${savedCount}`).checked = true;
updatePlayerCount();
history.replaceState({ page: 'setup' }, '', '#setup');
showPage('setup');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}