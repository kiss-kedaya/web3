import { Buffer } from 'buffer';

// Make Buffer available globally for libraries that expect it
globalThis.Buffer = Buffer;