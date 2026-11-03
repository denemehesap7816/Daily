(function (root) {
  'use strict';
  function reorder(tasks, id, offset) {
    const active = tasks.filter(task => !task.done);
    const index = active.findIndex(task => task.id === id);
    if (index < 0 || ![-1, 1].includes(offset) || !active[index + offset]) return false;
    const from = tasks.indexOf(active[index]), to = tasks.indexOf(active[index + offset]);
    [tasks[from], tasks[to]] = [tasks[to], tasks[from]];
    return true;
  }
  function alarmDue(task, now) {
    return !task.done && !task.alarmFired && !!task.alarmAt && new Date(task.alarmAt).getTime() <= now;
  }
  const api = { reorder, alarmDue };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Daily = api;
})(typeof window === 'undefined' ? globalThis : window);
