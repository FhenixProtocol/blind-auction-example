<template>
  <div>
    <div class="addproduct__container">
      <h2>Add a new product</h2>
      <div class="addProduct__form">
        <input
          v-model="state.name"
          class="form-control"
          type="text"
          placeholder="Name of Product to Auction"
          required
        />
        <!--        <input v-model="dueTime" type="time" required />-->
        <input
          v-model="state.dueTime"
          class="form-control"
          type="number"
          placeholder="Auction time in seconds"
          required
        />
        <div v-if="!state.deploying">
          <button class="addProduct__cta" @click="onSend">Submit Auction</button>
        </div>
        <div v-if="state.deploying">
          <DotLoader />
        </div>
        <button class="addProduct__cta">
          <NuxtLink to="/home">Back Home!</NuxtLink>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import DotLoader from "~/components/DotLoader.vue";
import { type Auction, Auction__factory } from "../../typechain-types";
import AuctionArtifact from "~/contracts/Auction.json";
import TokenContractDeployment from "~/contracts/FHERC20_DEPLOY.json";
import axios from "axios";
import useChain from "~/composables/useChain";

const router = useRouter();
const { address, getProvider } = useChain();
const state = reactive({ deploying: false, dueTime: 0, name: "" });
const config = useRuntimeConfig();

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
    await axios.post(`http://localhost:1337/set`, JSON.stringify(product));
  } catch (err) {
    console.error(err);
  } finally {
    state.deploying = false;
  }
}
</script>

<!--<script lang="ts">-->
<!--// @ is an alias to /src-->
<!--import axios from "axios";-->

<!--import TokenContractDeployment from "../contracts/FHERC20_DEPLOY.json";-->
<!--import AuctionArtifact from "../contracts/Auction.json";-->
<!--import { Auction__factory, type Auction } from "../../typechain-types";-->
<!--import useChain from "~/composables/useChain";-->

<!--const { address, getProvider } = useChain();-->

<!--export default {-->
<!--  name: "Add",-->
<!--  setup() {-->
<!--    const deploying = ref(false);-->
<!--    const name = ref("");-->
<!--    const dueTime = ref(0);-->

<!--    async function-->

<!--    return { deploying, onSend, name, dueTime };-->
<!--  },-->
<!--};-->
<!--</script>-->
