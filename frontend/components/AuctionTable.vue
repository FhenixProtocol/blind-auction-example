<template>
  <div class="table__container">
    <table>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key">{{ header.label }}</th>
          <th>Act</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">Loading...</template>
        <template v-else-if="items.length === 0">
          <tr>
            <td colspan="7">No items found</td>
          </tr>
        </template>
        <template v-else>
          <tr v-for="(item, index) in items" :key="index">
            <td v-for="header in headers" :key="header.key">{{ item[header.key] }}</td>
            <td>
              <img variant="primary" @click="showModal" src="@/assets/bid.svg" class="editIcon" />
              <BidModal v-model="state.isModalVisible" :auctionData="{ contract: item.contract }" :on-done="onDone" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, reactive } from "vue";
// Import your BidModal component if you're using it inside this component
import BidModal from "./BidModal";

// Define props for items, loading state, and headers for the table
const props = defineProps({
  items: {
    type: Array,
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
});

const showModal = () => {
  state.isModalVisible = true;
};
</script>

<style scoped>
/* Add your table styles here */
.editIcon {
  cursor: pointer;
}
</style>
