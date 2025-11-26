export const encode = async (imageFile: File, text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert text to binary string (UTF-16)
      let binaryText = '';
      for (let i = 0; i < text.length; i++) {
        const binaryChar = text.charCodeAt(i).toString(2).padStart(16, '0');
        binaryText += binaryChar;
      }

      // Add length prefix (32 bits)
      const lengthBinary = binaryText.length.toString(2).padStart(32, '0');
      const fullBinary = lengthBinary + binaryText;

      if (fullBinary.length > data.length * 3) { // 3 channels (RGB) per pixel
        reject(new Error('Text is too long for this image'));
        return;
      }

      let binaryIndex = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (binaryIndex >= fullBinary.length) break;

        // Modify Red
        if (binaryIndex < fullBinary.length) {
          data[i] = (data[i] & 0xFE) | parseInt(fullBinary[binaryIndex], 10);
          binaryIndex++;
        }
        // Modify Green
        if (binaryIndex < fullBinary.length) {
          data[i + 1] = (data[i + 1] & 0xFE) | parseInt(fullBinary[binaryIndex], 10);
          binaryIndex++;
        }
        // Modify Blue
        if (binaryIndex < fullBinary.length) {
          data[i + 2] = (data[i + 2] & 0xFE) | parseInt(fullBinary[binaryIndex], 10);
          binaryIndex++;
        }
        // Alpha (i+3) is left alone
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png')); // Must be PNG to be lossless
      URL.revokeObjectURL(url);
    };
    img.onerror = (err) => reject(err);
  });
};

export const decode = async (imageFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let extractedBits = '';
      
      // We need 32 bits for length
      for (let i = 0; i < data.length; i += 4) {
        if (extractedBits.length >= 32) break;
        
        // Red
        if (extractedBits.length < 32) extractedBits += (data[i] & 1).toString();
        // Green
        if (extractedBits.length < 32) extractedBits += (data[i+1] & 1).toString();
        // Blue
        if (extractedBits.length < 32) extractedBits += (data[i+2] & 1).toString();
      }
      
      const messageLength = parseInt(extractedBits, 2);
      if (isNaN(messageLength) || messageLength < 0 || messageLength > data.length * 3) {
         // Likely not a stego image or corrupted
         resolve(''); // Or reject, but empty string is safer for UI
         return;
      }

      // Now read the message
      let messageBits = '';
      
      const totalBitsNeeded = 32 + messageLength;
      let bitsRead = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        if (bitsRead >= totalBitsNeeded) break;
        
        // Red
        if (bitsRead < totalBitsNeeded) {
            if (bitsRead >= 32) messageBits += (data[i] & 1).toString();
            bitsRead++;
        }
        // Green
        if (bitsRead < totalBitsNeeded) {
            if (bitsRead >= 32) messageBits += (data[i+1] & 1).toString();
            bitsRead++;
        }
        // Blue
        if (bitsRead < totalBitsNeeded) {
            if (bitsRead >= 32) messageBits += (data[i+2] & 1).toString();
            bitsRead++;
        }
      }

      // Convert binary to text (UTF-16)
      let decodedText = '';
      for (let i = 0; i < messageBits.length; i += 16) {
        const charCode = parseInt(messageBits.substr(i, 16), 2);
        if (charCode === 0) break; // Null terminator if we used one (we didn't, but good practice)
        decodedText += String.fromCharCode(charCode);
      }

      resolve(decodedText);
      URL.revokeObjectURL(url);
    };
    img.onerror = (err) => reject(err);
  });
};
