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
  ],
  modules: ["@pinia/nuxt", "@bootstrap-vue-next/nuxt"],
  runtimeConfig: {
    public: {
      NETWORK_CHAIN_ID: process.env.NUXT_ENV_NETWORK_CHAIN_ID || "412346",
      NETWORK_RPC_URL: process.env.NUXT_ENV_NETWORK_RPC_URL || "http://localhost:42069",
      NETWORK_EXPLORER_URL: process.env.NUXT_ENV_NETWORK_EXPLORER_URL || "https://your.explorer.url.here",
      BACKEND_SERVICE_URL: process.env.NUXT_ENV_BACKEND_SERVICE_URL || "http://localhost:1337",
    },
  },
});
