const CJK = /\p{Script=Hangul}|\p{Script=Han}/u;
const HANGUL = /\p{Script=Hangul}/u;
const HAN = /\p{Script=Han}/u;

export function hasCjk(text: string) {
  return CJK.test(text);
}

export function hasHangul(text: string) {
  return HANGUL.test(text);
}

export function hasHan(text: string) {
  return HAN.test(text);
}
