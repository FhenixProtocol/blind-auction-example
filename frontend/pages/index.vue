<template>
  <AddProductModal
    v-model="state.isCreateAuctionModalVisible"
    v-if="state.isCreateAuctionModalVisible"
    :onSuccess="refreshProducts"
  />
  <BContainer>
    <BRow>
      <div class="header">
        <h1>Welcome to the Jungle</h1>
      </div>
    </BRow>
    <BRow class="m-md-3 align-items-center">
      <BCol>
        <h5>Token: {{ ethAddressShortener(state.tokenAddress) }}</h5>
      </BCol>
      <BCol>
        <h5>Balance: {{ state.tokenBalance }} FHE</h5>
      </BCol>
      <BCol>
        <h5>{{ ethAddressShortener(address) }}</h5>
      </BCol>
      <BCol>
        <BButton pill variant="outline-success" @click="fnxConnect" :disabled="isItFhenixNetwork">
          {{ isItFhenixNetwork ? "Connected" : "Connect to Fhenix Network" }}
        </BButton>
        <BButton
          class="m-md-2"
          v-if="isItFhenixNetwork"
          pill
          variant="success"
          @click="mintEncryptedAndRefresh"
          :disabled="!isItFhenixNetwork"
        >
          {{ "Mint 10 Tokens" }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <div class="auctionsFrame">
        <h2 class="m-md-3">My Auctions</h2>
        <AuctionTable :items="state.myProducts" :loading="state.loading" :on-done="refreshAll" />
      </div>
    </BRow>
    <BRow>
      <div class="auctionsFrame">
        <h2 class="m-md-3">Other Auctions</h2>
        <AuctionTable :items="state.theirProducts" :loading="state.loading" :on-done="refreshAll" />
      </div>
    </BRow>
    <BRow>
      <div class="createAuctionButton m-md-3">
        <BButton pill variant="primary" @click="showModal">Create Auction</BButton>
      </div>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import useChain from "~/composables/useChain";
import useBackend from "~/composables/useBackend";
import AuctionTable from "~/components/AuctionTable.vue";
import AddProductModal from "~/components/AddProductModal.vue";
import { type AuctionType, ethAddressShortener } from "~/utils/utils";

const { address, fnxConnect, isItFhenixNetwork, getTokenBalance, tokenAddress, mintEncrypted } = useChain();
const { getMyProducts, getTheirProducts } = useBackend();

onMounted(async () => {
  if (!isItFhenixNetwork.value) {
    await fnxConnect();
    refreshTokenBalance();
  }
});

const state = reactive({
  isModalVisible: false,
  isCreateAuctionModalVisible: false,
  loading: false,
  tokenAddress,
  tokenBalance: "",
  myProducts: [<AuctionType>{ name: "", owner: "", dueTime: "", winningPrice: 0, winner: "", contract: "" }],
  theirProducts: [<AuctionType>{ name: "", owner: "", dueTime: "", winningPrice: 0, winner: "", contract: "" }],
});

function showModal() {
  state.isCreateAuctionModalVisible = true;
}

async function refreshAll() {
  await refreshTokenBalance();
  await refreshProducts();
}

async function refreshTokenBalance() {
  state.tokenBalance = (await getTokenBalance()) || "0";
}

async function refreshProducts() {
  console.log(`refreshing`);
  try {
    state.loading = true;
    state.myProducts = await getMyProducts(address.value);
    state.theirProducts = await getTheirProducts(address.value);
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
  }
}

async function mintEncryptedAndRefresh() {
  await mintEncrypted();
  await refreshTokenBalance();
}

refreshProducts();
</script>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.auctionsFrame {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  margin-top: 20px;
}

.createAuctionButton {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin-top: 20px;
}
</style>
