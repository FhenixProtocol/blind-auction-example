export function ethAddressShortener(address: string): string {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function copyToClipboard(str: string) {
  navigator.clipboard.writeText(str);
}

export function formatTimeForCountdown(startDate: number, endDate: number) {
  const difference = (endDate - startDate);
  if (difference <= 0) {
    return "00:00:00";
  }

  // Convert the difference to hours, minutes, and seconds
  let seconds = Math.floor((difference / 1000) % 60);
  let minutes = Math.floor((difference / (1000 * 60)) % 60);
  let hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  
  // Format each part to ensure it has two digits
  const sHours = (hours < 10) ? "0" + hours : hours;
  const sMinutes = (minutes < 10) ? "0" + minutes : minutes;
  const sSeconds = (seconds < 10) ? "0" + seconds : seconds;
  
  // Combine parts into a formatted string
  return sHours + ":" + sMinutes + ":" + sSeconds;
}


export interface AuctionType {
  name: string;
  owner: string;
  dueTime: string;
  startDate: number;
  winningPrice: number;
  winner: string;
  contract: string;
  myBid: string;
}
