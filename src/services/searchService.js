const normalize = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

export const searchService = {
  normalize,

  buildArticleIndex(articulos = []) {
    return articulos.map((articulo) => ({
      ...articulo,
      _search: normalize([
        articulo.codigo,
        articulo.nombre,
        articulo.categoria,
        articulo.marca,
        articulo.modelo,
        articulo.ubicacion,
        articulo.proveedorPrincipal,
        articulo.descripcion
      ].filter(Boolean).join(' '))
    }));
  },

  filterArticles(articulos = [], { busqueda = '', categoria = '', proveedor = '', almacen = '', mostrarInactivos = false } = {}) {
    const query = normalize(busqueda);
    const tokens = query.split(/\s+/).filter(Boolean);

    return this.buildArticleIndex(articulos).filter((articulo) => {
      const cumpleBusqueda = tokens.length === 0 || tokens.every((token) => articulo._search.includes(token));
      const cumpleCategoria = !categoria || articulo.categoria === categoria;
      const cumpleProveedor = !proveedor || articulo.proveedorPrincipal === proveedor;
      const cumpleAlmacen = !almacen || (Number(articulo.stockPorAlmacen?.[almacen]) || 0) > 0;
      const cumpleActivo = mostrarInactivos || articulo.activo;
      return cumpleBusqueda && cumpleCategoria && cumpleProveedor && cumpleAlmacen && cumpleActivo;
    });
  },

  sortByRelevance(articulos = [], busqueda = '') {
    const query = normalize(busqueda);
    if (!query) return articulos;

    return [...articulos].sort((a, b) => {
      const aCode = normalize(a.codigo).startsWith(query) ? 0 : 1;
      const bCode = normalize(b.codigo).startsWith(query) ? 0 : 1;
      if (aCode !== bCode) return aCode - bCode;

      const aName = normalize(a.nombre).startsWith(query) ? 0 : 1;
      const bName = normalize(b.nombre).startsWith(query) ? 0 : 1;
      if (aName !== bName) return aName - bName;

      return normalize(a.nombre).localeCompare(normalize(b.nombre), 'es');
    });
  }
};
