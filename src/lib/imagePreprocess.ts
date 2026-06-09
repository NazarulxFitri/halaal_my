function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };
    image.src = objectUrl;
  });
}

function enhanceContrast(value: number): number {
  const normalized = value / 255;
  const enhanced = (normalized - 0.5) * 1.6 + 0.5;
  return Math.max(0, Math.min(255, Math.round(enhanced * 255)));
}

export async function preprocessImageForOcr(file: File): Promise<HTMLCanvasElement> {
  const image = await loadImage(file);
  const longestEdge = Math.max(image.width, image.height);
  const scale = Math.min(3, Math.max(1, 1200 / longestEdge));
  const padding = Math.round(32 * scale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale + padding * 2);
  canvas.height = Math.round(image.height * scale + padding * 2);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    padding,
    padding,
    image.width * scale,
    image.height * scale,
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const gray = Math.round(
      data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114,
    );
    const contrasted = enhanceContrast(gray);
    const binary = contrasted < 170 ? 0 : 255;
    data[index] = binary;
    data[index + 1] = binary;
    data[index + 2] = binary;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}
