let selectedWeapon = '🍳';
let selectedWeaponName = 'Frying Pan';
let targetSrc = null;
let targetEmoji = '😈';
let useImage = false;

let score = 0;
let health = 100;
let timeLeft = 60;
let gameRunning = false;
let timerInterval = null;
let combo = 0;
let comboTimeout = null;

// Target movement
let tx = 200, ty = 200;
let vx = 3, vy = 2;
let moveMode = 'bounce';
let moveModeTimer = null;
let animFrame = null;

// Mouse tracking
let mx = 0, my = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  const cursor = document.getElementById('cursor');
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

document.body.style.cursor = 'none';

function showWeaponSelect() {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('upload-screen').style.display = 'none';  // ADD THIS
  document.getElementById('weapon-screen').style.display = 'block';
}

let isBomb = false;

function selectWeapon(emoji, name) {
  selectedWeapon = emoji;
  selectedWeaponName = name;
  isBomb = (emoji === '💣');
  document.getElementById('cursor').textContent = emoji;
  document.getElementById('weapon-display').textContent = emoji; // ADD THIS
  document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
  const map = {'🍳':'w1','🩴':'w2','🤚':'w3','💣':'w4'};
  document.getElementById(map[emoji]).classList.add('selected');
}

function showUploadScreen() {
  document.getElementById('weapon-screen').style.display = 'none';
  document.getElementById('upload-screen').style.display = 'block';
}

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    targetSrc = ev.target.result;
    useImage = true;
    document.querySelectorAll('.default-target').forEach(d => d.classList.remove('selected'));
    const uploadArea = document.querySelector('.upload-area');
    uploadArea.innerHTML = `<img src="${targetSrc}" style="width:80px;height:80px;object-fit:cover;border:3px solid var(--pink);image-rendering:pixelated;"><div style="font-size:8px;margin-top:6px;color:var(--green);">✓ PHOTO LOADED!</div>`;
  };
  reader.readAsDataURL(file);
}

function selectDefault(emoji) {
  targetEmoji = emoji;
  useImage = false;
  document.querySelectorAll('.default-target').forEach(d => d.classList.remove('selected'));
  const map = {'😈':'d1','🤡':'d2','👦':'d3','🐸':'d4','💀':'d5'};
  document.getElementById(map[emoji]).classList.add('selected');
}

function startGame() {
  document.getElementById('upload-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  // Setup target appearance
  const imgEl = document.getElementById('target-img');
  const emojiEl = document.getElementById('target-emoji-display');

  if (useImage && targetSrc) {
    imgEl.src = targetSrc;
    imgEl.style.display = 'block';
    emojiEl.style.display = 'none';
  } else {
    emojiEl.textContent = targetEmoji;
    emojiEl.style.display = 'flex';
    imgEl.style.display = 'none';
  }

  // Reset state
  score = 0; health = 1000; timeLeft = 60; combo = 0;

  document.getElementById('bomb-display').style.display = 'none';

  updateHUD();
  gameRunning = true;

  // Start target at center
  tx = window.innerWidth / 2 - 44;
  ty = window.innerHeight / 2 - 44;
  vx = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2);
  vy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);

  // Click to hit
  document.getElementById('game-screen').addEventListener('click', handleClick);
  document.getElementById('game-screen').addEventListener('touchstart', handleTouch); // ADD THIS

  // Timer
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer-display').textContent = '⏱ ' + timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);

  // Movement mode switcher
  switchMoveMode();

  // Animation loop
  gameLoop();
}

function switchMoveMode() {
  const modes = ['bounce', 'flee', 'zigzag'];
  moveMode = modes[Math.floor(Math.random() * modes.length)];
  moveModeTimer = setTimeout(switchMoveMode, 3000 + Math.random() * 3000);
}

function gameLoop() {
  if (!gameRunning) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const SIZE = 88; // target size + border
  const HUD = 50;

  if (moveMode === 'bounce') {
    tx += vx;
    ty += vy;
    if (tx < 0) { tx = 0; vx = Math.abs(vx); }
    if (tx > W - SIZE) { tx = W - SIZE; vx = -Math.abs(vx); }
    if (ty < HUD) { ty = HUD; vy = Math.abs(vy); }
    if (ty > H - SIZE) { ty = H - SIZE; vy = -Math.abs(vy); }
  } else if (moveMode === 'flee') {
    const dx = tx - mx;
    const dy = ty - my;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 200) {
      const speed = 5;
      tx += (dx / dist) * speed;
      ty += (dy / dist) * speed;
    } else {
      tx += vx * 0.5;
      ty += vy * 0.5;
    }
    if (tx < 0) tx = 0;
    if (tx > W - SIZE) tx = W - SIZE;
    if (ty < HUD) ty = HUD;
    if (ty > H - SIZE) ty = H - SIZE;
  } else if (moveMode === 'zigzag') {
    const t = Date.now() / 400;
    tx += vx;
    ty = (H / 2) + Math.sin(t) * (H / 3 - SIZE);
    if (tx < 0) { tx = 0; vx = Math.abs(vx); }
    if (tx > W - SIZE) { tx = W - SIZE; vx = -Math.abs(vx); }
    ty = Math.max(HUD, Math.min(H - SIZE, ty));
  }

  document.getElementById('target').style.left = tx + 'px';
  document.getElementById('target').style.top = ty + 'px';

  animFrame = requestAnimationFrame(gameLoop);
}

function handleClick(e) {
  if (!gameRunning) return;

  const cursor = document.getElementById('cursor');
  cursor.classList.add('hitting');
  setTimeout(() => cursor.classList.remove('hitting'), 150);

  if (isBomb) {
    throwBomb(e.clientX, e.clientY);
    return;
  }

  if (selectedWeapon === '🤚') {
    doSlap(e.clientX, e.clientY);
    return;
  }

  if (selectedWeapon === '🍳') {
    doPan(e.clientX, e.clientY);
    return;
  }
  if (selectedWeapon === '🩴') {
    doSlipper(e.clientX, e.clientY);
    return;
  }

  const SIZE = 88;
  const hitX = e.clientX >= tx && e.clientX <= tx + SIZE;
  const hitY = e.clientY >= ty && e.clientY <= ty + SIZE;

  if (hitX && hitY) {
    combo++;
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => { combo = 0; updateCombo(); }, 1500);

    const dmg = combo >= 5 ? 20 : combo >= 3 ? 15 : 10;
    health = Math.max(0, health - dmg);
    score += combo >= 5 ? 50 : combo >= 3 ? 20 : 10;

    updateHUD();
    updateCombo();

    if (combo >= 5) showBubble(['😭', '😢', '🥺', '😩'][Math.floor(Math.random() * 4)]);
    else if (combo >= 3) showBubble(['😰', '😬', '😟', '🥴'][Math.floor(Math.random() * 4)]);

    spawnHitEffect(e.clientX, e.clientY);
    flashTarget();

    if (health <= 0) {
      score += 500;
      endGame(true);
    }
  } else {
    combo = 0;
    updateCombo();
    spawnMiss(e.clientX, e.clientY);
    showBubble(['😝', '🤪', '👅', '😜'][Math.floor(Math.random() * 4)]);
  }
}

function spawnHitEffect(x, y) {
  const hits = combo >= 5 ? ['💥','⭐','💫'] : combo >= 3 ? ['👊','💥'] : ['💥'];
  const texts = combo >= 5 ? ['SUPER HIT!','x'+combo+' COMBO!'] : combo >= 3 ? ['COMBO x'+combo] : ['+10'];

  hits.forEach((h, i) => {
    const el = document.createElement('div');
    el.className = 'star-effect';
    el.textContent = h;
    el.style.left = (x + (Math.random()-0.5)*60) + 'px';
    el.style.top = (y + (Math.random()-0.5)*60) + 'px';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 600);
  });

  texts.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'hit-effect';
    el.textContent = t;
    el.style.left = (x - 30) + 'px';
    el.style.top = (y - 20 - i*30) + 'px';
    el.style.color = combo >= 5 ? '#ffe600' : combo >= 3 ? '#ff6b9d' : '#fff';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 700);
  });
}

function spawnMiss(x, y) {
  const el = document.createElement('div');
  el.className = 'miss-text';
  el.textContent = 'MISS!';
  el.style.left = (x - 20) + 'px';
  el.style.top = (y - 10) + 'px';
  document.getElementById('game-screen').appendChild(el);
  setTimeout(() => el.remove(), 500);
}

function flashTarget() {
  const t = document.getElementById('target');
  t.style.filter = 'brightness(3) saturate(0)';
  setTimeout(() => t.style.filter = '', 100);

  const flash = document.getElementById('damage-flash');
  flash.style.opacity = '1';
  setTimeout(() => flash.style.opacity = '0', 100);
}

function updateHUD() {
  document.getElementById('score-display').textContent = '⭐ ' + score;
  document.getElementById('health-bar').style.width = (health / 1000 * 100) + '%';
  const hb = document.getElementById('health-bar');
  if (health > 600) hb.style.background = 'linear-gradient(90deg, #ff3333, #ff6633)';
  else if (health > 300) hb.style.background = 'linear-gradient(90deg, #ff9900, #ffcc00)';
  else hb.style.background = 'linear-gradient(90deg, #00cc66, #33ff99)';
}

function updateCombo() {
  const el = document.getElementById('combo-text');
  if (combo >= 3) {
    el.textContent = '🔥 COMBO x' + combo + '!';
    el.style.color = combo >= 5 ? '#ffe600' : '#ff6b9d';
    el.style.fontSize = combo >= 5 ? '16px' : '12px';
  } else {
    el.textContent = '';
  }
}

function endGame(ko = false) {
  gameRunning = false;
  cancelAnimationFrame(animFrame);
  clearInterval(timerInterval);
  clearTimeout(moveModeTimer);
  document.getElementById('game-screen').removeEventListener('click', handleClick);
  document.getElementById('game-screen').removeEventListener('touchstart', handleTouch); // ADD THIS

  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'block';

  let grade, msg, emoji;
  if (ko) {
    grade = 'KO! 💀'; msg = 'You knocked him out! +500 BONUS!\nTherapy complete! 🏆';
    document.getElementById('gameover-title').textContent = '💀 K.O.!! 💀';
  } else if (score >= 500) {
    grade = 'S'; emoji = '⭐⭐⭐'; msg = 'ULTIMATE RAGE RELEASE!\nYou are a PRO. 💪';
  } else if (score >= 300) {
    grade = 'A'; emoji = '⭐⭐'; msg = 'EXCELLENT SMASHING!\nFeel better now? 🌸';
  } else if (score >= 150) {
    grade = 'B'; emoji = '⭐'; msg = 'GOOD EFFORT!\nKeep practicing! 😤';
  } else {
    grade = 'C'; emoji = '💔'; msg = 'HE GOT AWAY...\nTry again! 😤';
  }

  document.getElementById('grade-display').textContent = ko ? '💀' : emoji;
  document.getElementById('final-score-display').textContent = 'SCORE: ' + score;
  document.getElementById('grade-msg').textContent = msg;
  if (!ko) document.getElementById('gameover-title').textContent = "TIME'S UP! 💢";

  clearTimeout(bubbleTimeout);
  document.getElementById('bubble').style.display = 'none';
}

function restartGame() {
  document.getElementById('pause-menu').style.display = 'none'; // ADD THIS
  document.getElementById('gameover-screen').style.display = 'none';
  startGame();
}

function showTitle() {
  document.getElementById('pause-menu').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('weapon-screen').style.display = 'none';  // ADD THIS
  document.getElementById('upload-screen').style.display = 'none';  // ADD THIS
  document.getElementById('title-screen').style.display = 'block';
}

// Default weapon selected
selectWeapon('🍳', 'Frying Pan');
selectDefault('😈');

function togglePause() {
  if (!gameRunning && document.getElementById('pause-menu').style.display === 'none') return;
  
  if (document.getElementById('pause-menu').style.display === 'none') {
    // PAUSE
    gameRunning = false;
    cancelAnimationFrame(animFrame);
    clearInterval(timerInterval);
    document.getElementById('pause-menu').style.display = 'flex';
  } else {
    resumeGame();
  }
}

function resumeGame() {
  document.getElementById('pause-menu').style.display = 'none';
  gameRunning = true;

  // Restart timer
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer-display').textContent = '⏱ ' + timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);

  gameLoop();
}

function handleTouch(e) {
  if (e.target.closest('#burger-btn') || e.target.closest('#pause-menu')) return;
  e.preventDefault();
  const touch = e.touches[0];
  handleClick({ clientX: touch.clientX, clientY: touch.clientY });
}

let bubbleTimeout = null;

function showBubble(emoji) {
  const bubble = document.getElementById('bubble');
  const text = document.getElementById('bubble-text');
  text.textContent = emoji;
  bubble.style.display = 'block';
  clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    bubble.style.display = 'none';
  }, 1500);
}

function throwBomb(clickX, clickY) {
  const startX = clickX;
  const startY = window.innerHeight - 50;

  const bomb = document.createElement('div');
  bomb.className = 'bomb-projectile';
  bomb.textContent = '💣';
  bomb.style.left = startX + 'px';
  bomb.style.top = startY + 'px';
  document.getElementById('game-screen').appendChild(bomb);

  const duration = 600;
  const startTime = Date.now();

  function animateBomb() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      bomb.remove();
      triggerExplosion(clickX, clickY);
      return;
    }

    const curX = startX + (clickX - startX) * progress;
    const arc = -Math.sin(Math.PI * progress) * 150;
    const curY = startY + (clickY - startY) * progress + arc;

    bomb.style.left = curX + 'px';
    bomb.style.top = curY + 'px';
    bomb.style.transform = `rotate(${progress * 360}deg)`;

    requestAnimationFrame(animateBomb);
  }

  animateBomb();
}

function triggerExplosion(x, y) {
  // Visual explosion
  const exp = document.createElement('div');
  exp.className = 'explosion';
  exp.style.left = x + 'px';
  exp.style.top = y + 'px';
  document.getElementById('game-screen').appendChild(exp);
  setTimeout(() => exp.remove(), 700);

  // Spawn hit effects
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'star-effect';
    el.textContent = ['💥','⭐','🔥','💫'][Math.floor(Math.random()*4)];
    el.style.left = (x + (Math.random()-0.5)*150) + 'px';
    el.style.top = (y + (Math.random()-0.5)*150) + 'px';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  // Check if target is within AOE (125px radius)
  const centerX = tx + 44;
  const centerY = ty + 44;
  const dist = Math.sqrt((centerX - x)**2 + (centerY - y)**2);

  if (dist <= 125) {
    health = Math.max(0, health - 50);
    score += 100;
    combo += 2;
    updateHUD();
    updateCombo();
    flashTarget();
    showBubble(['😱', '💀', '😵', '🤯'][Math.floor(Math.random() * 4)]);

    if (health <= 0) {
      score += 500;
      endGame(true);
    }
  }
}

function shootBullet(clickX, clickY) {
  const bullet = document.createElement('div');
  bullet.className = 'bullet-projectile';
  bullet.textContent = '·';
  bullet.style.left = clickX + 'px';
  bullet.style.top = clickY + 'px';
  document.getElementById('game-screen').appendChild(bullet);

  // Direction from cursor toward click (they're the same, so shoot from top)
  const startX = mx;
  const startY = my;
  const angle = -Math.PI / 2; // always shoots straight up
  const speed = 25;
  const vbx = Math.cos(angle) * speed;
  const vby = Math.sin(angle) * speed;

  let bx = clickX;  // start at click X
  let by = clickY;
  bullet.style.left = bx + 'px';
  bullet.style.top = by + 'px';

  // Trail elements
  const trails = [];

  function animateBullet() {
    bx += vbx;
    by += vby;
    bullet.style.left = bx + 'px';
    bullet.style.top = by + 'px';
    bullet.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;

    // Spawn trail
    const trail = document.createElement('div');
    trail.className = 'bullet-trail';
    trail.style.left = bx + 'px';
    trail.style.top = by + 'px';
    document.getElementById('game-screen').appendChild(trail);
    trails.push(trail);
    setTimeout(() => trail.remove(), 200);

    // Check hit
    const SIZE = 88;
    if (bx >= tx && bx <= tx + SIZE && by >= ty && by <= ty + SIZE) {
      bullet.remove();
      triggerBulletHit(bx, by);
      return;
    }

    // Out of bounds
    if (bx < 0 || bx > window.innerWidth || by < 0 || by > window.innerHeight) {
      bullet.remove();
      return;
    }

    requestAnimationFrame(animateBullet);
  }

  animateBullet();
}

function triggerBulletHit(x, y) {
  combo++;
  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => { combo = 0; updateCombo(); }, 1500);

  const dmg = combo >= 5 ? 20 : combo >= 3 ? 15 : 10;
  health = Math.max(0, health - dmg);
  score += combo >= 5 ? 50 : combo >= 3 ? 20 : 10;

  updateHUD();
  updateCombo();
  spawnHitEffect(x, y);
  flashTarget();
  showBubble(['😭', '😢', '🥺', '😩'][Math.floor(Math.random() * 4)]);

  if (health <= 0) { score += 500; endGame(true); }
}

function doSlap(clickX, clickY) {
  const SIZE = 88;
  const hitX = clickX >= tx && clickX <= tx + SIZE;
  const hitY = clickY >= ty && clickY <= ty + SIZE;

  // Animate a big hand swooping across
  const hand = document.createElement('div');
  hand.style.cssText = `
    position: absolute;
    font-size: 64px;
    pointer-events: none;
    z-index: 30;
    left: ${clickX - 80}px;
    top: ${clickY - 40}px;
    transform: scaleX(-1) rotate(-30deg);
    transition: transform 0.15s ease-out, left 0.15s ease-out;
  `;
  hand.textContent = '🤚';
  document.getElementById('game-screen').appendChild(hand);

  setTimeout(() => {
    hand.style.transform = 'scaleX(-1) rotate(20deg)';
    hand.style.left = (clickX - 20) + 'px';
  }, 10);

  setTimeout(() => hand.remove(), 300);

  if (hitX && hitY) {
    combo++;
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => { combo = 0; updateCombo(); }, 1500);

    const dmg = combo >= 5 ? 20 : combo >= 3 ? 15 : 10;
    health = Math.max(0, health - dmg);
    score += combo >= 5 ? 50 : combo >= 3 ? 20 : 10;

    updateHUD();
    updateCombo();

    if (combo >= 5) showBubble(['😭', '😢', '🥺', '😩'][Math.floor(Math.random() * 4)]);
    else if (combo >= 3) showBubble(['😰', '😬', '😟', '🥴'][Math.floor(Math.random() * 4)]);

    spawnSlapEffect(clickX, clickY);
    flashTarget();

    if (health <= 0) { score += 500; endGame(true); }
  } else {
    combo = 0;
    updateCombo();
    spawnMiss(clickX, clickY);
    showBubble(['😝', '🤪', '👅', '😜'][Math.floor(Math.random() * 4)]);
  }
}

function spawnSlapEffect(x, y) {
  const texts = combo >= 5 ? ['👋 SLAP!!', 'x'+combo+' COMBO!'] : combo >= 3 ? ['👋 SLAP! x'+combo] : ['👋 SLAP!'];
  const stars = ['✨','💥','⭐','😵'];

  stars.forEach(() => {
    const el = document.createElement('div');
    el.className = 'star-effect';
    el.textContent = stars[Math.floor(Math.random() * stars.length)];
    el.style.left = (x + (Math.random()-0.5)*80) + 'px';
    el.style.top = (y + (Math.random()-0.5)*80) + 'px';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 600);
  });

  texts.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'hit-effect';
    el.textContent = t;
    el.style.left = (x - 40) + 'px';
    el.style.top = (y - 20 - i*30) + 'px';
    el.style.color = combo >= 5 ? '#ffe600' : combo >= 3 ? '#ff6b9d' : '#fff';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 700);
  });
}
function doPan(clickX, clickY) {
  const pan = document.createElement('div');
  pan.style.cssText = `
    position: absolute;
    font-size: 64px;
    pointer-events: none;
    z-index: 30;
    left: ${clickX - 80}px;
    top: ${clickY - 80}px;
    transform: rotate(-120deg);
    transition: transform 0.15s ease-out, left 0.15s ease-out, top 0.15s ease-out;
  `;
  pan.textContent = '🍳';
  document.getElementById('game-screen').appendChild(pan);

  setTimeout(() => {
    pan.style.transform = 'rotate(10deg)';
    pan.style.left = (clickX - 20) + 'px';
    pan.style.top = (clickY - 20) + 'px';
  }, 10);

  setTimeout(() => pan.remove(), 300);
  checkPanHit(clickX, clickY);
}

function checkPanHit(clickX, clickY) {
  const SIZE = 88;
  const hitX = clickX >= tx && clickX <= tx + SIZE;
  const hitY = clickY >= ty && clickY <= ty + SIZE;

  if (hitX && hitY) {
    combo++;
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => { combo = 0; updateCombo(); }, 1500);
    const dmg = combo >= 5 ? 20 : combo >= 3 ? 15 : 10;
    health = Math.max(0, health - dmg);
    score += combo >= 5 ? 50 : combo >= 3 ? 20 : 10;
    updateHUD(); updateCombo();
    if (combo >= 5) showBubble(['😭','😢','🥺','😩'][Math.floor(Math.random()*4)]);
    else if (combo >= 3) showBubble(['😰','😬','😟','🥴'][Math.floor(Math.random()*4)]);
    spawnWeaponEffect(clickX, clickY, '🍳', 'BONK!');
    flashTarget();
    if (health <= 0) { score += 500; endGame(true); }
  } else {
    combo = 0; updateCombo();
    spawnMiss(clickX, clickY);
    showBubble(['😝','🤪','👅','😜'][Math.floor(Math.random()*4)]);
  }
}

function doSlipper(clickX, clickY) {
  const slipper = document.createElement('div');
  slipper.style.cssText = `
    position: absolute;
    font-size: 64px;
    pointer-events: none;
    z-index: 30;
    left: ${clickX - 80}px;
    top: ${clickY - 80}px;
    transform: rotate(-120deg);
    transition: transform 0.15s ease-out, left 0.15s ease-out, top 0.15s ease-out;
  `;
  slipper.textContent = '🩴';
  document.getElementById('game-screen').appendChild(slipper);

  setTimeout(() => {
    slipper.style.transform = 'rotate(10deg)';
    slipper.style.left = (clickX - 20) + 'px';
    slipper.style.top = (clickY - 20) + 'px';
  }, 10);

  setTimeout(() => slipper.remove(), 300);
  checkSlipperHit(clickX, clickY);
}

function checkSlipperHit(clickX, clickY) {
  const SIZE = 88;
  const hitX = clickX >= tx && clickX <= tx + SIZE;
  const hitY = clickY >= ty && clickY <= ty + SIZE;

  if (hitX && hitY) {
    combo++;
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => { combo = 0; updateCombo(); }, 1500);
    const dmg = combo >= 5 ? 20 : combo >= 3 ? 15 : 10;
    health = Math.max(0, health - dmg);
    score += combo >= 5 ? 50 : combo >= 3 ? 20 : 10;
    updateHUD(); updateCombo();
    if (combo >= 5) showBubble(['😭','😢','🥺','😩'][Math.floor(Math.random()*4)]);
    else if (combo >= 3) showBubble(['😰','😬','😟','🥴'][Math.floor(Math.random()*4)]);
    spawnWeaponEffect(clickX, clickY, '🩴', 'WHACK!');
    flashTarget();
    if (health <= 0) { score += 500; endGame(true); }
  } else {
    combo = 0; updateCombo();
    spawnMiss(clickX, clickY);
    showBubble(['😝','🤪','👅','😜'][Math.floor(Math.random()*4)]);
  }
}

function spawnWeaponEffect(x, y, weaponEmoji, word) {
  const texts = combo >= 5 ? [weaponEmoji+' '+word+'!', 'x'+combo+' COMBO!'] : combo >= 3 ? [weaponEmoji+' '+word+' x'+combo] : [weaponEmoji+' '+word];
  const stars = ['✨','💥','⭐','💫'];

  stars.forEach(() => {
    const el = document.createElement('div');
    el.className = 'star-effect';
    el.textContent = stars[Math.floor(Math.random()*stars.length)];
    el.style.left = (x + (Math.random()-0.5)*80) + 'px';
    el.style.top = (y + (Math.random()-0.5)*80) + 'px';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 600);
  });

  texts.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'hit-effect';
    el.textContent = t;
    el.style.left = (x - 40) + 'px';
    el.style.top = (y - 20 - i*30) + 'px';
    el.style.color = combo >= 5 ? '#ffe600' : combo >= 3 ? '#ff6b9d' : '#fff';
    document.getElementById('game-screen').appendChild(el);
    setTimeout(() => el.remove(), 700);
  });
}

let pendingWeapon = null;
let pendingWeaponName = null;

function showInGameWeaponSelect() {
  document.getElementById('pause-menu').style.display = 'none';
  const panel = document.getElementById('ingame-weapon-select');
  panel.style.display = 'flex';

  // Highlight current weapon
  const map = {'🍳':'iw1','🩴':'iw2','🤚':'iw3','💣':'iw4'};
  document.querySelectorAll('#ingame-weapon-select .weapon-card').forEach(c => c.classList.remove('selected'));
  if (map[selectedWeapon]) document.getElementById(map[selectedWeapon]).classList.add('selected');

  pendingWeapon = selectedWeapon;
  pendingWeaponName = selectedWeaponName;
}

function selectInGameWeapon(emoji, name) {
  pendingWeapon = emoji;
  pendingWeaponName = name;
  const map = {'🍳':'iw1','🩴':'iw2','🤚':'iw3','💣':'iw4'};
  document.querySelectorAll('#ingame-weapon-select .weapon-card').forEach(c => c.classList.remove('selected'));
  if (map[emoji]) document.getElementById(map[emoji]).classList.add('selected');
}

function cancelInGameWeapon() {
  document.getElementById('ingame-weapon-select').style.display = 'none';
  document.getElementById('pause-menu').style.display = 'flex';
  pendingWeapon = null;
  pendingWeaponName = null;
}

function confirmInGameWeapon() {
  if (pendingWeapon) {
    selectWeapon(pendingWeapon, pendingWeaponName);
  }
  document.getElementById('ingame-weapon-select').style.display = 'none';
  // End current game state cleanly then restart
  gameRunning = false;
  cancelAnimationFrame(animFrame);
  clearInterval(timerInterval);
  clearTimeout(moveModeTimer);
  document.getElementById('game-screen').removeEventListener('click', handleClick);
  document.getElementById('game-screen').removeEventListener('touchstart', handleTouch);
  startGame();
}