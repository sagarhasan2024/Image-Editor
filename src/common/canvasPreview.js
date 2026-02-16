// canvasPreviewWithFilters.js
export async function canvasPreviewWithFilters(image, canvas, crop, scale = 1, rotate = 0, filterStyle = 'none') {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.clearRect(0, 0, crop.width, crop.height);

  // Apply filter to canvas context
  ctx.filter = filterStyle;

  ctx.save();

  // Move to center of canvas for rotation
  ctx.translate(crop.width / 2, crop.height / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-crop.width / 2, -crop.height / 2);

  ctx.drawImage(
    image,
    crop.x / scaleX,
    crop.y / scaleY,
    crop.width / scaleX,
    crop.height / scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  ctx.restore();
}
