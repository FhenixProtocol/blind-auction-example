<template>
  <BModal title="Place Your Bid" hideFooter>
    <form @submit.prevent="hide">
      <div class="mb-3">
        <label for="auctionItem" class="form-label">Auction Item</label>
        <input type="text" class="form-control" id="auctionItem" v-model="auctionData.title" readonly />
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
        <button type="submit" class="btn btn-primary">Submit Bid</button>
      </div>
    </form>
  </BModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface AuctionData {
  title: string;
  // Add other properties of auctionData here with their types
}
// Ref for bid amount
const bidAmount = ref(0);
const state = reactive({ show: true });
const { hide } = useModalController();

// Props received from parent
const props = defineProps({
  auctionData: {
    type: Object as () => AuctionData,
    required: true,
  },
});

// Placeholder submit bid function
const submitBid = () => {
  // Placeholder: Implement your bid submission logic here
  console.log(`Bid of ${bidAmount.value} submitted for ${props.auctionData.title}`);
  // Reset bid amount after submission for demonstration purposes
  bidAmount.value = 0;
  hide();
};
</script>

<style scoped>
/* Add custom styles here if needed, Bootstrap's styles are available globally */
</style>
