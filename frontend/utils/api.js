const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res  = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API error");
  return data;
}

export const api = {
  // Prices
  getGoldPrice: ()           => request("/api/gold-price"),

  // Portfolio
  getBalance:   (address)    => request(`/api/balance/${address}`),
  getInterest:  (address)    => request(`/api/interest/${address}`),

  // KYC
  checkKYC:     (address)    => request(`/api/whitelist/status/${address}`),
  submitKYC:    (body)       => request("/api/whitelist/verify", {
    method: "POST", body: JSON.stringify(body)
  }),

  // Mint
  mintBond:     (body)       => request("/api/mint", {
    method: "POST", body: JSON.stringify(body)
  }),

  // Marketplace
  getListings:  ()           => request("/api/marketplace/listings"),
  getListing:   (id)         => request(`/api/marketplace/listing/${id}`),
};
