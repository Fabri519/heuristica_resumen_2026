/* Funciones comunes: tema claro/oscuro, índice ocultable, avance, sección activa y buscador */
(function(){
  var LS = {
    get: function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set: function(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
    del: function(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  window.LSH = LS;
  var root = document.documentElement;

  /* ---- tema ---- */
  var t = LS.get('heur-tema');
  if (t) root.setAttribute('data-theme', t);
  else root.setAttribute('data-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', function(){
    var tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', function(){
      var nuevo = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var aplicar = function(){ root.setAttribute('data-theme', nuevo); LS.set('heur-tema', nuevo); };
      if (document.startViewTransition) document.startViewTransition(aplicar); else aplicar();
    });

    /* ---- índice ocultable ---- */
    var movil = function(){ return matchMedia('(max-width:820px)').matches; };
    var nb = document.getElementById('navBtn'), sh = document.getElementById('navShade');
    if (!movil() && LS.get('heur-indice') === 'oculto') document.body.classList.add('nav-oculta');
    if (nb) nb.addEventListener('click', function(){
      if (movil()) document.body.classList.toggle('nav-abierta');
      else { document.body.classList.toggle('nav-oculta'); LS.set('heur-indice', document.body.classList.contains('nav-oculta') ? 'oculto' : 'visible'); }
    });
    if (sh) sh.addEventListener('click', function(){ document.body.classList.remove('nav-abierta'); });
    document.querySelectorAll('nav a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(){ if (movil()) document.body.classList.remove('nav-abierta'); });
    });
    setTimeout(function(){ document.body.classList.add('ready'); }, 60);

    /* ---- avance (solo en la guía) ---- */
    var secciones = Array.prototype.slice.call(document.querySelectorAll('main section[data-tema]'));
    if (secciones.length) {
      var hechos = {};
      try { hechos = JSON.parse(LS.get('heur-avance') || '{}'); } catch(e){}
      var guardar = function(){ LS.set('heur-avance', JSON.stringify(hechos)); };
      var links = {};
      document.querySelectorAll('nav a[href^="#"]').forEach(function(a){
        var id = a.getAttribute('href').slice(1);
        var s = document.getElementById(id);
        if (s && s.matches('section[data-tema]')) {
          links[id] = a;
          var ck = document.createElement('span'); ck.className = 'ck'; ck.textContent = '✓'; ck.title = 'Marcar como aprendido';
          a.insertBefore(ck, a.firstChild);
          ck.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); hechos[id] = !hechos[id]; refrescar(); guardar(); });
        }
      });
      secciones.forEach(function(s){
        var mk = document.createElement('div'); mk.className = 'mk';
        var tema = s.getAttribute('data-tema');
        if (tema && tema !== '-') {
          var a = document.createElement('a'); a.href = 'practica.html?t=' + tema; a.textContent = '🎯 Practicar este tema';
          mk.appendChild(a);
        }
        var b = document.createElement('button'); b.type = 'button';
        b.addEventListener('click', function(){ hechos[s.id] = !hechos[s.id]; refrescar(); guardar(); });
        mk.appendChild(b); s.appendChild(mk); s._mk = b;
      });
      var refrescar = function(){
        var tot = 0, ok = 0;
        secciones.forEach(function(s){
          var h = !!hechos[s.id]; tot++; if (h) ok++;
          if (links[s.id]) links[s.id].classList.toggle('hecho', h);
          s._mk.classList.toggle('on', h);
          s._mk.textContent = h ? '✓ Aprendido' : '○ Marcar como aprendido';
        });
        var pf = document.getElementById('pFill'), pt = document.getElementById('pTxt');
        if (pf) pf.style.width = (tot ? Math.round(100 * ok / tot) : 0) + '%';
        if (pt) pt.textContent = ok + ' de ' + tot + ' temas aprendidos (' + (tot ? Math.round(100 * ok / tot) : 0) + ' %)';
        document.querySelectorAll('nav .mod').forEach(function(m){
          var ls = m.querySelectorAll('a .ck'); if (!ls.length) return;
          var n = 0; ls.forEach(function(c){ if (c.parentNode.classList.contains('hecho')) n++; });
          var mi = m.querySelector('.mi'), mh = m.querySelector('.modh');
          if (mi && ls.length > 1) mi.textContent = n + ' / ' + ls.length + ' aprendidos';
          if (mh) mh.classList.toggle('ok', n === ls.length);
        });
      };
      refrescar();
      var rp = document.getElementById('resetProg');
      if (rp) rp.addEventListener('click', function(){ if (confirm('¿Borrar todo tu avance?')) { hechos = {}; guardar(); refrescar(); } });

      /* sección activa */
      var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav a[href^="#"]'));
      var objetivos = navLinks.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
      var marcar = function(){
        var y = window.scrollY + 120, idx = -1;
        objetivos.forEach(function(o, i){ if (o && o.getBoundingClientRect().top + window.scrollY <= y) idx = i; });
        navLinks.forEach(function(a, i){ a.classList.toggle('activo', i === idx); });
        if (idx >= 0 && !movil()) {
          var a = navLinks[idx], nav = document.getElementById('nav');
          var r = a.getBoundingClientRect();
          if (r.top < 60 || r.bottom > window.innerHeight - 40) nav.scrollTop += r.top - window.innerHeight / 2;
        }
      };
      var tm = null;
      window.addEventListener('scroll', function(){ if (tm) return; tm = setTimeout(function(){ tm = null; marcar(); }, 90); });
      marcar();
    }

    /* ---- buscador ---- */
    var bar = document.getElementById('sbar');
    if (bar) {
      var input = document.getElementById('sq'), cnt = document.getElementById('scount');
      var zona = document.querySelector(bar.getAttribute('data-root') || 'main');
      var excl = bar.getAttribute('data-excluir') || '';
      var marks = [], cur = -1, timer = null;
      var nrm = function(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
      var limpiar = function(){
        marks.forEach(function(m){ var p = m.parentNode; if (!p) return; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
        marks = []; cur = -1;
      };
      var excluido = function(n){
        var el = n.parentElement;
        if (!el || el.closest('script,style,#sbar,.theme-btn,svg,.mk')) return true;
        return excl ? !!el.closest(excl) : false;
      };
      var ir = function(i){
        if (!marks.length) return;
        if (cur >= 0 && marks[cur]) marks[cur].classList.remove('cur');
        cur = (i + marks.length) % marks.length;
        var m = marks[cur]; m.classList.add('cur');
        var d = m.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
        m.scrollIntoView({ block: 'center' });
        cnt.textContent = (cur + 1) + ' de ' + marks.length;
      };
      var buscar = function(q){
        limpiar();
        var nq = nrm(q.trim());
        if (nq.length < 2) { cnt.textContent = ''; bar.classList.remove('has'); return; }
        bar.classList.add('has');
        var w = document.createTreeWalker(zona, NodeFilter.SHOW_TEXT, null), nodos = [], n;
        while ((n = w.nextNode())) { if (n.nodeValue.trim() && !excluido(n)) nodos.push(n); }
        nodos.forEach(function(node){
          if (marks.length >= 500) return;
          var t = node.nodeValue, s = '', map = [];
          for (var i = 0; i < t.length; i++) { var c = nrm(t[i]); for (var j = 0; j < c.length; j++) { s += c[j]; map.push(i); } }
          var rs = [], k = s.indexOf(nq);
          while (k !== -1) { rs.push([map[k], map[k + nq.length - 1] + 1]); k = s.indexOf(nq, k + nq.length); }
          if (!rs.length) return;
          var loc = [];
          for (var r = rs.length - 1; r >= 0; r--) {
            var a = rs[r][0], b = rs[r][1];
            var tail = node.splitText(a); tail.splitText(b - a);
            var m = document.createElement('mark'); m.className = 'sr';
            tail.parentNode.replaceChild(m, tail); m.appendChild(tail); loc.unshift(m);
          }
          marks = marks.concat(loc);
        });
        if (!marks.length) { cnt.textContent = 'Sin resultados'; return; }
        ir(0);
      };
      input.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(function(){ buscar(input.value); }, 220); });
      input.addEventListener('keydown', function(e){
        if (e.key === 'Enter') { e.preventDefault(); if (marks.length) ir(cur + (e.shiftKey ? -1 : 1)); else buscar(input.value); }
        if (e.key === 'Escape') { input.value = ''; limpiar(); cnt.textContent = ''; bar.classList.remove('has'); }
      });
      document.getElementById('sprev').addEventListener('click', function(){ ir(cur - 1); });
      document.getElementById('snext').addEventListener('click', function(){ ir(cur + 1); });
      document.getElementById('sclear').addEventListener('click', function(){ input.value = ''; limpiar(); cnt.textContent = ''; bar.classList.remove('has'); input.focus(); });
      document.addEventListener('keydown', function(e){
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); input.focus(); input.select(); }
      });
    }
  });
})();
