import "server-only";
import { DemoMarketplace } from "../marketplace-service";

const demoGlobal = globalThis as typeof globalThis & {
  tolongMarketplace?: DemoMarketplace;
};
// Keep demo activity through local hot reloads, but never imply durable storage.
export const marketplace = (demoGlobal.tolongMarketplace ??=
  new DemoMarketplace());
