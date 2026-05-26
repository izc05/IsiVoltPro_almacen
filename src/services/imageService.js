export const imageService = {
  compress(file, maxSize = 1280, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  placeholder(label = 'Artículo') {
    const initials = label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'IV';

    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#111827"/>
            <stop offset="1" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <rect width="480" height="360" rx="32" fill="url(#bg)"/>
        <rect x="28" y="28" width="424" height="304" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.22)"/>
        <text x="50%" y="48%" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${initials}</text>
        <text x="50%" y="64%" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#fef3c7">IsiVoltPro Almacén</text>
      </svg>
    `)}`;
  }
};
