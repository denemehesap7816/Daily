'use strict';
const storageKey = 'daily.tasks.v1';
const $ = selector => document.querySelector(selector);
let tasks = [], undo, toastTimer, audio, storageHealthy = true;
function notify(message, action) {
  clearTimeout(toastTimer); undo = action;
  $('#toast-text').textContent = message;
  $('#undo-button').hidden = !action; $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; undo = null; }, 7000);
}
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(saved) || saved.some(t => !t || typeof t.id !== 'string' || typeof t.title !== 'string' || typeof t.done !== 'boolean')) throw Error('Invalid tasks');
  tasks = saved;
} catch (_) { storageHealthy = false; notify('Kayıtlar okunamadı. Verileri korumak için ekleme kapatıldı.'); $('#add-button').disabled = true; }
function change(action) {
  const previous = JSON.stringify(tasks);
  action();
  try { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
  catch (_) { tasks = JSON.parse(previous); notify('Kaydedilemedi. Değişiklik uygulanmadı.'); return false; }
  render(); return true;
}
function el(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text !== undefined) node.textContent = text; return node;
}
function button(text, label, action) {
  const node = el('button', '', text); node.type = 'button'; node.setAttribute('aria-label', label); node.addEventListener('click', action); return node;
}
function reorder(id, offset) {
  change(() => Daily.reorder(tasks, id, offset));
  const moved = Array.from(document.querySelectorAll('#active-list .task')).find(row => row.dataset.id === id);
  if (moved) moved.querySelector(offset < 0 ? '.up' : '.down').focus();
}
function row(task, index, count) {
  const node = el('article', `task${task.done ? ' done' : ''}`); node.dataset.id = task.id;
  if (!task.done) {
    const order = el('div', 'order');
    const up = button('↑', `${task.title}: yukarı taşı`, () => reorder(task.id, -1)); up.className = 'up'; up.disabled = index === 0;
    const down = button('↓', `${task.title}: aşağı taşı`, () => reorder(task.id, 1)); down.className = 'down'; down.disabled = index === count - 1;
    order.append(up, down); node.append(order);
  }
  const body = el('div', 'task-body'); body.append(el('div', 'task-name', task.title));
  if (task.date) body.append(el('div', 'task-date', new Date(task.date + 'T12:00:00').toLocaleDateString('tr-TR', {day:'numeric',month:'long',year:'numeric'})));
  if (!task.done) {
    const controls = el('div', 'alarm-controls');
    const label = el('label', '', 'Alarm');
    const input = el('input'); input.type = 'datetime-local'; input.value = task.alarmAt || ''; input.setAttribute('aria-label', `${task.title}: alarm zamanı`);
    input.addEventListener('change', () => {
      if (input.value && (!Number.isFinite(new Date(input.value).getTime()) || new Date(input.value).getTime() <= Date.now())) {
        notify('Alarm için gelecekte bir saat seç.'); input.value = task.alarmAt || ''; return;
      }
      change(() => { task.alarmAt = input.value; task.alarmFired = false; task.alarmAcknowledged = false; });
    });
    label.append(input); controls.append(label);
    if (task.alarmAt) {
      controls.append(button('Kaldır', `${task.title}: alarmı kaldır`, () => change(() => { task.alarmAt = ''; task.alarmFired = false; })));
      controls.append(el('span', 'alarm-state', task.alarmFired ? 'Alarm çaldı' : 'Alarm kurulu'));
    }
    body.append(controls);
  }
  const check = button('✓', `${task.title}: ${task.done ? 'yeniden aç' : 'tamamla'}`, () => {
    const done = task.done, id = task.id;
    if (change(() => { task.done = !done; })) {
      notify(done ? 'Görev yapılacaklara taşındı.' : 'Görev yapılanlara taşındı.', () => change(() => { const current = tasks.find(t => t.id === id); if (current) current.done = done; }));
    }
  });
  check.className = 'check-button'; check.setAttribute('aria-pressed', String(task.done)); node.append(body, check); return node;
}
function render() {
  $('#date-label').textContent = new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
  for (const done of [false,true]) {
    const items = tasks.filter(t => t.done === done), host = $(done ? '#done-list' : '#active-list');
    $(done ? '#done-count' : '#active-count').textContent = items.length;
    host.replaceChildren(...items.map((task,index) => row(task,index,items.length)));
    if (!items.length) host.append(el('div','empty', done ? 'Bitirdiğin görevler burada birikecek.' : 'İlk görevini yukarıya yaz. Sırasını oklarla değiştirebilirsin.'));
  }
  renderAlarms();
}
function renderAlarms() {
  const pending = tasks.filter(task => task.alarmAt && task.alarmFired && !task.alarmAcknowledged && !task.done);
  $('#alarm-alert').hidden = pending.length === 0;
  $('#alarm-items').replaceChildren(...pending.map(task => el('p','',task.title)));
}
function sound() {
  if (!audio || audio.state !== 'running') return;
  for (let i=0;i<3;i++) {
    const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .45;
    oscillator.frequency.value = 740; gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(.15,start+.02); gain.gain.exponentialRampToValueAtTime(.001,start+.3);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start+.32);
  }
}
function checkAlarms() {
  // ponytail: page-only alarms; use server-scheduled Web Push for closed-app delivery.
  if (!storageHealthy || document.visibilityState === 'hidden') return;
  const due = tasks.filter(task => Daily.alarmDue(task, Date.now()));
  if (!due.length) return;
  if (!change(() => due.forEach(task => { task.alarmFired = true; task.alarmAcknowledged = false; }))) return;
  sound();
}
function audioStatus() {
  const running = audio && audio.state === 'running';
  $('#enable-sound').textContent = running ? 'Ses açık · Dene' : 'Alarm sesini aç';
  $('#enable-sound').setAttribute('aria-pressed', String(!!running));
  $('#alarm-note').textContent = running
    ? 'Ses açık. Alarm için sayfayı ekranda açık ve cihazın sesini duyulur tut. Safari kapalıyken alarm çalmaz.'
    : 'Ses için “Alarm sesini aç”a dokun. Alarm için sayfayı ekranda açık tut; Safari kapalıyken alarm çalmaz.';
}
$('#enable-sound').addEventListener('click', async () => {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!audio || audio.state === 'closed') {
      audio = new Audio(); audio.addEventListener('statechange', audioStatus);
    }
    // Safari requires creation/resume directly inside a user gesture.
    await audio.resume();
    if (audio.state !== 'running') throw Error('Audio unavailable');
    sound(); audioStatus();
  } catch (_) { notify('Ses açılamadı. Alarmlar sayfada görünmeye devam eder.'); }
});
$('#dismiss-alarm').addEventListener('click', () => change(() => {
  tasks.filter(task => task.alarmFired && !task.done).forEach(task => { task.alarmAcknowledged = true; });
}));
$('#add-form').addEventListener('submit', event => {
  event.preventDefault(); if (!storageHealthy) return;
  const title = $('#task-title').value.trim(); if (!title) { $('#task-title').setCustomValidity('Bir görev yaz.'); $('#task-title').reportValidity(); return; }
  if (change(() => tasks.push({id:Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'),title,date:'',done:false,alarmAt:'',alarmFired:false}))) { $('#task-title').value = ''; $('#task-title').focus(); }
});
$('#task-title').addEventListener('input', () => $('#task-title').setCustomValidity(''));
$('#undo-button').addEventListener('click', () => { const action = undo; undo = null; $('#toast').hidden = true; if (action) action(); });
window.addEventListener('storage', event => { if (event.key === storageKey) location.reload(); });
function foreground() { audioStatus(); checkAlarms(); }
window.addEventListener('focus', foreground);
window.addEventListener('pageshow', foreground);
document.addEventListener('visibilitychange', foreground);
setInterval(checkAlarms, 1000);
render(); foreground();
