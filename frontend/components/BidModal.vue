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
        <button type="submit" class="btn btn-primary">Submit Bid</button>
      </div>
    </form>
  </BModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AuctionArtifact from "~/contracts/Auction.json";
import ExampleToken from "~/contracts/FHERC20.json";
import useChain from "~/composables/useChain";
import { ethers } from "ethers";
import TokenContractDeployment from "~/contracts/FHERC20_DEPLOY.json";
import type { ExampleToken as TokenContract, Auction as AuctionContract } from "../../typechain-types";

const { getProvider } = useChain();
const { encrypt, encryptedText } = useFHE();

interface AuctionData {
  contract: string;
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

  let provider = getProvider();
  if (!provider) {
    console.error("No provider found");
  }

  const signer = await provider.getSigner();

  const contract = new ethers.Contract("0xCD40D5BC32240c5B8e2f3CFd780f0C4702F51b42", AuctionArtifact.abi, signer);
  const auctionWithSigner = contract.connect(signer) as AuctionContract;

  const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
  const tokenWithSigner = tokenContract.connect(signer) as TokenContract;

  await encrypt(bidAmount);

  if (encryptedText.value === "") {
    console.error("No input encrypted");
    return;
  }

  console.log(`approving for ${props.auctionData?.contract}`);

  let tx = await tokenWithSigner.approveEncrypted("0xCD40D5BC32240c5B8e2f3CFd780f0C4702F51b42", {
    data: encryptedText.value,
  });
  await tx.wait();

  tx = await auctionWithSigner.bid({ data: encryptedText.value });
  await tx.wait();

  console.log(`done bidding`);

  if (props.onDone) {
    props.onDone();
  }

  hide();
};
</script>

<style scoped>
/* Add custom styles here if needed, Bootstrap's styles are available globally */
</style>
