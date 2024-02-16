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
    <BRow>
      <div class="auctionsFrame">
        <h2 class="m-md-3">My Auctions</h2>
        <AuctionTable :items="state.myProducts" :loading="state.loading" />
      </div>
    </BRow>
    <BRow>
      <div class="auctionsFrame">
        <h2 class="m-md-3">Other Auctions</h2>
        <AuctionTable :items="state.theirProducts" :loading="state.loading" />
      </div>
    </BRow>
    <BRow>
      <div class="createAutionButton m-md-3">
        <BButton pill variant="primary" @click="showModal">Create Auction</BButton>
      </div>
    </BRow>
  </BContainer>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import useChain from "~/composables/useChain";
import useBackend from "~/composables/useBackend";
import AuctionTable from "~/components/AuctionTable.vue";
import AddProductModal from "~/components/AddProductModal.vue";

const router = useRouter();
const config = useRuntimeConfig();
const { address } = useChain();
const { getMyProducts, getTheirProducts } = useBackend();

const state = reactive({
  isModalVisible: false,
  isCreateAuctionModalVisible: false,
  loading: false,
  myProducts: [{ name: "", owner: "", dueTime: "", winningPrice: 0, winner: "", contract: "" }],
  theirProducts: [{ name: "", owner: "", dueTime: "", winningPrice: 0, winner: "", contract: "" }],
});

function showModal() {
  state.isCreateAuctionModalVisible = true;
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

.createAutionButton {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin-top: 20px;
}
</style>
