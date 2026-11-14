/* Service worker do Toque Gourmet.

   A estratégia é escolhida por tipo de requisição, e o motivo importa:

   - Páginas: rede primeiro. Preço e cardápio mudam, e cache-first aqui faria
     a cliente ver valor antigo por dias. O cache só entra se a rede falhar.
   - CSS e JS: rede primeiro, como as páginas. Se viessem do cache, logo
     depois de uma publicação a página nova chegava com o estilo antigo e o
     site aparecia "quebrado" até recarregar.
   - Imagens e fontes: responde do cache e atualiza por trás, que é o que
     deixa a segunda visita instantânea.
   - Firebase, Supabase e qualquer outra origem: nunca passa pelo cache. São
     login, produtos e upload — cachear isso quebra o painel.

   Ao publicar mudança em arquivo estático, suba o VERSAO para os antigos
   serem descartados. */
const VERSAO = 'tg-v12';
const CACHE_PAGINAS = `${VERSAO}-paginas`;
const CACHE_ESTATICOS = `${VERSAO}-estaticos`;

const ESSENCIAIS = [
  '/',
  '/index.html',
  '/sobre.html',
  '/styles.css',
  '/logo.webp',
  '/pipoca.png',
  '/icon-192.png',
  '/manifest.json'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_ESTATICOS)
      // addAll falha inteiro se um arquivo faltar; individualmente um 404 não
      // impede a instalação do resto.
      .then((cache) => Promise.allSettled(ESSENCIAIS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

function ehCodigo(url) {
  return /\.(css|js|json)$/i.test(url.pathname);
}

function ehEstatico(url) {
  return /\.(png|jpe?g|webp|svg|woff2?|ico)$/i.test(url.pathname);
}

// Rede primeiro; guarda uma cópia para quando a pessoa estiver sem internet.
function redePrimeiro(req, nomeCache) {
  return fetch(req)
    .then((resp) => {
      if (resp && resp.status === 200) {
        const copia = resp.clone();
        caches.open(nomeCache).then((c) => c.put(req, copia));
      }
      return resp;
    })
    .catch(() => caches.match(req).then((r) => r || Response.error()));
}

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Outra origem (Firebase, Supabase, fontes, CDN): deixa passar direto.
  if (url.origin !== self.location.origin) return;

  // A área administrativa nunca é cacheada — precisa refletir o estado real.
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE_PAGINAS).then((c) => c.put(req, copia));
          return resp;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  if (ehCodigo(url)) {
    evento.respondWith(redePrimeiro(req, CACHE_ESTATICOS));
    return;
  }

  if (ehEstatico(url)) {
    evento.respondWith(
      caches.match(req).then((cacheado) => {
        const rede = fetch(req)
          .then((resp) => {
            if (resp && resp.status === 200) {
              const copia = resp.clone();
              caches.open(CACHE_ESTATICOS).then((c) => c.put(req, copia));
            }
            return resp;
          })
          .catch(() => cacheado);
        return cacheado || rede;
      })
    );
  }
});
