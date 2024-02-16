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
      <BFormGroup class="mt-3" id="input-group-2" label="Auction Time:" label-for="auctionTime">
        <BFormInput
          type="number"
          class="form-control"
          id="auctionTime"
          v-model.number="state.dueTime"
          placeholder="Auction time in seconds"
        />
      </BFormGroup>
      <div class="d-grid gap-2 mt-3">
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
const { address, getProvider } = useChain();
const { hide } = useModalController();

const props = defineProps({
  onSuccess: {
    type: Function,
    required: false,
  },
});

// // Props received from parent
// const props = defineProps({
//   show: {
//     type: Boolean,
//     required: true,
//   },
// });

const state = reactive({ deploying: false, dueTime: 0, name: "" });

async function onSend() {
  state.deploying = true;
  try {
    console.log(`Posting product with ${state.name} and ${state.dueTime}`);

    const product = {
      name: state.name,
      owner: address.value,
      dueTime: state.dueTime,
      winningPrice: 0,
      winner: "None",
      contract: "",
    };

    let provider = getProvider();
    if (!provider) {
      console.error("No provider found");
    }

    const signer = await provider.getSigner();

    const contractFactory = new Auction__factory(AuctionArtifact.abi, AuctionArtifact.bytecode, signer);
    const contract = (await contractFactory.deploy(TokenContractDeployment.address, state.dueTime)) as Auction;

    console.log(`contract deployed at ${contract.target}`);

    product.contract = contract.target;

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
