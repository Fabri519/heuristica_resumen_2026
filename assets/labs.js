/* Laboratorios interactivos de la guía */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var fmt = function(x, d){ if (d === undefined) d = 3; var s = (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString(); return s.replace('.', ','); };
  var nums = function(s){ return s.replace(/;/g, ' ').split(/[\s,]+/).filter(function(t){ return t !== ''; }).map(function(t){ return parseFloat(t.replace(/,(?=\d)/, '.')); }).filter(function(x){ return !isNaN(x); }); };
  var esc = function(s){ return String(s).replace(/[&<>]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
  var COL = ['#1f5fbf', '#0e8a6a', '#b45309', '#7c3aed', '#be185d', '#0369a1', '#4d7c0f', '#c2410c', '#475569', '#0f766e'];

  /* ---------- Simulated Annealing ---------- */
  if ($('labSA')) {
    var saUpd = function(){
      var T0 = parseFloat($('saT0').value) || 1, mu = parseFloat($('saMu').value) || 0, dF = parseFloat($('saDF').value) || 0, t = parseInt($('saT').value, 10);
      $('saTv').textContent = t;
      var T = T0 * Math.exp(-mu * t), P = dF <= 0 ? 1 : Math.exp(-dF / T);
      $('saOut').innerHTML = 'T = ' + fmt(T0) + '·e<sup>−' + fmt(mu, 4) + '·' + t + '</sup> = <b>' + fmt(T, 4) + '</b> &nbsp;→&nbsp; P = e<sup>−' + fmt(dF) + '/' + fmt(T, 4) + '</sup> = <span class="big">' + fmt(P, 4) + '</span>' +
        '<br><span class="sub">' + (P > 0.5 ? 'Temperatura alta: acepta empeorar con facilidad (explora).' : P > 0.05 ? 'Temperatura intermedia: a veces acepta empeorar.' : 'Temperatura baja: casi nunca acepta empeorar, se comporta como Hill Climbing.') + '</span>';
    };
    ['saT0', 'saMu', 'saDF', 'saT'].forEach(function(id){ $(id).addEventListener('input', saUpd); });
    saUpd();
  }

  /* ---------- Selección ---------- */
  if ($('labSel')) {
    var datos = function(){
      var F = nums($('selF').value), eps = parseFloat($('selE').value); if (isNaN(eps)) eps = 0.1;
      var n = Math.max(1, Math.min(1000, parseInt($('selN').value, 10) || F.length));
      var m = Math.min.apply(null, F), Fa = F.map(function(f){ return f - m + eps; });
      var T = Fa.reduce(function(a, b){ return a + b; }, 0), P = Fa.map(function(x){ return x / T; });
      var C = [], acc = 0; P.forEach(function(p){ acc += p; C.push(acc); }); C[C.length - 1] = 1;
      return { F: F, eps: eps, n: n, m: m, Fa: Fa, T: T, P: P, C: C };
    };
    var buscar = function(C, s){ for (var i = 0; i < C.length; i++) if (s <= C[i]) return i; return C.length - 1; };
    var tablaBase = function(d){
      var h = '<div style="overflow-x:auto"><table><tr><th></th>' + d.F.map(function(_, i){ return '<th class="c">S' + (i + 1) + '</th>'; }).join('') + '</tr>';
      h += '<tr><td>F</td>' + d.F.map(function(x){ return '<td class="c">' + fmt(x) + '</td>'; }).join('') + '</tr>';
      h += '<tr><td>F<sub>a</sub></td>' + d.Fa.map(function(x){ return '<td class="c">' + fmt(x) + '</td>'; }).join('') + '</tr>';
      h += '<tr><td>P</td>' + d.P.map(function(x){ return '<td class="c">' + fmt(x) + '</td>'; }).join('') + '</tr>';
      h += '<tr><td>C</td>' + d.C.map(function(x){ return '<td class="c">' + fmt(x) + '</td>'; }).join('') + '</tr>';
      return h;
    };
    var ruletaHTML = function(d, punteros){
      var h = '<div class="ruleta">';
      d.P.forEach(function(p, i){ h += '<div style="width:' + (p * 100) + '%;background:' + COL[i % COL.length] + '">' + (p > 0.07 ? 'S' + (i + 1) : '') + '</div>'; });
      (punteros || []).slice(0, 40).forEach(function(s, k){ h += '<span class="pt" style="left:' + (s * 100) + '%" data-n="' + (punteros.length <= 12 ? fmt(s, 2) : '') + '"></span>'; });
      return h + '</div>';
    };
    var cuenta = function(d, idx){
      var c = d.F.map(function(){ return 0; }); idx.forEach(function(i){ c[i]++; });
      var h = '<tr><td>Veces</td>' + c.map(function(x){ return '<td class="c"><b>' + x + '</b></td>'; }).join('') + '</tr>';
      h += '<tr><td>n·P esperado</td>' + d.P.map(function(p){ return '<td class="c">' + fmt(p * d.n, 2) + '</td>'; }).join('') + '</tr>';
      h += '<tr><td>Bias</td>' + d.P.map(function(p, i){ return '<td class="c">' + fmt(Math.abs(p - c[i] / d.n), 3) + '</td>'; }).join('') + '</tr>';
      return h + '</table></div>';
    };
    document.querySelectorAll('#labSel [data-sel]').forEach(function(b){
      b.addEventListener('click', function(){
        var d = datos(), out = $('selOut'), modo = b.getAttribute('data-sel');
        if (d.F.length < 2) { out.innerHTML = '<p>Escribí al menos dos valores de fitness.</p>'; return; }
        var idx = [], h = '', s, i;
        if (modo === 'ruleta') {
          var tiros = []; for (i = 0; i < d.n; i++) { s = Math.random(); tiros.push(s); idx.push(buscar(d.C, s)); }
          h = '<p>m = ' + fmt(d.m) + ' · T = ΣF<sub>a</sub> = ' + fmt(d.T) + '</p>' + ruletaHTML(d, tiros);
          h += '<p>Tiros: ' + tiros.slice(0, 30).map(function(t, k){ return fmt(t, 2) + ' → S' + (idx[k] + 1); }).join(' · ') + (tiros.length > 30 ? ' …' : '') + '</p>';
          h += tablaBase(d) + cuenta(d, idx);
        } else if (modo === 'sus') {
          var p = Math.random() / d.n, pts = []; for (i = 0; i < d.n; i++) { pts.push(p + i / d.n); idx.push(buscar(d.C, p + i / d.n)); }
          h = '<p>Un solo número: p = ' + fmt(p, 4) + ' ∈ [0, 1/' + d.n + '] · punteros cada 1/' + d.n + ' = ' + fmt(1 / d.n, 4) + '</p>' + ruletaHTML(d, pts);
          h += tablaBase(d) + cuenta(d, idx) + '<p class="sub">Fijate que cada individuo sale ⌊n·P⌋ o ⌈n·P⌉ veces: spread mínimo.</p>';
        } else if (modo === 'torneo') {
          var k = Math.max(2, Math.min(10, parseInt($('selK').value, 10) || 2)), lineas = [];
          for (i = 0; i < d.n; i++) {
            var cand = []; for (var j = 0; j < k; j++) cand.push(Math.floor(Math.random() * d.F.length));
            var g = cand.reduce(function(a, c){ return d.F[c] > d.F[a] ? c : a; }, cand[0]);
            idx.push(g); lineas.push('{' + cand.map(function(c){ return 'S' + (c + 1); }).join(', ') + '} → S' + (g + 1));
          }
          h = '<p>Torneos de tamaño k = ' + k + ' (gana el de mayor fitness): ' + lineas.slice(0, 20).join(' · ') + (lineas.length > 20 ? ' …' : '') + '</p>';
          h += tablaBase(d) + cuenta(d, idx) + '<p class="sub">Probá subir k: el mejor gana cada vez más torneos (más presión de selección). La fila P es la de la ruleta, como referencia.</p>';
        } else {
          var R = 1000, peor = d.F.map(function(){ return [Infinity, -Infinity]; });
          for (var r = 0; r < R; r++) {
            var c = d.F.map(function(){ return 0; });
            for (i = 0; i < d.n; i++) c[buscar(d.C, Math.random())]++;
            c.forEach(function(x, q){ peor[q][0] = Math.min(peor[q][0], x); peor[q][1] = Math.max(peor[q][1], x); });
          }
          h = '<p>' + R + ' corridas de ' + d.n + ' tiros cada una. Rango observado de veces que salió cada individuo (spread empírico de la ruleta):</p>' + tablaBase(d);
          h += '<tr><td>Spread visto</td>' + peor.map(function(x){ return '<td class="c"><b>[' + x[0] + ', ' + x[1] + ']</b></td>'; }).join('') + '</tr>';
          h += '<tr><td>SUS daría</td>' + d.P.map(function(p){ return '<td class="c">[' + Math.floor(p * d.n) + ', ' + Math.ceil(p * d.n) + ']</td>'; }).join('') + '</tr></table></div>';
        }
        out.innerHTML = h;
      });
    });
  }

  /* ---------- Cruzamientos ---------- */
  if ($('labXO')) {
    var celda = function(v, cl){ return '<span class="g ' + cl + '">' + esc(v) + '</span>'; };
    var fila = function(lb, vals, cls){ return '<div class="crom"><span class="lb">' + lb + '</span><div class="genes">' + vals.map(function(v, i){ return celda(v, cls[i] || ''); }).join('') + '</div></div>'; };
    var mask = function(n){ var m = []; for (var i = 0; i < n; i++) m.push(Math.random() < 0.5 ? 1 : 0); return m; };
    var r2 = function(x){ return Math.round(x * 100) / 100; };
    var esPerm = function(a){ var s = a.slice().sort(function(x, y){ return x - y; }); for (var i = 0; i < s.length; i++) if (s[i] !== i + 1) return false; return true; };
    var completar = function(base, otro){
      var puestos = base.filter(function(x){ return x !== null; });
      var faltan = otro.filter(function(x){ return puestos.indexOf(x) < 0; }), k = 0;
      return base.map(function(x){ return x === null ? faltan[k++] : x; });
    };
    $('xoOp').addEventListener('change', function(){
      var op = this.value, perm = (op === 'pmx' || op === 'ox');
      var a = nums($('xoP1').value), b = nums($('xoP2').value);
      if (perm && !(esPerm(a) && esPerm(b))) { $('xoP1').value = '2 9 7 1 5 3 10 6 4 8'; $('xoP2').value = '4 10 2 6 5 3 9 7 1 8'; }
      if (!perm && esPerm(a) && a.length === 10 && a[0] === 2) { $('xoP1').value = '2.1 9.3 7.4 1.8 5.2 3.3 0.5 6.1 4.8 8.3'; $('xoP2').value = '4.2 1.6 2.7 6.4 5.9 3.1 9.2 7.7 0.3 8.5'; }
      $('xoOut').innerHTML = '';
    });
    $('xoGo').addEventListener('click', function(){
      var op = $('xoOp').value, P1 = nums($('xoP1').value), P2 = nums($('xoP2').value), n = P1.length, out = $('xoOut'), h = '', i;
      if (n < 2 || P2.length !== n) { out.innerHTML = '<p>Los dos padres tienen que tener la misma cantidad de genes (al menos 2).</p>'; return; }
      var A = P1.map(function(){ return 'a'; }), B = P1.map(function(){ return 'b'; });
      var cutCls = function(cls, cuts){ return cls.map(function(c, i){ return cuts.indexOf(i + 1) >= 0 ? c + ' cut' : c; }); };
      if (op === '1p' || op === '2p') {
        var cuts = [];
        if (op === '1p') cuts = [1 + Math.floor(Math.random() * (n - 1))];
        else { var x = 1 + Math.floor(Math.random() * (n - 1)), y; do { y = 1 + Math.floor(Math.random() * (n - 1)); } while (y === x && n > 2); cuts = [Math.min(x, y), Math.max(x, y)]; }
        var de = function(i){ var s = 0; cuts.forEach(function(c){ if (i >= c) s++; }); return s % 2; };
        var C1 = [], C2 = [], c1 = [], c2 = [];
        for (i = 0; i < n; i++) { var t = de(i); C1.push(t ? P2[i] : P1[i]); C2.push(t ? P1[i] : P2[i]); c1.push(t ? 'b' : 'a'); c2.push(t ? 'a' : 'b'); }
        h = '<p>Corte' + (cuts.length > 1 ? 's' : '') + ' después del gen ' + cuts.join(' y del ') + '.</p>' + fila('P1', P1, cutCls(A, cuts)) + fila('P2', P2, cutCls(B, cuts)) + fila('C1', C1, cutCls(c1, cuts)) + fila('C2', C2, cutCls(c2, cuts));
      } else if (op === 'shuf') {
        var idxs = []; for (i = 1; i <= n; i++) idxs.push(i);
        for (i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = idxs[i]; idxs[i] = idxs[j]; idxs[j] = tmp; }
        var perm = idxs; // el gen i va a la posición perm[i]
        var aplicar = function(v){ var r = new Array(n); for (var i = 0; i < n; i++) r[perm[i] - 1] = v[i]; return r; };
        var invertir = function(v){ var r = new Array(n); for (var i = 0; i < n; i++) r[i] = v[perm[i] - 1]; return r; };
        var P1p = aplicar(P1), P2p = aplicar(P2), cut = 1 + Math.floor(Math.random() * (n - 1));
        var C1p = [], C2p = [], o1 = [], o2 = [];
        for (i = 0; i < n; i++) { var tt = i >= cut; C1p.push(tt ? P2p[i] : P1p[i]); C2p.push(tt ? P1p[i] : P2p[i]); o1.push(tt ? 'b' : 'a'); o2.push(tt ? 'a' : 'b'); }
        h = '<p>Permutación: <span class="mono">' + perm.join(' ') + '</span> · corte después del gen ' + cut + '.</p>' + fila("P1'", P1p, cutCls(A, [cut])) + fila("P2'", P2p, cutCls(B, [cut])) + fila("C1'", C1p, cutCls(o1, [cut])) + fila("C2'", C2p, cutCls(o2, [cut]));
        h += '<p>Permutación inversa:</p>' + fila('C1', invertir(C1p), invertir(o1)) + fila('C2', invertir(C2p), invertir(o2));
      } else if (op === 'uni') {
        var m = mask(n), U1 = [], U2 = [], u1 = [], u2 = [];
        for (i = 0; i < n; i++) { U1.push(m[i] ? P1[i] : P2[i]); U2.push(m[i] ? P2[i] : P1[i]); u1.push(m[i] ? 'a' : 'b'); u2.push(m[i] ? 'b' : 'a'); }
        h = fila('P1', P1, A) + fila('P2', P2, B) + fila('Máscara', m, m.map(function(){ return 'm'; })) + fila('C1', U1, u1) + fila('C2', U2, u2) + '<p class="sub">1 → C1 copia de P1 · 0 → C1 copia de P2.</p>';
      } else if (op === 'ari' || op === 'cube') {
        var R = op === 'ari' ? (function(){ var r = Math.random(); return P1.map(function(){ return r; }); })() : P1.map(function(){ return Math.random(); });
        var K1 = P1.map(function(p, i){ return r2(R[i] * (P2[i] - p) + p); }), K2 = P2.map(function(p, i){ return r2(R[i] * (P1[i] - p) + p); });
        h = '<p>' + (op === 'ari' ? 'r = ' + fmt(R[0], 3) + ' (el mismo para todas las coordenadas)' : 'R = (' + R.map(function(r){ return fmt(r, 2); }).join('; ') + ')') + '</p>';
        h += fila('P1', P1, A) + fila('P2', P2, B) + fila('C1', K1, K1.map(function(){ return 'c'; })) + fila('C2', K2, K2.map(function(){ return 'c'; }));
        h += '<p class="sub">Valores nuevos (intermedios): por eso estos operadores son solo para codificación real. Chequeo: C1 + C2 = P1 + P2 en cada coordenada.</p>';
      } else if (op === 'pmx' || op === 'ox') {
        if (!esPerm(P1) || !esPerm(P2)) { out.innerHTML = '<p>Para PMX y Order Based los padres tienen que ser permutaciones de 1 a n (por ejemplo, 2 9 7 1 5 3 10 6 4 8).</p>'; return; }
        var keep;
        var info = '';
        if (op === 'pmx') {
          var a1 = 1 + Math.floor(Math.random() * (n - 2)), b1 = a1 + 1 + Math.floor(Math.random() * (n - 1 - a1));
          keep = P1.map(function(_, i){ return i < a1 || i >= b1 ? 1 : 0; });
          info = 'Cortes después del gen ' + a1 + ' y del ' + b1 + '. Se copian la 1.ª y la 3.ª sección del padre propio.';
          var cutsP = [a1, b1];
        } else { keep = mask(n); info = 'Máscara al azar: donde hay 1 se copia el padre propio.'; }
        var base1 = P1.map(function(v, i){ return keep[i] ? v : null; }), base2 = P2.map(function(v, i){ return keep[i] ? v : null; });
        var H1 = completar(base1, P2), H2 = completar(base2, P1);
        var k1 = keep.map(function(k){ return k ? 'a' : 'b'; }), k2 = keep.map(function(k){ return k ? 'b' : 'a'; });
        var cc = function(cls){ return op === 'pmx' ? cutCls(cls, cutsP) : cls; };
        h = '<p>' + info + ' Los huecos se completan siguiendo el orden del otro padre.</p>' + fila('P1', P1, cc(A)) + fila('P2', P2, cc(B));
        if (op === 'ox') h += fila('Máscara', keep, keep.map(function(){ return 'm'; }));
        h += fila('C1 (paso 1)', base1.map(function(x){ return x === null ? '–' : x; }), cc(keep.map(function(k){ return k ? 'a' : 'e'; })));
        h += fila('C1', H1, cc(k1)) + fila('C2', H2, cc(k2));
      }
      out.innerHTML = '<div class="cromwrap">' + h + '<div class="leyenda"><span class="la">de P1</span><span class="lb2">de P2</span><span class="lc">valor nuevo</span></div></div>';
    });
  }
})();
