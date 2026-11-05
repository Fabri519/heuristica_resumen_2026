"""Arma index.html a partir de plantilla.html: reemplaza los marcadores de cromosomas y de gráficos."""
import math, re, sys, pathlib

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent

def crom(lb, vals, clases):
    v = vals.split()
    c = clases.split() if clases.strip() else ['' for _ in v]
    if len(c) == 1 and len(v) > 1:
        c = c * len(v)
    assert len(c) == len(v), (lb, vals, clases)
    celdas = ''.join('<span class="g %s">%s</span>' % (k.replace('.', ' ').replace('_', ''), x) for x, k in zip(v, c))
    return '<div class="crom"><span class="lb">%s</span><div class="genes">%s</div></div>' % (lb, celdas)

def svg_poli():
    f = lambda x: x**4 + 5*x**3 + 4*x**2 - 4*x + 1
    X0, X1, Y0, Y1 = -4, 1, -10, 20
    W, H, ml, mb, mt, mr = 640, 300, 46, 34, 14, 14
    sx = lambda x: ml + (x - X0) / (X1 - X0) * (W - ml - mr)
    sy = lambda y: mt + (Y1 - y) / (Y1 - Y0) * (H - mt - mb)
    pts = []
    n = 300
    for i in range(n + 1):
        x = X0 + (X1 - X0) * i / n
        y = max(min(f(x), Y1), Y0)
        pts.append('%.1f,%.1f' % (sx(x), sy(y)))
    g = []
    for x in range(-4, 2):
        g.append('<line class="grid-l" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="ts" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (sx(x), mt, sx(x), H - mb, sx(x), H - mb + 16, x))
    for y in range(-10, 21, 5):
        g.append('<line class="grid-l" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/><text class="ts" x="%d" y="%.1f" text-anchor="end">%s</text>' % (ml, sy(y), W - mr, sy(y), ml - 6, sy(y) + 4, str(y).replace('-', '−')))
    # óptimos: buscar mínimos numéricamente
    xs = [X0 + (X1 - X0) * i / 5000 for i in range(5001)]
    mins = [x for a, x, b in zip(xs, xs[1:], xs[2:]) if f(x) < f(a) and f(x) < f(b)]
    marcas = ''
    etiquetas = ['Óptimo global', 'Óptimo local']
    mins.sort(key=f)
    for k, x in enumerate(mins[:2]):
        cl = 'tw' if k == 0 else 'ta'
        st = 'var(--warn)' if k == 0 else 'var(--acc)'
        dy = 34 if k == 0 else -62
        marcas += '<circle cx="%.1f" cy="%.1f" r="6" fill="none" stroke="%s" stroke-width="2.5"/>' % (sx(x), sy(f(x)), st)
        if k == 0:
            marcas += '<line class="ln" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (sx(x), sy(f(x)) + 8, sx(x), sy(f(x)) + dy - 14)
        else:
            marcas += '<line class="ln" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (sx(x), sy(f(x)) - 8, sx(x), sy(f(x)) + dy + 6)
        marcas += '<text class="%s" x="%.1f" y="%.1f" text-anchor="%s">%s (x ≈ %s; f ≈ %s)</text>' % (cl, sx(x) + (-10 if k == 0 else 10), sy(f(x)) + dy, 'start' if k == 0 else 'end', etiquetas[k], ('%.2f' % x).replace('.', ',').replace('-', '−'), ('%.2f' % f(x)).replace('.', ',').replace('-', '−'))
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="Gráfico del polinomio con su óptimo global y su óptimo local">%s'
            '<polyline class="la" points="%s"/>%s<text class="ts" x="%d" y="%d" text-anchor="middle">x</text></svg>') % (W, H, ''.join(g), ' '.join(pts), marcas, W // 2 + 10, H - 2)

def svg_enfriamiento():
    W, H, ml, mb, mt, mr = 640, 260, 46, 34, 14, 170
    T0, tmax = 1.0, 500
    sx = lambda t: ml + t / tmax * (W - ml - mr)
    sy = lambda T: mt + (1 - T) * (H - mt - mb)
    curvas = [(0.002, 'lg', 'μ = 0,002 (lento)'), (0.01, 'la', 'μ = 0,01'), (0.05, 'lw', 'μ = 0,05 (rápido)')]
    g = []
    for t in range(0, 501, 100):
        g.append('<line class="grid-l" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="ts" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (sx(t), mt, sx(t), H - mb, sx(t), H - mb + 16, t))
    for T in [0, .25, .5, .75, 1]:
        g.append('<line class="grid-l" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/><text class="ts" x="%d" y="%.1f" text-anchor="end">%s</text>' % (ml, sy(T), W - mr, sy(T), ml - 6, sy(T) + 4, ('%g' % T).replace('.', ',') + ('·T₀' if T else '')))
    lines = ''
    for mu, cl, lb in curvas:
        pts = ' '.join('%.1f,%.1f' % (sx(t), sy(math.exp(-mu * t))) for t in range(0, 501, 5))
        yend = sy(math.exp(-mu * tmax))
        lines += '<polyline class="%s" points="%s"/>' % (cl, pts)
        k = [c[1] for c in curvas].index(cl)
        ly = mt + 20 + 26 * k
        lines += '<line class="%s" x1="%d" y1="%d" x2="%d" y2="%d"/><text class="%s" x="%d" y="%d">%s</text>' % (cl, W - mr + 10, ly, W - mr + 30, ly, 'tg' if cl == 'lg' else 'ta' if cl == 'la' else 'tw', W - mr + 36, ly + 4, lb)
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="Curvas de enfriamiento T = T0 exp(-mu t)">%s%s'
            '<text class="ts" x="%d" y="%d" text-anchor="middle">iteración t</text></svg>') % (W, H, ''.join(g), lines, (W - mr + ml) // 2, H - 2)

def svg_ranking():
    W, H, ml, mb, mt, mr = 640, 250, 46, 34, 14, 120
    N = 10
    sx = lambda p: ml + (p - 1) / (N - 1) * (W - ml - mr)
    sy = lambda v: mt + (2 - v) / 2 * (H - mt - mb)
    g = []
    for p in range(1, N + 1):
        g.append('<line class="grid-l" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/><text class="ts" x="%.1f" y="%d" text-anchor="middle">%d</text>' % (sx(p), mt, sx(p), H - mb, sx(p), H - mb + 16, p))
    for v in [0, .5, 1, 1.5, 2]:
        g.append('<line class="grid-l" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/><text class="ts" x="%d" y="%.1f" text-anchor="end">%s</text>' % (ml, sy(v), W - mr, sy(v), ml - 6, sy(v) + 4, ('%g' % v).replace('.', ',')))
    lines = ''
    for SP, cl, tc in [(1, 'ln', 'ts'), (1.5, 'la', 'ta'), (2, 'lw', 'tw')]:
        LR = lambda p: (2 - SP) + 2 * (SP - 1) * (p - 1) / (N - 1)
        lines += '<line class="%s" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (cl, sx(1), sy(LR(1)), sx(N), sy(LR(N)))
        for p in range(1, N + 1):
            lines += '<circle cx="%.1f" cy="%.1f" r="3.2" class="%s" style="fill:var(--card)"/>' % (sx(p), sy(LR(p)), cl)
        lines += '<text class="%s" x="%.1f" y="%.1f">SP = %s</text>' % (tc, W - mr + 10, sy(LR(N)) + 4, ('%g' % SP).replace('.', ','))
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="Fitness por ranking lineal para distintos SP">%s%s'
            '<text class="ts" x="%d" y="%d" text-anchor="middle">posición en el ranking (1 = peor, N = mejor) · N = 10</text></svg>') % (W, H, ''.join(g), lines, (W - mr + ml) // 2, H - 2)

def svg_cubo():
    W, H = 640, 300
    X0, X1, Y0, Y1 = -0.15, 0.8, -0.55, 0.65
    ml, mr, mt, mb = 40, 200, 12, 26
    sx = lambda x: ml + (x - X0) / (X1 - X0) * (W - ml - mr)
    sy = lambda y: mt + (Y1 - y) / (Y1 - Y0) * (H - mt - mb)
    P1, P2 = (0.6, -0.4), (0.0, 0.5)
    o = []
    o.append('<line class="grid-l" x1="%.1f" y1="%d" x2="%.1f" y2="%d"/>' % (sx(0), mt, sx(0), H - mb))
    o.append('<line class="grid-l" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/>' % (ml, sy(0), W - mr, sy(0)))
    o.append('<text class="ts" x="%d" y="%.1f">x</text><text class="ts" x="%.1f" y="%d">y</text>' % (W - mr + 4, sy(0) + 4, sx(0) + 5, mt + 10))
    xa, xb = sorted([P1[0], P2[0]]); ya, yb = sorted([P1[1], P2[1]])
    o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" style="fill:var(--okbg);stroke:var(--acc2);stroke-width:1.5" class="dash"/>' % (sx(xa), sy(yb), sx(xb) - sx(xa), sy(ya) - sy(yb)))
    o.append('<line class="la" x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (sx(P1[0]), sy(P1[1]), sx(P2[0]), sy(P2[1])))
    def pt(p, lb, color, dx=8, dy=-8, anchor='start', r=6, fill=True):
        st = 'fill:%s;stroke:%s;stroke-width:2' % (color if fill else 'var(--card)', color)
        return '<circle cx="%.1f" cy="%.1f" r="%d" style="%s"/><text x="%.1f" y="%.1f" text-anchor="%s" class="tb">%s</text>' % (sx(p[0]), sy(p[1]), r, st, sx(p[0]) + dx, sy(p[1]) + dy, anchor, lb)
    o.append(pt(P1, 'P₁ (0,6; −0,4)', 'var(--ink)', 10, 16))
    o.append(pt(P2, 'P₂ (0; 0,5)', 'var(--ink)', -10, -10, 'end'))
    o.append(pt((0.6, 0.5), 'Single Point', 'var(--warn)', 10, -8, 'start', 6, False))
    o.append(pt((0.0, -0.4), 'Single Point', 'var(--warn)', -10, 16, 'end', 6, False))
    o.append(pt((0.45, -0.175), 'aritmético', 'var(--acc)', 10, 4, 'start', 5))
    o.append(pt((0.15, 0.275), 'aritmético', 'var(--acc)', -10, 4, 'end', 5))
    o.append(pt((0.45, 0.32), 'Cube', 'var(--acc2)', 10, 4, 'start', 5))
    o.append(pt((0.15, -0.22), 'Cube', 'var(--acc2)', -10, 4, 'end', 5))
    lx = W - mr + 30
    o.append('<rect x="%d" y="70" width="14" height="10" style="fill:var(--okbg);stroke:var(--acc2)"/><text x="%d" y="80" class="ts">zona del Cube</text>' % (lx, lx + 20))
    o.append('<line class="la" x1="%d" y1="105" x2="%d" y2="105"/><text x="%d" y="109" class="ts">zona del aritmético</text>' % (lx, lx + 14, lx + 20))
    o.append('<circle cx="%d" cy="135" r="5" style="fill:var(--card);stroke:var(--warn);stroke-width:2"/><text x="%d" y="139" class="ts">vértices: Single Point</text>' % (lx + 7, lx + 20))
    return '<svg viewBox="0 0 %d %d" role="img" aria-label="Zonas donde caen los hijos según el operador">%s</svg>' % (W, H, ''.join(o))

def main():
    src = ''.join(p.read_text(encoding='utf-8') for p in sorted(AQUI.glob('parte*.html')))
    src = re.sub(r'\[\[crom\|(.*?)\|(.*?)\|(.*?)\]\]', lambda m: crom(m.group(1), m.group(2), m.group(3)), src)
    src = src.replace('{{SVG_POLI}}', svg_poli()).replace('{{SVG_ENF}}', svg_enfriamiento()).replace('{{SVG_RANK}}', svg_ranking()).replace('{{SVG_CUBO}}', svg_cubo())
    def partir(m):
        cls, d, rest = m.group(1), m.group(2), m.group(3)
        partes = re.findall(r'M[^M]+', d)
        return ''.join('<path class="%s" d="%s"%s/>' % (cls, q.strip(), rest) for q in partes)
    src = re.sub(r'<path class="([^"]+)" d="([^"]+)"( marker-end="[^"]+")/>', partir, src)
    assert '[[' not in src and '{{' not in src, 'quedó un marcador sin reemplazar'
    (RAIZ / 'index.html').write_text(src, encoding='utf-8')
    print('index.html', len(src), 'bytes')

if __name__ == '__main__':
    main()
