import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet (no 0/O, 1/l/I confusion).
const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

/** Generate a 24-character unguessable URL token. */
export const generateToken = customAlphabet(alphabet, 24);
