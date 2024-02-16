import axios from "axios";

const config = useRuntimeConfig();

async function getMyProducts(address: string) {
  console.log(`hello from getMyProducts`);
  return JSON.parse((await axios.get(getMyAuctionUrl(address))).data.output);
}

async function getTheirProducts(address: string) {
  return JSON.parse((await axios.get(getTheirAuctionUrl(address))).data.output);
}

async function setAuction(data: any) {
  return await axios.post(setAuctionUrl(), data);
}

export default function useBackend() {
  return {
    getMyProducts,
    getTheirProducts,
    setAuction,
  };
}

function setAuctionUrl() {
  return `${config.public.BACKEND_SERVICE_URL}/set`;
}

function getTheirAuctionUrl(address: string) {
  return `${config.public.BACKEND_SERVICE_URL}/get-their?owner=${address}`;
}

function getMyAuctionUrl(address: string) {
  return `${config.public.BACKEND_SERVICE_URL}/get-my?owner=${address}`;
}
