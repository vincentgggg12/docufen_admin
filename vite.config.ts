import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import fs from "fs"
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from "vite"

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// })

const certDir = process.env.D_CERTS || '/Users/vgmini/certs/'
const local = process.env.LOCAL || false

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/', // Use absolute path for Azure Static Web App deployment
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          // {
          //   src: 'locales', // source folder
          //   dest: ''        // output at dist root (adjust if needed)
          // },
          {
            src: "staticwebapp.config.json", // source folder
            dest: ""       // output at dist root (adjust if needed)
          }
        ]
      }),
    ],
    build: {
      minify: 'esbuild', // Use esbuild for minification (default, faster)
      rollupOptions: {
        external: ["@aws-sdk/client-s3", "unzipper"],
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Source maps - set to false for production to hide source code
      sourcemap: false,
    },
      ...(!isProd && {
      server: {
        port: 3070,
        https: {
          key: fs.readFileSync(path.join(certDir, 'localhost.key')),
          cert: fs.readFileSync(path.join(certDir, 'localhost.crt'))
        },
        fs: {
          strict: true,
          deny: [".git", "node_modules", "playwright/**", ".env", ".env.local", ".env.development.local", ".env.production.local"]
        }
      }
    }),
    // Add HTTPS configuration for the preview server
    ...(local && {
      preview: {
        port: 3070,
        strictPort: true, // This will fail if port 3070 is already in use
        https: {
          key: fs.readFileSync(path.join(certDir, 'localhost.key')),
          cert: fs.readFileSync(path.join(certDir, 'localhost.crt'))
        }
      }
    })
  }
})
