<template>
  <AddProductModal
    v-model="state.isCreateAuctionModalVisible"
    v-if="state.isCreateAuctionModalVisible"
    :onSuccess="productAdded"
  />
  <BContainer>
    <BRow>
      <div class="header">
        <h1>Auction Demo</h1>
      </div>
    </BRow>

    <div style="display: flex; backdrop-filter: blur(7px); background-color: rgba(0,0,0,0.3); border-radius: 20px; padding: 10px; margin-bottom: 20px; filter: drop-shadow(1px 0 1px rgba(0,0,0,0.4));  ">
      <div>
        <div style="margin-bottom: 10px">
          <BButton class="btn-sm connect-btn" style="" pill @click="fnxConnect" :disabled="isItFhenixNetwork">
            {{ isItFhenixNetwork ? "Connected" : "Connect to Fhenix Network" }}
          </BButton>
          <div style="display: flex; align-items: center; font-size: 12px">
            <div v-if="address !== ''">Account address: {{ ethAddressShortener(address) }}</div>
            <button class="btn rounded-circle btn-xs" @click="copyToClipboard(address)"><i class="bi bi-copy" ></i></button>
          </div>
          <div style="display: flex; align-items: center; font-size: 12px">
            <div>Wallet balance: {{  balance }} tFHE</div>
            <BButton
              class="m-md-2 btn-xs"
              v-if="isItFhenixNetwork"
              pill
              variant="success"
              @click="goToFaucet();"
              :disabled="!isItFhenixNetwork"
            >
              Go to faucet
            </BButton>

          </div>
        </div>

        <div class="small-title">Auction Token:</div>
        <div style="display: flex; align-items: center; font-size: 12px">
          Address: {{ ethAddressShortener(state.tokenAddress) }} 
          <button class="btn rounded-circle btn-xs" @click="copyToClipboard(state.tokenAddress)"><i class="bi bi-copy" ></i></button>
        </div> 
        
        <div style="display: flex; align-items: center; font-size: 12px">
          <div style="margin-right: 4px">Balance:</div>
          <div v-if="minting">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>
            {{ state.tokenBalance }} wFHE
          </div>
          <BButton
            class="m-md-2 btn-xs"
            v-if="isItFhenixNetwork"
            pill
            variant="success"
            @click="wrapAndRefresh"
            :disabled="!isItFhenixNetwork || minting"
          >
            {{ minting ? "Wrapping..." : "Wrap 0.1 Tokens" }}
        </BButton>

        </div>
      </div>
      <div style="flex: 1"></div>
      <div style="margin-right: 10px">
        <div>Debug tools:</div>
        <button class="btn btn-primary" @click="clearDbAndRefresh()">Clear DB</button>
      </div>
    </div>

    <!-- <div style="height: 1px; background-color: rgba(255, 255, 255, 0.5); width: 100%; margin: 10px"></div> -->

    <div>
      <div style="display: flex; align-items: center;">
        <div class="small-title">Auctions</div>        
        <button class="btn btn-primary btn-sm" style="margin-left: 10px; padding: 2px 4px 2px 4px; border-radius: 10px; font-size: 12px" @click="showModal">Create New Auction</button>
      </div>
      <div style="margin-top: 10px; display: flex; gap: 20px">
        <template v-for="(product, index) in state.products">
          <product-card @end-bid="endBid" :Product="product" :Idx="index" :MyAuction="address.toLowerCase() == product.owner.toLowerCase()" @place-bid="placeBid" ></product-card>
        </template>
        
      </div>
    </div>

    <!-- <BRow>
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
    </BRow> -->
  </BContainer>
</template>

<script setup lang="ts">
import useChain from "~/composables/useChain";
import useBackend from "~/composables/useBackend";
import AuctionTable from "~/components/AuctionTable.vue";
import AddProductModal from "~/components/AddProductModal.vue";
import { type AuctionType, ethAddressShortener, copyToClipboard } from "~/utils/utils";

const { address, fnxConnect, isItFhenixNetwork, getTokenBalance, tokenAddress, mintEncrypted, getAuctionWinner, getMyBid, balance, getBalance, TOKEN_UNITS, wrap } = useChain();
const { getMyProducts, getTheirProducts, getAllProducts, clearDb } = useBackend();
//const { dark, toggleTheme } = useThemeToggle();

const minting = ref(false);

useHead({
  htmlAttrs: {
    'data-bs-theme': 'dark',
  },
});

onMounted(async () => {
  if (!isItFhenixNetwork.value) {
    await fnxConnect();
    refreshTokenBalance();
    refreshProducts();
  }
  //toggleTheme();
});

const state = reactive({
  isModalVisible: false,
  isCreateAuctionModalVisible: false,
  loading: false,
  tokenAddress,
  tokenBalance: "",
  products: [] as AuctionType[],
  myProducts: [] as AuctionType[],
  theirProducts: [] as AuctionType[],
});


function placeBid(address: string) {
  console.log("placeBid", address);
}

function showModal() {
  state.isCreateAuctionModalVisible = true;
}

function productAdded() {
  const doubleRefresh = (isFirst: boolean) => {
    refreshAll();
    if (isFirst) {
      setTimeout(function() { doubleRefresh(false) }, 1000);
    }
  }
  setTimeout(function() { doubleRefresh(true) }, 2000);
}

function clearDbAndRefresh() {
  clearDb();
  setTimeout(refreshAll, 1000);
}

function endBid() {
  setTimeout(refreshAll, 2000);  
}

async function refreshAll() {
  try { await refreshTokenBalance(); } catch (err) {}
  try { await refreshProducts(); } catch (err) {}
}

async function refreshTokenBalance() {
  try {
    state.tokenBalance = (await getTokenBalance()) || "0";
  } catch (err) {
    console.error(err);
    state.tokenBalance = "0";
  }
  
}

async function refreshProducts() {
  console.log(`refreshing`);
  try {
    state.loading = true;
    state.products = await getAllProducts();
    
    
    // In real world application, this should be done in the backend side
    for (var i = 0; i < state.products.length; i++) {
      try {
        const result = await getAuctionWinner(state.products[i].contract);
        if (result) {
          state.products[i].winner = result.address;
          state.products[i].winningPrice = result.bid / TOKEN_UNITS;
        }
      } catch (err) {}

      try {
        const bid = await getMyBid(state.products[i].contract);
        state.products[i].myBid = bid === '-1' ? bid : (Number(bid) / TOKEN_UNITS).toFixed(3);
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
  }
}

function goToFaucet() {
  window.open('https://faucet.fhenix.zone', '_blank');
}
async function mintEncryptedAndRefresh() {
  minting.value = true;
  await mintEncrypted();
  await refreshTokenBalance();
  minting.value = false;
}

async function wrapAndRefresh() {
  minting.value = true;
  await wrap();
  await refreshTokenBalance();
  balance.value = await getBalance();
  minting.value = false;
}

watch(() => address.value, (newVal, oldVal) => {
  refreshAll();
});

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
