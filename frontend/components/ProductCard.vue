<template>
  <div class="card">
    <div v-if="MyAuction && !isWinner" style="position: absolute; top: -5px; right: -10px; z-index: 99">
      <div style="position: absolute; top: 40px; width: 100%; text-align: center; font-size: 12px;">My Auction</div>
      <div>
        <img src="@/assets/sticker-2.png" style="height: 100px;" />
      </div>
    </div>

    <div v-if="isWinner" style="position: absolute; top: -5px; right: -10px; z-index: 99">
      <div style="position: absolute; top: 40px; width: 100%; text-align: center; font-size: 12px;">Won</div>
      <div>
        <img src="@/assets/sticker-2.png" style="height: 100px;" />
      </div>
    </div>

    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px">{{ Product.name }}</div>
    <div style="height: 100px; width: 100%;  margin-bottom: 5px; position: relative;">
      <!-- <img src="@/assets/placeholder-1.webp" style="width: 100%;" /> -->
      <img v-if="!showCounter && Product.winner != '' && !noWinner" src="@/assets/completed.webp" style="height: 100px; position: absolute; top: -10px; z-index: 10" />
      <img v-if="noWinner" src="@/assets/expired.webp" style="height: 100px; position: absolute; top: -10px; z-index: 10" />
      <img :src="getImageSrc()" style="width: 100%;" :class="disablePic ? 'disable-image' : ''"/>
      
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 10px; margin-bottom: 10px; font-size: 22px;">
      <template v-if="showCounter">
        <div>Ends in:</div>
        <div style="font-family: 'Gill Sans', sans-serif">{{ countdownValue }}</div>
      </template>
      <template v-else>
        <div v-if="Product.winner == ''">Finalizing Stage</div>
        <div v-else>Auction Ended</div>
      </template>
    </div>

    <div style="font-size: 14px">
      <span style="color: orange">Auction Contract:</span> {{ ethAddressShortener(Product.contract) }}
      <button class="btn rounded-circle btn-xs" @click="copyToClipboard(Product.contract)"><i class="bi bi-copy"></i></button>
    </div>
    <div style="font-size: 14px">
      <span style="color: orange">Owner Address:</span> {{ ethAddressShortener(Product.owner) }}
      <button class="btn rounded-circle btn-xs" @click="copyToClipboard(Product.owner)"><i class="bi bi-copy"></i></button>
    </div>
    <div v-if="!noWinner && Product.winner != ''" style="font-size: 14px">
      <span style="color: orange">Winner:</span> {{ ethAddressShortener(Product.winner) }} ({{ Product.winningPrice.toFixed(3) }} wFHE) 
    </div>
    <div v-if="noWinner" style="font-size: 14px; color: orange">
      No Winner
    </div>
    <div v-if="Product.myBid != '-1'" style="font-size: 14px; margin-top: 5px; font-weight: bold">
      <span style="color: #d1adf7">My Bid:</span> {{ Product.myBid }} wFHE
    </div>

    <div style="flex: 1"></div>

    <transition-group name="fade" style="position: relative;" tag="div">
      <div v-if="showBid" key="showBid" style="position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-around; gap: 10px; width: 100%;">
        <template v-if="!bidWait">
          <input style="width: 100%" type="number" v-model="bid"  />
          <button class="btn btn-success btn-sm" @click="placeBid()" :disabled="bid =='' || bid < 0.1">Bid</button>
          <button class="btn btn-danger btn-sm"  @click="cancelBid()">Cancel</button>
        </template>
        <template v-else>
          <div id="loader-wrapper">
              <div id="loader"></div>
          </div>
        </template>
      </div>

      <div v-if="!showBid" key="notShowBid" style="position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: center;">
        <button  v-if="showCounter && !MyAuction" class="btn btn-success" @click="showBid = true" style="cursor: pointer; ">Place Bid</button>
        <button v-if="MyAuction && Product.winner == ''" class="btn btn-danger" @click="endBid()" style="cursor: pointer; ">Finalize Auction</button>
      </div>
    </transition-group>      
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-out, transform 1s ease-in-out;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>

<script setup lang="ts">
import { defineProps, reactive, computed  } from "vue";
import { type AuctionType, ethAddressShortener, copyToClipboard, formatTimeForCountdown } from "~/utils/utils";
const emit = defineEmits(['inFocus', 'submit'])
import useChain from "~/composables/useChain";
const { bidEncrypted, endAuction, address, NO_WINNER, TOKEN_UNITS, getTokenBalance } = useChain();

const props = defineProps({
  Product: {
    type: Object as () => AuctionType,
    default: () => ({}),
  },
  MyAuction: {
    type: Boolean,
    default: false,
  },
  Idx: {
    type: Number,
    default: 0,
  }
});

const disablePic = computed( () => {
  return !showCounter.value && (props.Product.winner != '' && props.Product.winner != "None");
  if (showCounter.value) {
    return false;
  } else if (props.Product.winner != '' && props.Product.winner != "None") {
    return true;
  }
  return false;
});

const isWinner = computed(() => {
  if (props.Product && props.Product.winner) {
    return props.Product.winner.toLowerCase() === address.value.toLowerCase();
  }
  return false;
});

const noWinner = computed( () => {
  return (props.Product.winner.toLowerCase() === NO_WINNER.toLowerCase());
})

const showCounter = ref(true);
const showBid = ref(false);
const bid = ref(0);
const bidWait = ref(false);


const countdownValue = ref("00:00:00");
let intervalId: any | null = null;

const state = reactive({
  isModalVisible: false,
});

const showModal = () => {
  state.isModalVisible = true;
};

function getImageSrc() {
  return `/images/placeholder-${((props.Idx % 3)+ 1)}.webp`;
}

async function placeBid() {
  const tokenBalance = await getTokenBalance() + "";
  if (parseFloat(tokenBalance) >= bid.value) {
    const normalValue = bid.value * TOKEN_UNITS;
    console.log("value", normalValue);  
    try {
      bidWait.value = true;
      bidEncrypted(props.Product.contract, normalValue).then((result) => { 
        showBid.value = false; 
        bidWait.value = false;
        emit('place-bid', props.Product.contract);
      });
    } catch (err) {
      bidWait.value = false;
      console.error(err);
    }
  } else {
    alert(`Your token balance is not enough (${tokenBalance} < ${bid.value})`);
  }
  

}

async function endBid() {
  try {
    const result = await endAuction(props.Product.contract);
    emit('end-bid', props.Product.contract);
  } catch (err) {
    console.error(err);
  }
}

function cancelBid() {
  showBid.value = false;
}


onMounted(async () => {
});

watch(() => props.Product, (newVal, oldVal) => {
  if (newVal !== undefined) {
    console.log(props.Product);
    if (props.Product.startDate && props.Product.dueTime) {
      const dueTimeMs = Number(props.Product.dueTime) * 1000;
      const endDate = props.Product.startDate + dueTimeMs;
      if (Date.now() < endDate) {
        if (props.Product.winner != '' && props.Product.winner != 'None') {
          showCounter.value = false;
        } else {
          intervalId = setInterval(function() {
            countdownValue.value = formatTimeForCountdown(Date.now(), props.Product.startDate + dueTimeMs);
            if (Date.now() > endDate && showCounter.value) {
                console.log("Clearing Timer");
                showCounter.value = false;
                clearInterval(intervalId);
            }
          }, 1000);
        }
      } else {
        showCounter.value = false;        
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
      }

    }
  }
}, { immediate: true }); // Use immediate: true to run the callback immediately with the current value


</script>