// Lines of R on a slide, for students to run: shown with R's prompt, and copied without it.

import { h, toast } from './ui.js';

/** A block of R code. With copy: true, a button copies the lines (phones and laptops). */
export function codeBlock(lines, { copy = false } = {}) {
  const pre = h('pre', { class: 'r-code' }, h('code', null, lines.map((l, i) => [
    h('span', { class: 'prompt', 'aria-hidden': 'true' }, '> '), l, i < lines.length - 1 ? '\n' : '',
  ]).flat()));
  if (!copy) return pre;
  const btn = h('button', {
    type: 'button', class: 'btn btn-copy',
    onclick: async () => {
      try { await navigator.clipboard.writeText(lines.join('\n')); toast('Copied. Paste it into R.'); }
      catch { toast('Select the code and copy it.'); }
    },
  }, 'Copy the code');
  return h('div', { class: 'code-box' }, pre, btn);
}
