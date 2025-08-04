import { addNumeric, multiplyNumeric, numericToString, parseNumeric } from "../util/numerics";
import { Producer, ProducerTemplate } from "./store"

// Upgrade ID format: producer_index

export const PRODUCERS: ProducerTemplate[] = [
  {
    itemId: "0",
    name: "Solar Panel",
    basePrice: "1000",
    currentPrice: "1000",
    risk: 0,
    type: 'solar',
    stats: {
      baseKwh: "2.4",
      baseEfficiency: 60
    },
    upgrades: [], // To be populated
    researchLocked: false,
  }
]

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export function createProducerFromTemplate(template: ProducerTemplate): Producer {
  return {
    id: generateId(),
    itemId: template.itemId,
    name: template.name,
    basePrice: template.basePrice,
    currentPrice: template.basePrice, // Will be updated by price scaling
    type: template.type,
    stats: { ...template.stats },
    upgrades: template.upgrades,
    researchLocked: template.researchLocked,
    count: 0,
    unlockedAt: Date.now()
  }
}

export function calculateProducerPrice(basePrice: string, currentCount: number): string {
  const base = parseNumeric(basePrice)
  const multiplier = Math.pow(1.15, currentCount)
  
  return numericToString(multiplyNumeric(base, multiplier.toString()))
}

export function getAvailableProducers(ownedProducers: Producer[]): ProducerTemplate[] {
  return PRODUCERS.filter(template => {
    if (!template.researchLocked) return true
    
    const owned = ownedProducers.find(p => p.name === template.name)
    return owned && owned.unlockedAt > 0
  })
}

export function getLockedProducers(ownedProducers: Producer[]): ProducerTemplate[] {
  return PRODUCERS.filter(template => {
    if (!template.researchLocked) return false
    
    const owned = ownedProducers.find(p => p.name === template.name)
    return !owned || owned.unlockedAt === 0
  })
}

export function getProducerTemplate(itemId: string): ProducerTemplate | null {
  return PRODUCERS.find(p => p.itemId === itemId) || null
}

export function calculateBulkCost(itemId: string, quantity: number, ownedProducers: Producer[]): string {
  const template = getProducerTemplate(itemId)
  if (!template) return "0"
  
  const owned = ownedProducers.find(p => p.name === template.name)
  const startCount = owned ? owned.count : 0
  
  let totalCost = parseNumeric("0")
  
  for (let i = 0; i < quantity; i++) {
    const price = calculateProducerPrice(template.basePrice, startCount + i)
    totalCost = addNumeric(totalCost, parseNumeric(price))
  }
  
  return numericToString(totalCost)
}

export function getProducersByType(availableProducers: ProducerTemplate[]) {
  const grouped = {
    fossil: [] as ProducerTemplate[],
    solar: [] as ProducerTemplate[],
    wind: [] as ProducerTemplate[],
    hydro: [] as ProducerTemplate[],
    nuclear: [] as ProducerTemplate[],
    dyson: [] as ProducerTemplate[],
    black_hole: [] as ProducerTemplate[],
    blood: [] as ProducerTemplate[]
  }
  
  availableProducers.forEach(producer => {
    grouped[producer.type].push(producer)
  })
  
  return grouped
}

export function canAffordProducer(
  itemId: string, 
  quantity: number, 
  currentBalance: string, 
  ownedProducers: Producer[]
): boolean {
  const cost = calculateBulkCost(itemId, quantity, ownedProducers)
  return parseNumeric(currentBalance) >= parseNumeric(cost)
}

export const SHOP_DATA = {
  getAllProducers: () => PRODUCERS,
  getAvailableProducers,
  getLockedProducers,
  getProducersByType,
}