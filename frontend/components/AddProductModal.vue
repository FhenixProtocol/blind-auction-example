<template>
  <BModal title="Create New Auction" hideFooter>
    <BForm @submit.prevent="onSend">
      <BFormGroup id="input-group-1" label="Auction Item:" label-for="auctionItem">
        <input
          v-model="state.name"
          class="form-control"
          type="text"
          id="auctionItem"
          placeholder="Name of Product to Auction"
          required
        />
      </BFormGroup>
      <BFormGroup class="mt-3" id="input-group-2" label="Auction Time (seconds):" label-for="auctionTime">

        <div class="input-group mb-3">
          <BFormInput
          type="number"
          class="form-control"
          id="auctionTime"
          v-model.number="state.dueTime"
          placeholder="Auction time in seconds"
        />

        <div class="input-group-append" style="display: flex; gap: 2px">
          <button class="btn btn-sm btn-info" @click.prevent="state.dueTime = 5 * 60">5 min</button>
          <button class="btn btn-sm btn-info" @click.prevent="state.dueTime = 10 * 60">10 min</button>
          <button class="btn btn-sm btn-info" @click.prevent="state.dueTime = 60 * 60">1 hr</button>
          <button class="btn btn-sm btn-info" @click.prevent="state.dueTime = 24 * 60 * 60">24 hrs</button>
        </div>
      </div>

      </BFormGroup>
      <div class="d-grid gap-2 mt-3" style="display: flex; justify-content: center;">
        <BSpinner v-if="state.deploying" variant="primary" />
        <BButton v-else-if="!state.deploying" type="submit" variant="primary">Create Auction</BButton>
      </div>
    </BForm>
  </BModal>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { type Auction, Auction__factory } from "../../typechain-types";
import AuctionArtifact from "~/contracts/Auction.json";
import TokenContractDeployment from "~/contracts/FHERC20_DEPLOY.json";
import useChain from "~/composables/useChain";
import useBackend from "~/composables/useBackend";

const { setAuction } = useBackend();
const { address, deployAuctionContract } = useChain();
const { hide } = useModalController();

const props = defineProps({
  onSuccess: {
    type: Function,
    required: false,
  },
});

const state = reactive({ deploying: false, dueTime: 600, name: "" });

async function onSend() {
  state.deploying = true;
  try {
    console.log(`Posting product with ${state.name} and ${state.dueTime}`);

    const product = {
      name: state.name,
      owner: address.value,
      dueTime: state.dueTime,
      startDate: 0,
      winningPrice: 0,
      winner: "None",
      contract: "",
    };

    const contract = await deployAuctionContract(product.dueTime);
    product.contract = await contract.getAddress();
    product.startDate = Date.now();

    console.log(`Posting product with ${JSON.stringify(product)}`);
    await setAuction(JSON.stringify(product));

    if (props.onSuccess) {
      props.onSuccess();
    }
  } catch (err) {
    console.error(err);
  } finally {
    state.deploying = false;
    hide();
  }
}
</script>

<style scoped>
/* Add custom styles here if needed, Bootstrap's styles are available globally */
</style>
