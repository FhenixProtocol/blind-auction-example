<template>
  <div class="table__container">
    <table>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key">{{ header.label }}</th>
          <th>My Bid</th>
          <th>Bid</th>
          <th>End</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">Loading...</template>
        <template v-else-if="items.length === 0">
          <tr>
            <td colspan="8">No items found</td>
          </tr>
        </template>
        <template v-else>
          <tr v-for="(item, index) in items" :key="index">
            <td v-for="header in headers" :key="header.key">{{ item[header.key] }}</td>

            <td>
              <div v-if="state.myBids.hasOwnProperty(items[index].contract)">
                {{ state.myBids[items[index].contract] }}
              </div>
              <div v-else @click="getBidForContract(items[index].contract)">
                {{ "?" }}
              </div>
            </td>
            <td>
              <img variant="primary" @click="showModal" src="@/assets/bid.svg" class="editIcon" />
              <BidModal
                v-model="state.isModalVisible"
                :auctionData="{ contract: item.contract }"
                :on-done="doneAndUpdateBid"
              />
            </td>
            <td>
              <img variant="primary" @click="showModal" src="@/assets/cancel.svg" class="editIcon" />
              <BidModal
                v-model="state.isModalVisible"
                :auctionData="{ contract: item.contract }"
                :on-done="doneAndUpdateBid"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { defineProps, reactive } from "vue";
// Import your BidModal component if you're using it inside this component
import BidModal from "./BidModal";
import useChain from "~/composables/useChain";

import type { AuctionType } from "~/utils/utils";

const { getMyBid } = useChain();
// Define props for items, loading state, and headers for the table
const props = defineProps({
  items: {
    type: Array as () => AuctionType[],
    default: () => [],
  },
  loading: Boolean,
  onDone: { Function, required: false },
  headers: {
    type: Array,
    default: () => [
      { label: "Product", key: "name" },
      { label: "Owner", key: "owner" },
      { label: "Contract", key: "contract" },
      { label: "Due", key: "dueTime" },
      { label: "Winning Price", key: "winningPrice" },
      { label: "Winner", key: "winner" },
    ], // Use the default headers if none are provided
  },
});

const state = reactive({
  isModalVisible: false,
  myBids: props.items.map((item) => ({ [item.contract]: "" })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
});

const showModal = () => {
  state.isModalVisible = true;
};

const getBidForContract = async (contract: string) => {
  try {
    state.myBids[contract] = await getMyBid(contract);
  } catch (e) {
    console.error(`Error getting bid for contract ${contract}: ${e}`);
  }
};

const doneAndUpdateBid = async (contract: string) => {
  if (props.onDone) {
    props.onDone().then(await getBidForContract(contract));
  } else {
    await getBidForContract(contract);
  }
};

const doneAndUpdateWinner = async (contract: string) => {
  if (props.onDone) {
    props.onDone().then(await getBidForContract(contract));
  } else {
    await getBidForContract(contract);
  }
};
</script>

<style scoped>
/* Add your table styles here */
.editIcon {
  cursor: pointer;
}
</style>
