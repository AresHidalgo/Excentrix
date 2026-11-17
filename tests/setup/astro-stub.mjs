/**
 * Las pruebas importan módulos cuyos index.ts reexportan componentes .astro. Node no sabe
 * cargarlos, así que este gancho los reemplaza por un módulo vacío. Los componentes no se
 * ejecutan en las pruebas; se verifican con `pnpm check` y `pnpm build`.
 */
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.astro')) {
      return { format: 'module', source: 'export default {};', shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
