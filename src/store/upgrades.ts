import { PRODUCERS } from "./producers";
import type { Producer, Upgrade } from "./store";

export const UPGRADES: Upgrade[] = [
  {
        id: "sp_0",
        name: "Better Batteries",
        description: "Better batteries allows for more power to be stored, increasing energy output.",
        icon: "",
        
        cost: "750",
        category: 'efficiency',
        requires: [],
        producerBound: "0",
        effects: [
          {
            type: 'kwh_add',
            target: "0",
            value: "1"
          }
        ]
      }
]

export function getUpgradeByProducer(producerItemId?: string) {
  interface GroupedItem {
    producer: string, // ItemID,
    upgrades: Upgrade[]
  }

  const grouped: GroupedItem[] = []

  UPGRADES.forEach(upgrade => {
    const associatedProducer = upgrade.producerBound;
    if (!associatedProducer) return;

    const duplicate = grouped.find(item => item.producer === associatedProducer);
    if (duplicate) {
      duplicate.upgrades.push(upgrade);
    } else {
      grouped.push({ producer: associatedProducer, upgrades: [upgrade] })
    }
  })

  if (producerItemId) return grouped.find(item => item.producer === producerItemId);
  return grouped;
}

export function getAvailableUpgrades(ownedProducers: Producer[], ownedUpgrades: Upgrade[]) {
  return UPGRADES.filter(upg => {
    if (upg.requires.length === 0 && !upg.producerBound) return true;

    let available = true;
    for (const req in upg.requires) 
      if (!ownedUpgrades.find(upgr => upgr.id === req)) available = false;
    if (upg.producerBound && !ownedProducers.find(prod => prod.itemId === upg.producerBound)) 
      available = false;
    if (ownedUpgrades.includes(upg))
      available = false;
    
    
    return available;
  })
}

