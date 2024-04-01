import axios from "axios";

const config = useRuntimeConfig();

async function getAllProducts() {
  return JSON.parse((await axios.get(getAllAuctionUrl())).data.output);
}

async function getMyProducts(address: string) {
  return JSON.parse((await axios.get(getMyAuctionUrl(address))).data.output);
}

async function getTheirProducts(address: string) {
  return JSON.parse((await axios.get(getTheirAuctionUrl(address))).data.output);
}

async function setAuction(data: any) {
  return await axios.post(setAuctionUrl(), data);
}

async function clearDb() {
  console.log(`Clearing DB`);
  const a = await axios.get(clearUrl());
  console.log(a);
}


export default function useBackend() {
  return {
    getAllProducts,
    getMyProducts,
    getTheirProducts,
    setAuction,
    clearDb
  };
}

function setAuctionUrl() {
  return `${config.public.BACKEND_SERVICE_URL}/set`;
}

function getAllAuctionUrl() {
  return `${config.public.BACKEND_SERVICE_URL}/get-all`;
}


function getTheirAuctionUrl(address: string) {
  return `${config.public.BACKEND_SERVICE_URL}/get-their?owner=${address}`;
}

function getMyAuctionUrl(address: string) {
  return `${config.public.BACKEND_SERVICE_URL}/get-my?owner=${address}`;
}

function clearUrl() {
  return `${config.public.BACKEND_SERVICE_URL}/clear`;
}
