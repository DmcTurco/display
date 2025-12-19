import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import fse from 'fs-extra'

const outputDir = path.resolve(__dirname, '../../public_html/kitchen_display/tablet')
const backupDir = path.resolve(__dirname, '../../public_html/kitchen_display')
const htaccessPath = path.join(outputDir, '.htaccess')
const tempHtaccessPath = path.join(backupDir, '.htaccess.backup')

function preserveHtaccessPlugin() {
  return {
    name: 'preserve-htaccess',
    async buildStart() {
      if (fs.existsSync(htaccessPath)) {
        console.log('.htaccess を kitchen_display に退避中...')
        await fse.copy(htaccessPath, tempHtaccessPath)
      }
    },
    async closeBundle() {
      if (fs.existsSync(tempHtaccessPath)) {
        console.log('.htaccess を復元中...')
        await fse.copy(tempHtaccessPath, htaccessPath)
        await fse.remove(tempHtaccessPath)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), preserveHtaccessPlugin()],
  base: '/kitchen_display/tablet/',
  assetsInclude: ['**/*.mp3'],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: outputDir,
    emptyOutDir: true,
  }
})
