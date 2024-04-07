// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/assets/style.scss"],
  ssr: false,
  plugins: [
    {
      src: "plugins/useBootstrap.client.ts",
      mode: "client",
    },
    '~/plugins/bs-tooltips.js'
  ],
  modules: ["@pinia/nuxt", "@bootstrap-vue-next/nuxt"],
  runtimeConfig: {
    public: {
      NETWORK_CHAIN_ID: process.env.NUXT_ENV_NETWORK_CHAIN_ID || "412346",
      NETWORK_RPC_URL: process.env.NUXT_ENV_NETWORK_RPC_URL || "http://localhost:42069",
      NETWORK_EXPLORER_URL: process.env.NUXT_ENV_NETWORK_EXPLORER_URL || "https://your.explorer.url.here",
      BACKEND_SERVICE_URL: process.env.NUXT_ENV_BACKEND_SERVICE_URL || "http://localhost:1337",
      FHE_TOKEN_CONTRACT_ADDRESS: process.env.NUXT_ENV_FHE_TOKEN_CONTRACT_ADDRESS || "0x47b8399a8A3aD9665e4257904F99eAFE043c4F50"
    },
  },
});
