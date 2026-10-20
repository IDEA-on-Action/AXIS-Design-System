// G2 하네스: client-loader 등록 (node --import <이 파일>)
import { register } from 'node:module';

register('./client-loader.mjs', import.meta.url);
