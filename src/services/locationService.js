export const SECTOR_CODES = {
  Electricidad: 'ELE',
  Fontanería: 'FON',
  'Fontaneria': 'FON',
  Mecánico: 'MEC',
  Mecanico: 'MEC',
  Albañil: 'ALB',
  Albanil: 'ALB',
  Jardín: 'JAR',
  Jardin: 'JAR',
  Calefactor: 'CAL',
  Clima: 'CLI'
};

export const PASILLOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const ESTANTERIAS = ['01', '02', '03', '04', '05', '06'];
export const BALDAS = ['B1', 'B2', 'B3', 'B4', 'C1', 'C2'];

export const locationService = {
  sectorCode(sector = '') {
    return SECTOR_CODES[sector] || sector.slice(0, 3).toUpperCase() || 'GEN';
  },

  buildLocation({ sector = '', pasillo = 'A', estanteria = '01', balda = 'B1' } = {}) {
    return `${this.sectorCode(sector)}-${pasillo}${estanteria}-${balda}`;
  },

  parseLocation(ubicacion = '') {
    const [sectorCode = '', zona = '', balda = ''] = ubicacion.split('-');
    return {
      sectorCode,
      pasillo: zona.slice(0, 1) || 'A',
      estanteria: zona.slice(1) || '01',
      balda: balda || 'B1'
    };
  },

  suggestLocations(sector = '', articulos = []) {
    const code = this.sectorCode(sector);
    const used = new Set(articulos.map((art) => art.ubicacion).filter(Boolean));
    const suggestions = [];

    for (const pasillo of PASILLOS) {
      for (const estanteria of ESTANTERIAS) {
        for (const balda of BALDAS) {
          const ubicacion = `${code}-${pasillo}${estanteria}-${balda}`;
          if (!used.has(ubicacion)) suggestions.push(ubicacion);
          if (suggestions.length >= 8) return suggestions;
        }
      }
    }

    return suggestions;
  },

  occupancyBySector(sector = '', articulos = []) {
    const code = this.sectorCode(sector);
    const items = articulos.filter((art) => (art.ubicacion || '').startsWith(`${code}-`));
    return {
      sector,
      code,
      referencias: items.length,
      unidades: items.reduce((sum, art) => sum + (Number(art.stockActual) || 0), 0),
      ubicaciones: Array.from(new Set(items.map((art) => art.ubicacion).filter(Boolean)))
    };
  }
};
