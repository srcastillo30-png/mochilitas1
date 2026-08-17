MOCHILITAS — CLOUDFLARE WORKERS

IMPORTANTE: esta versión está preparada para CLOUDFLARE WORKERS (URL workers.dev), no para Netlify.

1) En Cloudflare abre Workers & Pages.
2) Asegúrate de que tu workers.dev esté habilitado en Domains/Routes. Si el navegador muestra ERR_SSL_VERSION_OR_CIPHER_MISMATCH, el problema es el certificado/subdominio de Cloudflare, no el formulario.
3) Crea un KV namespace para guardar los comprobantes y el contador.
4) Copia el ID de ese namespace y reemplaza REEMPLAZAR_CON_ID_DE_TU_KV en wrangler.jsonc.
5) Instala Node.js si no lo tienes.
6) En esta carpeta ejecuta:
   npm install
   npx wrangler login
   npx wrangler deploy

El despliegue generará una URL del tipo:
https://mochilitas-donaciones.TU_SUBDOMINIO.workers.dev/

FLUJO DEL FORMULARIO:
- El usuario escribe el monto.
- Adjunta el comprobante.
- Pulsa ENVIAR.
- El Worker guarda el comprobante y suma el monto.
- Aparece directamente “¡Gracias por tu donación!”.
- NO existe gracias.html.
- NO se usa Netlify Forms.

Si el workers.dev sigue mostrando ERR_SSL_VERSION_OR_CIPHER_MISMATCH, ve a:
Workers & Pages > tu Worker > Domains/Routes y habilita workers.dev.
Cloudflare indica que cada Worker puede tener un workers.dev subdomain cuando está habilitado.
