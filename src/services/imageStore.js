const DB_NAME = 'isivoltpro_media';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const openDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const transaction = async (mode = 'readonly') => {
  const db = await openDb();
  return {
    db,
    store: db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
  };
};

export const imageStore = {
  async save(dataUrl, meta = {}) {
    if (!dataUrl) return null;

    const id = meta.id || `img-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const { db, store } = await transaction('readwrite');

    await new Promise((resolve, reject) => {
      const request = store.put({
        id,
        dataUrl,
        tipo: meta.tipo || 'articulo',
        createdAt: new Date().toISOString()
      });
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });

    db.close();
    return id;
  },

  async get(id) {
    if (!id) return null;

    const { db, store } = await transaction();
    const result = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();

    return result?.dataUrl || null;
  },

  async remove(id) {
    if (!id) return true;

    const { db, store } = await transaction('readwrite');
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
    return true;
  },

  async all() {
    const { db, store } = await transaction();
    const result = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  },

  async importAll(images = []) {
    if (!Array.isArray(images)) return true;

    const { db, store } = await transaction('readwrite');
    await Promise.all(images.map((image) => new Promise((resolve, reject) => {
      if (!image?.id || !image?.dataUrl) {
        resolve();
        return;
      }
      const request = store.put(image);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    })));
    db.close();
    return true;
  }
};
