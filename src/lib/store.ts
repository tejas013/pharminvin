import {
  DigitalPrescription,
  InventoryBatch,
  RestockOrder,
  StorageZone,
  Supplier,
} from "@/types/pharminvin";
import {
  getInitialInventory,
  getInitialOrders,
  getInitialPrescriptions,
  getInitialStorageZones,
  getInitialSuppliers,
} from "./seedData";

interface ServerStore {
  inventory: InventoryBatch[];
  storageZones: StorageZone[];
  suppliers: Supplier[];
  orders: RestockOrder[];
  prescriptions: DigitalPrescription[];
}

const globalForStore = globalThis as unknown as {
  __pharminvinStore?: ServerStore;
};

export function getServerStore(): ServerStore {
  if (!globalForStore.__pharminvinStore) {
    globalForStore.__pharminvinStore = {
      inventory: getInitialInventory(),
      storageZones: getInitialStorageZones(),
      suppliers: getInitialSuppliers(),
      orders: getInitialOrders(),
      prescriptions: getInitialPrescriptions(),
    };
  }
  return globalForStore.__pharminvinStore;
}
