export function ethAddressShortener(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface AuctionType {
  name: string;
  owner: string;
  dueTime: string;
  winningPrice: number;
  winner: string;
  contract: string;
}
