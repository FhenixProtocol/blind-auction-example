import { ref } from "vue";

const { getFheClient } = useChain();

const encryptedText = ref<string>("");

export default function useFHE() {
  return { encrypt, encryptedText };
}

async function encrypt(element: HTMLInputElement | ref<string> | null | undefined) {
  try {
    if (element !== null && element.value !== "") {
      const value = Number(element.value);
      const fheClient = getFheClient();
      if (fheClient !== null) {
        // We use the default encrypt for the template, but you can use encrypt_uint8/16/32
        const uint8Array = (await fheClient.encrypt(value)).data;
        encryptedText.value = `0x${Array.from(uint8Array)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}`;
      } else {
        console.error("FHE client not initialized");
      }
    }
  } catch (err: any) {
    encryptedText.value = `Error: ${err.reason}`;
  }
}
