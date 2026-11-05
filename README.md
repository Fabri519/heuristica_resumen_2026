# Heurística y Optimización · Guía completa

Resumen de **Algoritmos Genéticos y Optimización Heurística** (UTN FRT, Dr. Adrián Will · GITIA) armado a partir de las diapositivas de clase, con práctica de verdadero/falso y multiple choice por tema.

🌐 **Sitio:** https://fabri519.github.io/heuristica_resumen_2026/

## Qué tiene

- **Guía (`index.html`)** separada en módulos, secciones e incisos:
  - **Módulo 1 · Introducción:** qué es una heurística, el problema de optimización, clasificación de los métodos, aplicaciones del GITIA y la máxima de Napoleón (inteligencia e iniciativa).
  - **Módulo 2 · Métodos secuenciales:** Hill Climbing y Simulated Annealing (y una comparación entre los dos).
  - **Módulo 3 · Algoritmos Genéticos:** generalidades y esquema, **selección** (bias/spread/presión/diversidad, ruleta, torneo, SUS, ranking), **cruzamiento** (Single Point, Shuffle, Two/Multi-Point, Uniform, Aritmético, Cube, PMX, Order Based), **mutación** y el ejemplo completo resuelto.
  - **Módulo 4 · Para el parcial:** pares que se confunden y fórmulas.
- Cajas ámbar con las **erratas** de las diapositivas, preguntas **¿Lo entendiste?** y **laboratorios** interactivos (ruleta/SUS/torneo, cruzamientos y probabilidad de aceptación del recocido).
- **Práctica (`practica.html`):** 223 preguntas. Se eligen los módulos y temas, el tipo (V/F, multiple choice o ambas), la cantidad y el modo (corrección al instante o examen con tiempo). Al final muestra la nota por tema, qué secciones repasar y permite reintentar solo las incorrectas.
- Modo claro/oscuro, buscador (tecla `/`), índice ocultable y avance guardado en el navegador.

## Cómo está armado

```
index.html          ← se genera con src/build.py (no editar a mano)
practica.html       ← página de práctica
assets/estilo.css   ← estilos
assets/comun.js     ← tema, índice, avance y buscador
assets/labs.js      ← laboratorios interactivos
assets/preguntas.js ← banco de preguntas
src/parte1..4.html  ← contenido de la guía
src/build.py        ← arma index.html (cromosomas y gráficos)
```

Para cambiar la guía: editar `src/parte*.html` y correr `python3 src/build.py`.

Para agregar una pregunta, sumar una línea en `assets/preguntas.js`:

```js
{ t:'hc', y:'vf', q:'Texto de la afirmación', a:true, e:'Explicación', s:'s5' },
{ t:'hc', y:'mc', q:'Pregunta', o:['opción a','opción b','opción c'], a:1, e:'Explicación', s:'s5' },
```

`t` es el tema, `y` el tipo, `a` la respuesta (true/false o el índice de la opción correcta) y `s` la sección de la guía a la que lleva el link "Repasar".

## Publicar con GitHub Pages

Settings → Pages → *Build and deployment* → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save. En uno o dos minutos queda en la dirección de arriba.
