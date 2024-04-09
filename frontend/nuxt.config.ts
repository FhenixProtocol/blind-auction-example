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
      
      NETWORK_CHAIN_BANE: process.env.NUXT_ENV_NETWORK_CHAIN_NAME || "Fhenix Network",
      NETWORK_CHAIN_ID: process.env.NUXT_ENV_NETWORK_CHAIN_ID || "42069",
      NETWORK_RPC_URL: process.env.NUXT_ENV_NETWORK_RPC_URL || "https://api.testnet.fhenix.zone:7747",
      NETWORK_EXPLORER_URL: process.env.NUXT_ENV_NETWORK_EXPLORER_URL || "https://explorer.testnet.fhenix.zone",
      BACKEND_SERVICE_URL: process.env.NUXT_ENV_BACKEND_SERVICE_URL || "https://auction-db.fhenix.zone",
      FHE_TOKEN_CONTRACT_ADDRESS: process.env.NUXT_ENV_FHE_TOKEN_CONTRACT_ADDRESS || "0x2cc42F00be0fE77FF5Ba18e6e039f373e62c13F2"
    },
  },
});
