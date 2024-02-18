<template>
  <BModal title="Place Your Bid" hideFooter>
    <form @submit.prevent="submitBid">
      <div class="mb-3">
        <label for="auctionItem" class="form-label">Auction Item</label>
        <input type="text" class="form-control" id="auctionItem" v-model="auctionData.contract" readonly />
      </div>
      <div class="mb-3">
        <label for="bidAmount" class="form-label">Bid Amount</label>
        <input
          type="number"
          class="form-control"
          id="bidAmount"
          v-model.number="bidAmount"
          placeholder="Enter your bid"
        />
      </div>
      <div class="d-grid gap-2">
        <button v-if="!state.loading" type="submit" class="btn btn-primary">Submit Bid</button>
        <button v-else class="btn btn-primary" :disabled="true"><BSpinner /></button>
      </div>
    </form>
  </BModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import useChain from "~/composables/useChain";

const { bidEncrypted } = useChain();

interface AuctionData {
  contract: string;
  // Add other properties of auctionData here with their types
}
// Ref for bid amount
const bidAmount = ref(0);
const state = reactive({ loading: false });
const { hide } = useModalController();

// Props received from parent
const props = defineProps({
  auctionData: {
    type: Object as () => AuctionData,
    required: true,
  },
  onDone: {
    type: Function,
    required: false,
  },
});

// Placeholder submit bid function
const submitBid = async () => {
  // Placeholder: Implement your bid submission logic here
  // console.log(`Bid of ${bidAmount.value} submitted for ${props.auctionData.title}`);
  // Reset bid amount after submission for demonstration purposes
  if (!props.auctionData?.contract) {
    console.error(`Auction contract address not provided`);
    return;
  }
  state.loading = true;

  try {
    await bidEncrypted(props.auctionData?.contract, bidAmount.value);
    console.log(`done bidding`);
  } catch (e) {
    console.error(`Error submitting bid: ${e}`);
  } finally {
    state.loading = false;
    if (props.onDone) {
      props.onDone();
    }
    hide();
  }
};
</script>

<style scoped>
/* Add custom styles here if needed, Bootstrap's styles are available globally */
</style>
