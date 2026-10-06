/*
 * Objetos UNDC — prototipo frontend.
 * Persistencia temporal: localStorage. Para la siguiente entrega, sustituir
 * las funciones de lectura/escritura por fetch() a una API Node.js + Express
 * y guardar objetos/reclamos en PostgreSQL o MongoDB. Ver notas BACKEND abajo.
 */
(() => {
  'use strict';

  const OBJECTS_KEY = 'undc_lost_found_objects_v1';
  const CLAIMS_KEY = 'undc_lost_found_claims_v1';
  const seedObjects = [
    { id: 'demo-1', nombre: 'Llaves con llavero amarillo', categoria: 'Llaves', tipo: 'Encontrado', lugar: 'Biblioteca central', fecha: daysAgo(0), descripcion: 'Juego de tres llaves con un llavero amarillo. Encontrado cerca de las mesas de lectura.', estado: 'En custodia', imagen: '', icono: '🔑' },
    { id: 'demo-2', nombre: 'DNI encontrado', categoria: 'Documentos', tipo: 'Encontrado', lugar: 'Pabellón de Ingeniería', fecha: daysAgo(1), descripcion: 'Documento encontrado en el pasillo del primer piso. Se mantiene en custodia para su devolución.', estado: 'En custodia', imagen: '', icono: '🪪' },
    { id: 'demo-3', nombre: 'Audífonos inalámbricos', categoria: 'Electrónicos', tipo: 'Encontrado', lugar: 'Cafetería', fecha: daysAgo(2), descripcion: 'Estuche blanco de audífonos inalámbricos olvidado en una mesa de la cafetería.', estado: 'En custodia', imagen: '', icono: '🎧' },
    { id: 'demo-4', nombre: 'Mochila azul marino', categoria: 'Mochilas/Ropa', tipo: 'Encontrado', lugar: 'Patio principal', fecha: daysAgo(1), descripcion: 'Mochila azul con un cuaderno y un tomatodo. No publicamos datos identificables de su interior.', estado: 'En custodia', imagen: '', icono: '🎒' },
    { id: 'demo-5', nombre: 'Tarjeta universitaria', categoria: 'Documentos', tipo: 'Encontrado', lugar: 'Laboratorio de cómputo', fecha: daysAgo(4), descripcion: 'Tarjeta universitaria encontrada al finalizar la clase. Solicita la devolución para coordinar la verificación.', estado: 'Entregado', imagen: '', icono: '💳' },
    { id: 'demo-6', nombre: 'Cargador USB-C', categoria: 'Electrónicos', tipo: 'Encontrado', lugar: 'Aula 204', fecha: daysAgo(3), descripcion: 'Cargador de pared blanco con cable USB-C. Encontrado junto a una carpeta en el aula.', estado: 'En custodia', imagen: '', icono: '🔌' },
    { id: 'demo-7', nombre: 'Casaca ploma', categoria: 'Mochilas/Ropa', tipo: 'Encontrado', lugar: 'Auditorio', fecha: daysAgo(5), descripcion: 'Casaca ligera color plomo, olvidada en la última fila del auditorio.', estado: 'En custodia', imagen: '', icono: '🧥' },
    { id: 'demo-8', nombre: 'Estuche de lentes', categoria: 'Otros', tipo: 'Encontrado', lugar: 'Entrada principal', fecha: daysAgo(6), descripcion: 'Estuche rígido negro para lentes. Se encontró cerca de la puerta de ingreso.', estado: 'En custodia', imagen: '', icono: '👓' }
  ];

  function daysAgo(amount) {
    const date = new Date();
    date.setDate(date.getDate() - amount);
    return date.toISOString().slice(0, 10);
  }

  function readObjects() {
    try {
      const saved = JSON.parse(localStorage.getItem(OBJECTS_KEY));
      if (Array.isArray(saved)) return saved;
      localStorage.setItem(OBJECTS_KEY, JSON.stringify(seedObjects));
    } catch (error) {
      console.warn('No se pudo leer el almacenamiento local; se usarán los datos de ejemplo.', error);
    }
    return [...seedObjects];
  }

  function writeObjects(objects) {
    // BACKEND: reemplazar por POST /api/objects o PATCH /api/objects/:id.
    localStorage.setItem(OBJECTS_KEY, JSON.stringify(objects));
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function formatDate(value) {
    if (!value) return 'Fecha no indicada';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? 'Fecha no indicada' : new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function imageMarkup(object, extraClass = '') {
    const icon = escapeHTML(object.icono || '📦');
    const alt = escapeHTML(object.nombre || 'Objeto reportado');
    return object.imagen
      ? `<img src="${escapeHTML(object.imagen)}" alt="${alt}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=\"object-placeholder\" aria-hidden=\"true\">📦</span>')">`
      : `<span class="object-placeholder ${extraClass}" aria-hidden="true">${icon}</span>`;
  }

  function setupNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      links.classList.toggle('is-open', open);
    });
  }

  function setupReportForm() {
    const form = document.querySelector('#object-form');
    if (!form) return;
    const dateInput = form.elements.fecha;
    if (!dateInput.value) dateInput.value = daysAgo(0);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const object = {
        id: `obj-${Date.now()}`,
        nombre: String(data.get('nombre')).trim(), categoria: String(data.get('categoria')),
        tipo: String(data.get('tipo')), lugar: String(data.get('lugar')).trim(),
        fecha: String(data.get('fecha')), descripcion: String(data.get('descripcion')).trim(),
        estado: 'En custodia', imagen: String(data.get('imagen')).trim(), icono: iconForCategory(String(data.get('categoria')))
      };
      const objects = readObjects();
      objects.unshift(object);
      writeObjects(objects);
      // BACKEND: POST /api/objects {nombre,categoria,tipo,lugar,fecha,descripcion,imagen}.
      const message = document.querySelector('#form-message');
      message.textContent = '¡Reporte publicado! Ya aparece en el catálogo.';
      message.classList.remove('error');
      form.reset();
      dateInput.value = daysAgo(0);
      window.setTimeout(() => { window.location.href = 'catalogo.html'; }, 900);
    });
  }

  function iconForCategory(category) {
    return ({ 'Llaves': '🔑', 'Documentos': '🪪', 'Electrónicos': '🎧', 'Mochilas/Ropa': '🎒', 'Otros': '📦' })[category] || '📦';
  }

  function setupCatalog() {
    const grid = document.querySelector('#object-grid');
    if (!grid) return;
    const search = document.querySelector('#search-input');
    const status = document.querySelector('#status-filter');
    const count = document.querySelector('#results-count');
    const empty = document.querySelector('#empty-state');
    let category = new URLSearchParams(location.search).get('categoria') || 'Todas';
    let objects = readObjects();

    function render() {
      const query = search.value.trim().toLocaleLowerCase('es');
      const filtered = objects.filter((item) => {
        const haystack = `${item.nombre} ${item.lugar} ${item.descripcion} ${item.categoria}`.toLocaleLowerCase('es');
        return (category === 'Todas' || item.categoria === category)
          && (status.value === 'Todos' || item.estado === status.value)
          && (!query || haystack.includes(query));
      });
      count.innerHTML = `<strong>${filtered.length}</strong> ${filtered.length === 1 ? 'objeto encontrado' : 'objetos encontrados'}`;
      empty.hidden = filtered.length > 0;
      grid.hidden = filtered.length === 0;
      grid.innerHTML = filtered.map((item) => `<article class="object-card"><a href="detalle-objeto.html?id=${encodeURIComponent(item.id)}" aria-label="Ver detalles de ${escapeHTML(item.nombre)}"><div class="object-image">${imageMarkup(item)}<span class="category-tag">${escapeHTML(item.categoria)}</span><span class="status-tag ${item.estado === 'Entregado' ? 'delivered' : ''}">${escapeHTML(item.estado)}</span></div><div class="object-info"><h2>${escapeHTML(item.nombre)}</h2><div class="object-meta"><span>⌖ ${escapeHTML(item.lugar)}</span><span>◷ ${escapeHTML(formatDate(item.fecha))}</span></div><p class="object-description">${escapeHTML(item.descripcion || 'Sin descripción adicional.')}</p><span class="object-link">Ver detalles <span>→</span></span></div></a></article>`).join('');
    }
    document.querySelectorAll('[data-category]').forEach((button) => {
      if (button.dataset.category === category) button.classList.add('is-selected');
      button.addEventListener('click', () => {
        category = button.dataset.category;
        document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('is-selected', item === button));
        render();
      });
    });
    search.addEventListener('input', render);
    status.addEventListener('change', render);
    const clear = () => {
      category = 'Todas'; search.value = ''; status.value = 'Todos';
      document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('is-selected', item.dataset.category === 'Todas'));
      render();
    };
    document.querySelector('#clear-filters').addEventListener('click', clear);
    document.querySelector('#empty-clear').addEventListener('click', clear);
    render();
  }

  function setupDetail() {
    const content = document.querySelector('#detail-content');
    if (!content) return;
    const id = new URLSearchParams(location.search).get('id');
    const object = readObjects().find((item) => item.id === id);
    if (!object) {
      content.hidden = true;
      document.querySelector('#detail-missing').hidden = false;
      return;
    }
    const delivered = object.estado === 'Entregado';
    content.innerHTML = `<div class="detail-image">${imageMarkup(object)}<span class="category-tag">${escapeHTML(object.categoria)}</span></div><section class="detail-copy"><span class="status-tag ${delivered ? 'delivered' : ''}" style="position:static;display:inline-block">${escapeHTML(object.estado)}</span><h1>${escapeHTML(object.nombre)}</h1><div class="object-meta"><span>⌖ ${escapeHTML(object.lugar)}</span><span>◷ ${escapeHTML(formatDate(object.fecha))}</span></div><p class="detail-description">${escapeHTML(object.descripcion || 'No se agregó una descripción adicional para este objeto.')}</p><div class="detail-facts"><div class="detail-fact"><small>Categoría</small><strong>${escapeHTML(object.categoria)}</strong></div><div class="detail-fact"><small>Reporte</small><strong>${escapeHTML(object.tipo || 'Encontrado')}</strong></div><div class="detail-fact"><small>Fecha</small><strong>${escapeHTML(formatDate(object.fecha))}</strong></div><div class="detail-fact"><small>Estado</small><strong>${escapeHTML(object.estado)}</strong></div></div>${delivered ? '<p class="privacy-note">Este objeto ya fue entregado. Revisa el catálogo para ver otros reportes.</p>' : '<button id="open-claim" class="button button-primary detail-cta" type="button">Reclamar este objeto <span>→</span></button><p class="field-hint">La entrega se coordina con verificación por parte del equipo responsable.</p>'}<a class="text-link" href="catalogo.html">← Volver al catálogo</a></section>`;
    const dialog = document.querySelector('#claim-dialog');
    const claimForm = document.querySelector('#claim-form');
    const open = document.querySelector('#open-claim');
    if (open) open.addEventListener('click', () => {
      claimForm.elements.objectId.value = object.id;
      document.querySelector('#claim-message').textContent = '';
      dialog.showModal();
    });
    document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    claimForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(claimForm);
      let claims = [];
      try { claims = JSON.parse(localStorage.getItem(CLAIMS_KEY)) || []; } catch { claims = []; }
      claims.push({ id: `claim-${Date.now()}`, objectId: object.id, nombre: String(formData.get('nombre')).trim(), codigo: String(formData.get('codigo')).trim(), escuela: String(formData.get('escuela')).trim(), mensaje: String(formData.get('mensaje')).trim(), createdAt: new Date().toISOString() });
      localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
      // BACKEND: POST /api/objects/:id/claims. Validar sesión y notificar al encargado;
      // no exponer códigos universitarios en respuestas públicas del catálogo.
      document.querySelector('#claim-message').textContent = 'Solicitud guardada. El equipo responsable coordinará contigo la verificación.';
      claimForm.reset();
      window.setTimeout(() => dialog.close(), 1800);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupReportForm();
    setupCatalog();
    setupDetail();
  });
})();
