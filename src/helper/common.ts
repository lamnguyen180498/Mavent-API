import crypto from 'crypto';
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import { LocalStorageAdapter } from '@flystorage/local-fs';
import { FileStorage } from '@flystorage/file-storage';
import slug from 'slug';
import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

interface EncryptedData {
  iv: string;
  content: string;
}

export const generateRandomPin = () => {
  let pin = '';
  for (let i = 0; i < 6; i++) {
    // Tạo số ngẫu nhiên từ 0 đến 9
    const randomNumber = Math.floor(Math.random() * 10);
    // Thêm số vào chuỗi mã PIN
    pin += randomNumber;
  }
  return pin;
};

export const extractBeforeEmail = (text: string) => {
  const match = text.match(/([^@]+)@/);
  return match ? match[1] : null;
};

export const isPrimaryCluster = () => {
  return (
    process.env.APP_CLUSTER === 'true' && process.env.name.includes('primary')
  );
};

/**
 * Mã hóa một chuỗi văn bản bằng AES-256-CBC.
 * @param {string} text - Chuỗi cần mã hóa.
 * @param {Buffer | string} key - Khóa bí mật (32 bytes). Nếu truyền string, sẽ tự động chuyển thành Buffer (utf8).
 * @returns {{ iv: string, content: string }} - Trả về IV và dữ liệu đã mã hóa (base64).
 */
export function encryptAES(text: string, key: Buffer | string): EncryptedData {
  const secretKey = typeof key === 'string' ? Buffer.from(key, 'utf8') : key;
  if (secretKey.length !== 32) {
    throw new Error('Khóa phải có độ dài 32 bytes (256 bit)');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  return {
    iv: iv.toString('base64'),
    content: encrypted.toString('base64'),
  };
}

/**
 * Giải mã chuỗi đã mã hóa bởi encryptAES.
 * @param {{ iv: string, content: string }} encrypted - Đối tượng trả về từ encryptAES.
 * @param {Buffer | string} key - Khóa bí mật (32 bytes).
 * @returns {string} - Chuỗi gốc sau giải mã.
 */
export function decryptAES(
  encrypted: EncryptedData,
  key: Buffer | string,
): string {
  const secretKey = typeof key === 'string' ? Buffer.from(key, 'utf8') : key;
  if (secretKey.length !== 32) {
    throw new Error('Khóa phải có độ dài 32 bytes (256 bit)');
  }

  const iv = Buffer.from(encrypted.iv, 'base64');
  const encryptedText = Buffer.from(encrypted.content, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export const uploadFile = async (
  file: Express.Multer.File,
  nameFile?: string,
  destinationFolder?: string,
) => {
  if (destinationFolder) {
    destinationFolder = destinationFolder
      .replace(/^\/|\/$/g, '')
      .replace(/[^a-zA-Z0-9-_/]/g, '');
  }
  const rootDirectory = resolve(
    process.cwd(),
    `storage/app/public${destinationFolder ? `/${destinationFolder}` : ''}`,
  );
  let name = nameFile
    ? nameFile
    : file.originalname.split('.').slice(0, -1).join('.');
  name = slug(name);
  mkdirSync(rootDirectory, { recursive: true });
  const adapter = new LocalStorageAdapter(rootDirectory);
  const fileStorage = new FileStorage(adapter);
  const extension = file.originalname.split('.').pop();
  const fileName = `${name}.${extension}`;
  await fileStorage.write(`${name}.${extension}`, file.buffer);
  return `${destinationFolder ? `${destinationFolder}/` : ''}${fileName}`;
};

export const deleteFile = async (path: string | string[]) => {
  const rootDirectory = resolve(process.cwd(), 'storage/app/public');
  const adapter = new LocalStorageAdapter(rootDirectory);
  const fileStorage = new FileStorage(adapter);
  if (path instanceof String || typeof path === 'string') {
    await fileStorage.deleteFile(path.toString());
  } else if (path instanceof Array) {
    for (const p of path) {
      await fileStorage.deleteFile(p);
    }
  }
};

export const validateImageFile = (
  file: Express.Multer.File,
  fieldName = 'file',
  maxSizeMB = 2,
) => {
  const constraints: Record<string, string> = {};

  if (!file.mimetype.startsWith('image/')) {
    constraints['isImage'] = `${fieldName} phải là ảnh hợp lệ`;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    constraints['maxFileSize'] = `${fieldName} phải nhỏ hơn ${maxSizeMB}MB`;
  }

  if (Object.keys(constraints).length > 0) {
    const error: ValidationError = {
      property: fieldName,
      constraints,
      children: [],
    };

    throw new BadRequestException([error]);
  }
};
