/* lineage.js — "you're looking at an earlier version" note for frozen copies of the demo.
 * Plain JavaScript on purpose: it is injected into builds that no longer change. Reads this copy's
 * id from <meta name="lineage-self">, the list of stops from ../lineage.json (next to this file), and
 * remembers a confirmation per copy in localStorage. The live copy sets no meta and renders nothing.
 * Pattern: my-template/walkthroughs/VERSION-LINEAGE.md (The Holy Earth Foundation, 2026-10-25). */
;(function () {
  var meta = document.querySelector('meta[name="lineage-self"]')
  var self = meta && meta.getAttribute('content')
  if (!self) return
  var script = document.currentScript
  var root = new URL('.', script ? script.src : document.baseURI) // the lineage/ folder
  var demoRoot = new URL('..', root)
  var key = 'lineage-ack:' + self
  var acked = false
  try { acked = localStorage.getItem(key) === '1' } catch (e) {}

  var css = [
    '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap");',
    '.lineage-dialog{border:1px solid rgba(255,255,255,.15);border-radius:16px;background:#0F1526;color:#DBE4F3;padding:0;max-width:540px;width:calc(100% - 32px);font:14px/1.5 Inter,system-ui,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.55)}',
    '.lineage-dialog::backdrop{background:rgba(3,5,12,.72);backdrop-filter:blur(3px)}',
    '.lineage-body{padding:22px 24px 18px}',
    '.lineage-kicker{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A78BFA;margin:0 0 6px}',
    '.lineage-title{font-size:19px;font-weight:700;margin:0 0 8px;line-height:1.3;background:linear-gradient(90deg,#818CF8,#A78BFA,#F472B6);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
    '.lineage-note{margin:0 0 14px;color:#B3BFD6}',
    '.lineage-how{margin:0 0 14px;padding:10px 12px;border:1px solid rgba(103,232,249,.3);border-radius:10px;background:rgba(103,232,249,.06);color:#B3BFD6;font-size:12.5px;line-height:1.5}',
    '.lineage-how b{color:#DBE4F3}',
    '.lineage-h{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8696AE;margin:14px 0 6px}',
    '.lineage-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}',
    '.lineage-list a{display:block;padding:9px 12px;border:1px solid rgba(129,140,248,.5);border-radius:10px;color:#DBE4F3;text-decoration:none;background:rgba(129,140,248,.12);transition:transform .25s cubic-bezier(.34,1.56,.64,1),border-color .15s}',
    '.lineage-list a:hover{border-color:#A78BFA;transform:translateY(-1px)}',
    '.lineage-list a.lineage-earlier{border-style:dashed;border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.04)}',
    '.lineage-list small{display:block;color:#8696AE;font-size:12px}',
    '.lineage-list .lineage-when{float:right;color:#8696AE;font-size:11px;font-family:"JetBrains Mono",monospace}',
    '.lineage-actions{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap}',
    '.lineage-actions button,.lineage-actions a.lineage-live{flex:1;padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#DBE4F3;font:inherit;font-weight:600;cursor:pointer;text-align:center;text-decoration:none}',
    '.lineage-actions a.lineage-live{background:linear-gradient(90deg,#6366F1,#A78BFA);border-color:transparent;color:#fff}',
    '.lineage-foot{margin:14px 0 0;font-size:12px;color:#8696AE}',
    '.lineage-ribbon{position:fixed;right:12px;bottom:12px;z-index:9998;font:600 12px/1 Inter,system-ui,sans-serif;background:#0F1526;color:#DBE4F3;border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:9px 13px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4)}',
    '.lineage-ribbon:hover{border-color:#A78BFA}'
  ].join('')

  function el(tag, attrs, children) {
    var n = document.createElement(tag)
    for (var k in attrs || {}) { if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]) }
    ;(children || []).forEach(function (c) { n.appendChild(c) })
    return n
  }

  fetch(new URL('lineage.json', root).href, { cache: 'no-store' }).then(function (r) { return r.json() }).then(function (data) {
    var stops = (data && data.stops) || []
    var i = stops.findIndex(function (s) { return s.id === self })
    if (i < 0 || stops[i].kind === 'live') return
    var me = stops[i]
    var newer = stops.slice(i + 1).filter(function (s) { return s.open })
    var older = stops.slice(0, i).filter(function (s) { return s.open }).reverse()
    var live = stops.filter(function (s) { return s.kind === 'live' && s.open })[0]
    var href = function (s) { return new URL(s.url, demoRoot).href }

    var style = el('style', { text: css })
    document.head.appendChild(style)

    var dlg = el('dialog', { class: 'lineage-dialog', 'data-pagefind-ignore': '' })
    var body = el('div', { class: 'lineage-body' })
    body.appendChild(el('p', { class: 'lineage-kicker', text: me.kind === 'rehearsal' ? "You're on a rehearsal stage" : "You're looking at an earlier version" }))
    body.appendChild(el('h2', { class: 'lineage-title', text: me.label + (me.when ? ' · ' + me.when : '') }))
    body.appendChild(el('p', { class: 'lineage-note', text: me.note }))
    var how = el('p', { class: 'lineage-how' })
    how.appendChild(el('b', { text: 'How this works. ' }))
    how.appendChild(document.createTextNode('Every version of this terminal stays online. The live copy is the one being built; earlier copies are frozen as they were and greet you with this note. Step forward to the current terminal, or stay and compare. A new stop is added only when an overhaul lands.'))
    body.appendChild(how)

    function list(items, heading, cls) {
      if (!items.length) return
      body.appendChild(el('p', { class: 'lineage-h', text: heading }))
      var ul = el('ul', { class: 'lineage-list' })
      items.forEach(function (s) {
        var a = el('a', { href: href(s), class: cls }, [el('span', { class: 'lineage-when', text: s.when || '' }), el('strong', { text: s.label }), el('small', { text: s.note })])
        ul.appendChild(el('li', {}, [a]))
      })
      body.appendChild(ul)
    }
    list(newer, 'Newer versions', '')
    list(older, 'Earlier versions · step back in time to see how it grew', 'lineage-earlier')

    var actions = el('div', { class: 'lineage-actions' })
    if (live) actions.appendChild(el('a', { href: href(live), class: 'lineage-live', text: 'Take me to the current terminal' }))
    var stay = el('button', { type: 'button', text: 'I understand, let me look around' })
    actions.appendChild(stay)
    body.appendChild(actions)
    body.appendChild(el('p', { class: 'lineage-foot', text: 'The ribbon in the corner brings this note back, with every version.' }))
    dlg.appendChild(body)
    document.body.appendChild(dlg)

    var ribbon = el('button', { type: 'button', class: 'lineage-ribbon', text: (me.kind === 'rehearsal' ? 'Rehearsal' : 'Earlier version') + ' · not live · all versions' })
    document.body.appendChild(ribbon)

    function open() { if (!dlg.open) dlg.showModal() }
    function ack() { acked = true; try { localStorage.setItem(key, '1') } catch (e) {} dlg.close() }
    stay.addEventListener('click', ack)
    ribbon.addEventListener('click', function () { open() })
    // Chrome lets Escape close a dialog that opened without a click; reopen until the visitor chooses.
    dlg.addEventListener('close', function () { if (!acked) setTimeout(open, 0) })
    if (!acked) setTimeout(open, 0)
    window.dispatchEvent(new CustomEvent('lineage:ready', { detail: { self: self } }))
  }).catch(function () {})
})()
