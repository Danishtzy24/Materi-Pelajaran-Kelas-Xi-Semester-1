import { defineConfig } from 'vite';
const headers={'Cache-Control':'no-store','X-Web-Utama-Version':'links-complete-1.3'};
export default defineConfig({base:'./',server:{host:'0.0.0.0',allowedHosts:true,headers},preview:{host:'0.0.0.0',allowedHosts:true,headers},build:{target:'es2022'}});
