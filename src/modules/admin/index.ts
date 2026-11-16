// Módulo admin: nunca lo importa un módulo público (ARQUITECTURA.md, regla 4).
export { default as AdminShell } from './components/AdminShell.astro';
export { default as AdminSummary } from './components/AdminSummary.astro';
export { default as PerfumeEditForm } from './components/PerfumeEditForm.astro';
export { default as PerfumeTable } from './components/PerfumeTable.astro';
