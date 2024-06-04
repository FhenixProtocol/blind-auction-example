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
      
      NETWORK_CHAIN_NANE: process.env.NUXT_ENV_NETWORK_CHAIN_NAME || "Fhenix Helium",
      NETWORK_CHAIN_ID: process.env.NUXT_ENV_NETWORK_CHAIN_ID || "8008135",
      NETWORK_RPC_URL: process.env.NUXT_ENV_NETWORK_RPC_URL || "https://api.helium.fhenix.zone",
      NETWORK_EXPLORER_URL: process.env.NUXT_ENV_NETWORK_EXPLORER_URL || "https://explorer.helium.fhenix.zone",
      BACKEND_SERVICE_URL: process.env.NUXT_ENV_BACKEND_SERVICE_URL || "https://auction-db.fhenix.zone",
      FHE_TOKEN_CONTRACT_ADDRESS: process.env.NUXT_ENV_FHE_TOKEN_CONTRACT_ADDRESS || "0xd212d1e279780e7Be3f14Cdc8804fC00A239036A"
    },
  },
});
