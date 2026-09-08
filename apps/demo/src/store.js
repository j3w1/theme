import { reactive } from "vue";
export const recordKinds = { products: { title: "Products", singular: "Product", metric: "Price", unit: "$" }, orders: { title: "Orders", singular: "Order", metric: "Total", unit: "$" }, customers: { title: "Customers", singular: "Customer", metric: "Lifetime value", unit: "$" }, users: { title: "Users", singular: "User", metric: "Projects", unit: "" }, invoices: { title: "Invoices", singular: "Invoice", metric: "Amount", unit: "$" } };
const names = ["Atlas", "Orion", "Field notes", "Signal", "Index", "Meridian", "Lumen", "Northstar"];
const seed = () => ({
  records: Object.fromEntries(Object.keys(recordKinds).map((kind, offset) => [kind, names.map((name, index) => ({ id: String(index + 1).padStart(3, "0"), name: kind === "users" || kind === "customers" ? ["Avery Kim", "Jordan Lee", "Morgan Noor", "Riley Stone", "Taylor Quinn", "Casey Lane", "Alex Park", "Rowan Ellis"][index] : `${name} ${recordKinds[kind].singular.toLowerCase()}`, owner: ["Avery Kim", "Jordan Lee", "Morgan Noor"][index % 3], status: ["Ready", "In progress", "Review"][index % 3], amount: kind === "users" ? index + 2 : (index + 1) * 125 + offset * 30, note: "Independently authored synthetic demonstration record." }))])),
  tasks: [{ id: 1, name: "Review native form flow", status: "Ready" }, { id: 2, name: "Compose the project page", status: "In progress" }, { id: 3, name: "Verify keyboard navigation", status: "Review" }],
  messages: [{ id: 1, person: "Avery Kim", text: "The component review is ready.", self: false }, { id: 2, person: "You", text: "I will check the keyboard flow next.", self: true }],
  mail: [{ id: 1, from: "Avery Kim", subject: "Component review", body: "The latest local component review is ready. Please check the form and navigation states.", read: false, archived: false }, { id: 2, from: "Morgan Noor", subject: "Workspace notes", body: "The sample workspace now includes records, charts and a complete native form.", read: true, archived: false }],
  events: [{ id: 1, day: 8, title: "Design review" }, { id: 2, day: 14, title: "Component workshop" }, { id: 3, day: 23, title: "Release rehearsal" }],
  profile: { name: "Jordan Lee", email: "jordan@example.test", role: "Editor", notifications: true },
  notice: "", epoch: 0,
});
export const state = reactive(seed());
export function reset() { const epoch = state.epoch + 1; Object.assign(state, seed(), { epoch, notice: "Demo reset to its original local data." }); }
export const notify = message => { state.notice = message; };
export const nextId = rows => String(Math.max(0, ...rows.map(row => Number(row.id))) + 1).padStart(3, "0");
