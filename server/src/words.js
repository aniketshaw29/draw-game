const WORDS = [
  'banana', 'apple', 'grapes', 'pineapple', 'strawberry', 'watermelon', 'orange', 'lemon',
  'cat', 'dog', 'elephant', 'giraffe', 'lion', 'tiger', 'bear', 'rabbit', 'frog', 'snake',
  'fish', 'shark', 'whale', 'penguin', 'owl', 'butterfly', 'spider', 'crab', 'turtle',
  'house', 'castle', 'igloo', 'tent', 'bridge', 'lighthouse', 'skyscraper', 'windmill',
  'car', 'bus', 'train', 'airplane', 'helicopter', 'boat', 'rocket', 'bicycle', 'tractor',
  'tree', 'flower', 'mushroom', 'cactus', 'sun', 'moon', 'star', 'rainbow', 'cloud',
  'snowflake', 'mountain', 'volcano', 'beach', 'desert', 'waterfall', 'island',
  'pizza', 'cake', 'cookie', 'ice cream', 'donut', 'sandwich', 'hamburger', 'fries',
  'egg', 'carrot', 'broccoli', 'corn', 'peanut', 'cherry', 'dragon', 'unicorn', 'robot',
  'alien', 'monster', 'ghost', 'witch', 'wizard', 'pirate', 'ninja', 'king', 'queen',
  'clock', 'key', 'lock', 'book', 'pencil', 'scissors', 'umbrella', 'glasses', 'hat',
  'shoe', 'crown', 'ring', 'balloon', 'gift', 'flag', 'ladder', 'swing', 'slide',
  'camera', 'phone', 'laptop', 'television', 'guitar', 'piano', 'drum', 'violin',
  'soccer ball', 'basketball', 'baseball', 'tennis', 'diamond', 'anchor', 'snowman',
  'campfire', 'honey', 'cheese', 'bread', 'milk', 'coffee', 'pumpkin', 'lemonade',
];

export function pickWord(used = new Set()) {
  const available = WORDS.filter((w) => !used.has(w));
  const pool = available.length ? available : WORDS;
  const word = pool[Math.floor(Math.random() * pool.length)];
  used.add(word);
  return word;
}

export function mask(word) {
  return word
    .split('')
    .map((ch) => (ch === ' ' ? ' ' : '_'))
    .join(' ')
    .replace(/\s{2,}/g, '   ');
}

const normalize = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');

export function checkGuess(word, guess) {
  const a = normalize(word);
  const b = normalize(guess);
  if (!b) return false;
  if (a === b) return true;
  if (Math.abs(a.length - b.length) <= 1 && b.startsWith(a)) return true;
  return false;
}
