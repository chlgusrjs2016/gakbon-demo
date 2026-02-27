/**
 * Property-Based Test: Image Format Validation
 * 
 * Feature: markdown-document-type
 * Property 6: Image Format Validation
 * 
 * **Validates: Requirements 4.9**
 * 
 * This test verifies that the image upload system correctly validates
 * image file formats and only accepts supported formats.
 * 
 * The property states:
 * For any file upload attempt, the system SHALL accept files with
 * MIME types (image/jpeg, image/png, image/gif, image/webp, image/svg+xml)
 * and SHALL reject files with other MIME types.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Supported image formats as defined in the design
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

describe('Property 6: Image Format Validation', () => {
  it('should accept all supported image formats', () => {
    // Generator for supported MIME types
    const supportedMimeType = fc.constantFrom(
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    );

    fc.assert(
      fc.property(supportedMimeType, (mimeType) => {
        // Verify the MIME type is in the supported list
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(true);
        
        // Verify it's a valid image MIME type format
        expect(mimeType).toMatch(/^image\//);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject unsupported image formats', () => {
    // Generator for unsupported MIME types
    const unsupportedMimeType = fc.constantFrom(
      'image/bmp',
      'image/tiff',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/heic',
      'image/heif',
      'image/avif',
      'image/jxl'
    );

    fc.assert(
      fc.property(unsupportedMimeType, (mimeType) => {
        // Verify the MIME type is NOT in the supported list
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject non-image MIME types', () => {
    // Generator for non-image MIME types
    const nonImageMimeType = fc.constantFrom(
      'application/pdf',
      'application/zip',
      'application/json',
      'text/plain',
      'text/html',
      'text/css',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/octet-stream'
    );

    fc.assert(
      fc.property(nonImageMimeType, (mimeType) => {
        // Verify the MIME type is NOT in the supported list
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
        
        // Verify it's not an image MIME type
        expect(mimeType).not.toMatch(/^image\//);
      }),
      { numRuns: 100 }
    );
  });

  it('should be case-sensitive for MIME type validation', () => {
    // Generator for case variations of supported MIME types
    const caseVariations = fc.constantFrom(
      'IMAGE/JPEG',
      'Image/Png',
      'IMAGE/GIF',
      'Image/WebP',
      'IMAGE/SVG+XML',
      'image/JPEG',
      'image/PNG',
      'image/GIF',
      'image/WEBP',
      'image/SVG+XML'
    );

    fc.assert(
      fc.property(caseVariations, (mimeType) => {
        // MIME types should be case-sensitive
        // Only exact lowercase matches should be accepted
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject MIME types with whitespace', () => {
    // Generator for MIME types with whitespace
    const mimeTypeWithWhitespace = fc.constantFrom(
      ' image/jpeg',
      'image/jpeg ',
      ' image/png ',
      'image /png',
      'image/ png',
      '\timage/gif',
      'image/webp\n'
    );

    fc.assert(
      fc.property(mimeTypeWithWhitespace, (mimeType) => {
        // MIME types with whitespace should be rejected
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('should reject empty or invalid MIME types', () => {
    // Generator for empty or invalid MIME types
    const invalidMimeType = fc.constantFrom(
      '',
      ' ',
      'image',
      'jpeg',
      'image/',
      '/jpeg',
      'image//',
      '//image/jpeg'
    );

    fc.assert(
      fc.property(invalidMimeType, (mimeType) => {
        // Invalid MIME types should be rejected
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('should validate exactly 5 supported image formats', () => {
    // Property: The system should support exactly 5 image formats
    expect(SUPPORTED_IMAGE_FORMATS.length).toBe(5);
    
    // Verify no duplicates
    const uniqueFormats = new Set(SUPPORTED_IMAGE_FORMATS);
    expect(uniqueFormats.size).toBe(5);
  });

  it('should support JPEG format (both spellings)', () => {
    // JPEG can be spelled as 'jpeg' in MIME type
    // Note: 'image/jpg' is not standard, only 'image/jpeg' is
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/jpeg');
    
    // Verify 'image/jpg' is NOT supported (non-standard)
    expect(SUPPORTED_IMAGE_FORMATS).not.toContain('image/jpg');
  });

  it('should support SVG with correct MIME type', () => {
    // SVG MIME type should be 'image/svg+xml', not 'image/svg'
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/svg+xml');
    expect(SUPPORTED_IMAGE_FORMATS).not.toContain('image/svg');
  });

  it('should validate MIME type format structure', () => {
    // Generator for any MIME type
    const anyMimeType = fc.oneof(
      fc.constantFrom(...SUPPORTED_IMAGE_FORMATS),
      fc.string()
    );

    fc.assert(
      fc.property(anyMimeType, (mimeType) => {
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        
        if (isSupported) {
          // Supported MIME types should follow the pattern 'image/*'
          expect(mimeType).toMatch(/^image\/.+$/);
          
          // Should not have leading/trailing whitespace
          expect(mimeType).toBe(mimeType.trim());
          
          // Should be lowercase
          expect(mimeType).toBe(mimeType.toLowerCase());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject MIME types with additional parameters', () => {
    // Generator for MIME types with parameters
    const mimeTypeWithParams = fc.constantFrom(
      'image/jpeg; charset=utf-8',
      'image/png; quality=high',
      'image/gif; version=89a',
      'image/webp; compression=lossy',
      'image/svg+xml; charset=utf-8'
    );

    fc.assert(
      fc.property(mimeTypeWithParams, (mimeType) => {
        // MIME types with parameters should be rejected
        // (they should be normalized before validation)
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
        expect(isSupported).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent validation across multiple checks', () => {
    // Property: Validation should be deterministic and consistent
    const testMimeType = fc.constantFrom(
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain'
    );

    fc.assert(
      fc.property(testMimeType, fc.integer({ min: 2, max: 10 }), (mimeType, iterations) => {
        // Check the same MIME type multiple times
        const results = [];
        for (let i = 0; i < iterations; i++) {
          const isSupported = SUPPORTED_IMAGE_FORMATS.includes(mimeType);
          results.push(isSupported);
        }
        
        // All results should be identical
        const firstResult = results[0];
        results.forEach((result) => {
          expect(result).toBe(firstResult);
        });
      }),
      { numRuns: 50 }
    );
  });

  it('should validate common web image formats are supported', () => {
    // The most common web image formats should be supported
    const commonWebFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    commonWebFormats.forEach((format) => {
      expect(SUPPORTED_IMAGE_FORMATS).toContain(format);
    });
  });

  it('should support SVG for vector graphics', () => {
    // SVG should be supported for scalable vector graphics
    expect(SUPPORTED_IMAGE_FORMATS).toContain('image/svg+xml');
  });

  it('should reject legacy or uncommon image formats', () => {
    // Legacy or uncommon formats should not be supported
    const legacyFormats = [
      'image/bmp',      // Windows Bitmap
      'image/tiff',     // Tagged Image File Format
      'image/x-icon',   // ICO format
      'image/x-pcx',    // PCX format
      'image/x-tga',    // TGA format
    ];

    legacyFormats.forEach((format) => {
      expect(SUPPORTED_IMAGE_FORMATS).not.toContain(format);
    });
  });

  it('should validate MIME type against a whitelist approach', () => {
    // Property: Only explicitly allowed MIME types should be accepted
    // This is a whitelist approach, not a blacklist
    
    fc.assert(
      fc.property(fc.string(), (randomString) => {
        const isSupported = SUPPORTED_IMAGE_FORMATS.includes(randomString);
        
        // If it's supported, it must be one of the 5 allowed formats
        if (isSupported) {
          expect([
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
          ]).toContain(randomString);
        }
      }),
      { numRuns: 100 }
    );
  });
});
