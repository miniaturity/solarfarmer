import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { addNumeric, maxNumeric, multiplyNumeric, numericToString, parseNumeric, subtractNumeric } from '../util/numerics';
import { calculateBulkCost, canAffordProducer, createProducerFromTemplate } from './producers';


interface GameState {
  saveName: string,
  lastSaved: number,
  version: string,

  balance: string,
  rp: number,
  kwh: string,
  dpkw: string,
  rph: number,

  date: string,
  

  entities: {
    workers: Worker[],
    producers: Producer[], 
    upgrades: Upgrade[],
    researchers: Researcher[],
    modifiers: Modifier[],
  }

  shop: {
    producers: ProducerTemplate[],
    upgrades: Upgrade[]
  }

  settings: {
    autoSave: boolean,
    gameSpeed: 1 | 2
  }

  ui: {
    selectedProducer: string | null,
    mainWindow: 'main' | 'settings'
    rightSideBar: 'shop' | 'producers' | 'workers' | 'upgrades',
    leftSideBar: 'news' | 'stats'
  }

  currentWeather: Weather | null,
}

type ProducerTypes = 'solar' | 'fossil' | 'nuclear' | 'hydro' | 'wind' | 'dyson' | 'black_hole' | 'blood';

interface Producer {
  id: string,
  itemId: string, // Identification between shop
  name: string,
  icon: string,

  basePrice: string, 
  type: ProducerTypes,
  stats: ProducerStats,
  upgrades: Upgrade[],
  researchLocked: boolean // True = hidden until unlocked, false = visible in shop.
  requires?: ProducerId // If it requires another producer

  currentPrice: string, 
  count: number,
  unlockedAt: number, // Timestamp for reference.
}

interface ProducerTemplate { // For shop.
  itemId: string, // Defined; not generated like the Producer ID.
  name: string,
  icon: string,
  basePrice: string,
  currentPrice: string,

  risk: number
  type: ProducerTypes,
  stats: ProducerStats,
  upgrades: Upgrade[],
  researchLocked: boolean,
  requires?: ProducerId
}

interface ProducerStats {
  baseKwh: string, // Base varies.
  baseEfficiency: number, // Base: Varies. Max: 100. Efficiency decreases by 2 for each worker below 70 competence. 
  // Increases by 2 for each worker above 70 competence, and increases by 3 at 100 comp.
  // Final kwh: (((currentKwh + additive_modifiers) * mult_modifiers)) * (currentEff / 100) 
}

interface Researcher {
  id: string,
  name: string,
  
  basePrice: string,
  currentPrice: string,

  stats: ResearcherStats,
}

interface ResearcherStats {
  baseRph: number, // Research points per hour. 
  task: string | null, // Name of producer or upgrade to reasearch.
}

interface ResearcherUnlock {
  itemId: string,
  name: string,
  icon: string,
}

interface Worker {
  id: string,
  producerId: string, // Assigned producer.
  name?: string,
  icon: string,
  jobName: string,
  isSuppressed: boolean, // Doesnt work for the day if suppressed. Persists for entire day and checks if it is still suppressed every day.
  // Suppression does not affect factors; They stay the same until unsuppressed.

  wage: number, // Base: $13/h ($312/day) + (riskFactor * 2), Max: Unlimited. 
  level: number, // +1 level at 6 exp. Requirement equals 1.1^level.
  experience: number, // +1 experience per day.

  hiredAt: number, // Timestamp for reference.
}


interface Upgrade {
  id: string,
  name: string,
  icon: string,
  description: string,
  cost: string,
  category: 'worker' | 'kwh' | 'global' | 'efficiency',
  
  requires: string[] // Upgrade IDs that need to be unlocked first.
  producerBound?: string // ItemID for producer
  unlockedAt?: number,
  effects: UpgradeEffect[]
}

interface UpgradeEffect {
  type: 'kwh_add' | 'kwh_mult' | 'cost_reduction' | 'wage_efficiency',
  target?: string,
  value: number | string,
  isPercentage?: boolean
}

interface Weather {
  name: string,
  effects?: WeatherEffect[],
  chance: number, // Rolled once per day (if length === 0).
  length: number | null,
}

type WeatherEffects = 'kwh_add' | 'kwh_mult' | 'suppress_producer' | 'suppress_worker';

interface WeatherEffect {
  affects: 'global' | 'producer_specific' | 'producer_type',
  producerType?: ProducerTypes,
  producerTarget?: string, // By name, not ID.
  type: WeatherEffects[]
}

interface Modifier {
  id: string, // Unique!!!!,
  name: string,
  length: number, // Ticks (0.05s/tick)
  affects: 'global' | 'producer',
  producer?: string,
  mods: Mod[]
}

interface Mod {
  type: ModType,
  value: string,
}

type ModType = 'kwh_add' | 'kwh_mult' | 'cr_add' | 'cr_mult'
 // cr = conversion rate

type ProducerId = string;
type WorkerId = string;
type UpgradeId = string;

interface BuyProducerPayload {
  producerItemId: ProducerId;
  count: number;
}

interface UpdateProducerPricePayload {
  producerItemId: string, 
  newPrice: string
}

interface InitShopPayload {
  producers: ProducerTemplate[],
  upgrades: Upgrade[]
}

interface HireWorkerPayload {
  producerId: ProducerId;
  workerTemplate: Omit<Worker, 'id' | 'producerId' | 'hiredAt'>;
}

interface BenchWorkerPayload {
  workerId: WorkerId;
  length: number;
  paid: boolean;
}

interface BuyUpgradePayload {
  upgradeId: UpgradeId;
}


interface ComputedProducerStats {
  id: string,
  totalKwh: string;
  totalEfficiency: number;
  effectiveKwh: string; // After efficiency
  profitPerHour: string;
}

interface ComputedWorkerStats {
  totalWageCost: number;
}

interface CalcProducerPricesPayload {
  count: number;
}

interface SellProducerPayload {
  producerId: string,
  count: number,
  sellPrice: string,
}


interface GameStore extends GameState {
  // Resource actions
  addBalance: (amount: string) => void;
  subtractBalance: (amount: string) => void;
  addKwh: (amount: string) => void;
  setKwh: (amount: string) => void;
  setDpkw: (amount: string) => void;

  // Time actions
  nextHour: () => void;

  // Shop actions
  initShop: (payload: InitShopPayload) => void;
  calcProducerPrices: (payload: CalcProducerPricesPayload) => void;

  // Producer actions
  buyProducer: (payload: BuyProducerPayload) => void;
  sellProducer: (payload: SellProducerPayload) => void;
  updateProducerPrice: (payload: UpdateProducerPricePayload) => void;

  // Worker actions
  hireWorker: (payload: HireWorkerPayload) => void;
  fireWorker: (workerId: string) => void;
  benchWorker: (payload: BenchWorkerPayload) => void;
  updateWorkerWage: (workerId: string, newWage: number) => void;
  addWorkerExperience: (workerId: string, exp: number) => void;

  // Upgrade actions
  buyUpgrade: (payload: BuyUpgradePayload) => void;

  // Weather actions
  setWeather: (payload: Weather) => void;


  // UI actions
  setSelectedProducer: (producerId: string | null) => void;
  setMainWindow: (tab: 'main' | 'settings') => void;
  setRightSideBar: (tab: "producers" | "workers" | "upgrades" | "shop") => void;
  setLeftSideBar: (tab: 'news' | 'stats') => void;

  // Settings actions
  toggleAutoSave: () => void;
  setGameSpeed: (speed: 1 | 2) => void;

  // Game management
  saveGame: () => void;
  loadGame: (gameState: GameState) => void;
  resetGame: () => void;

  // Computed getters
  getProducerStats: (producerId: string) => ComputedProducerStats | null;
  getWorkerStats: (producerId: string) => ComputedWorkerStats;
  getTotalIncome: () => string;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function toStartOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

const initialState: GameState = {
  saveName: "New Game",
  lastSaved: Date.now(),
  version: "1.0.0",

  balance: "10000",
  rp: 0,
  kwh: "0",
  dpkw: "0",
  rph: 0,
  date: new Date(toStartOfDay(new Date())).toISOString(),

  entities: {
    workers: [],
    producers: [],
    upgrades: [],
    researchers: [],
    modifiers: []
  },
  settings: {
    autoSave: true,
    gameSpeed: 1
  },
  shop: {
    producers: [],
    upgrades: []
  },
  ui: {
    selectedProducer: null,
    mainWindow: 'main',
    rightSideBar: 'producers',
    leftSideBar: 'news'
  },
  currentWeather: null,
};

// Create the store
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Resource actions
    addBalance: (amount: string) => set((state) => ({
      balance: numericToString(addNumeric(state.balance, amount))
    })),

    subtractBalance: (amount: string) => set((state) => ({
      balance: numericToString(maxNumeric(0, subtractNumeric(state.balance, amount)))
    })),

    addKwh: (amount: string) => set((state) => ({
      kwh: numericToString(addNumeric(state.kwh, amount))
    })),

    setKwh: (amount: string) => set((state) => ({
      kwh: amount
    })),

    setDpkw: (amount: string) => set({ dpkw: amount }),

    // Producer actions
    buyProducer: ({ producerItemId, count }) => set((state) => {
      const producer = state.shop.producers.find(p => p.itemId === producerItemId);
      if (!producer) { return state; }


      const totalCost = numericToString(multiplyNumeric(producer.currentPrice, count.toString()));
      const isDuplicate = state.entities.producers.find(p => p.itemId === producerItemId);
      
      if (!canAffordProducer) return { ...state };
      


      if (isDuplicate)
        return {
          balance: numericToString(subtractNumeric(state.balance, totalCost)),
          entities: {
            ...state.entities,
            producers: [
              ...state.entities.producers.map(
                p => p.itemId === producer.itemId
                  ? { ...p, count: p.count + count } : p
              ),
              
            ]
          }
        }
      else {
        return {
          balance: numericToString(subtractNumeric(state.balance, totalCost)),
          entities: {
            ...state.entities,
            producers: [
              ...state.entities.producers,
              { ...createProducerFromTemplate(producer), count: count, unlockedAt: Date.now() }
            ]
          }
        }
      }
    }),

    sellProducer: ({ producerId, count, sellPrice }) => set((state) => {
      const producer = state.entities.producers.find(prod => prod.itemId === producerId);
      if (!producer) return { ...state };

      

      return {
        ...state,
        balance: numericToString(addNumeric(state.balance, parseNumeric(sellPrice))),
        entities: {
          ...state.entities,
          producers: state.entities.producers.map(p => p.itemId === producerId ? { ...p, count: p.count - count} : p)
        }
      }
    }),

    initShop: ({ producers, upgrades }) => set((state) => ({
      shop: {
        ...state.shop,
        producers: producers,
        upgrades: upgrades
      }
    })),

    calcProducerPrices: ({ count = 1 }) => set((state) => {
      const updatedShopProducers = state.shop.producers.map((shopProducer) => {
        const bulkCost = calculateBulkCost(shopProducer.itemId, count, state.entities.producers);
        
        return {
          ...shopProducer,
          currentPrice: bulkCost
        };
      });

      return {
        shop: {
          ...state.shop,
          producers: updatedShopProducers
        }
      };
    }),

    nextHour: () => set((state) => {
      const currentDate = new Date(state.date);
      const nextDate = new Date(currentDate);
      nextDate.setHours(currentDate.getHours() + 1); // Handles day/month/year rollover

      return {
        date: nextDate.toISOString()
      };
    }),

    updateProducerPrice: ({ producerItemId, newPrice }) => set((state) => ({
      shop: {
        ...state.shop,
        producers: state.shop.producers.map(s => s.itemId === producerItemId 
          ? { ...s, currentPrice: newPrice }
          : s
        )
      }
    })),

    // Worker actions
    hireWorker: ({ producerId, workerTemplate }) => set((state) => {
      const newWorker: Worker = {
        ...workerTemplate,
        id: generateId(),
        producerId: producerId,
        hiredAt: Date.now()
      };

      return {
        entities: {
          ...state.entities,
          workers: [...state.entities.workers, newWorker]
        }
      };
    }),

    fireWorker: (workerId: string) => set((state) => ({
      entities: {
        ...state.entities,
        workers: state.entities.workers.filter(w => w.id !== workerId)
      }
    })),

    benchWorker: ({ workerId, length, paid }) => set((state) => ({
      entities: {
        ...state.entities,
        workers: state.entities.workers.map(w => w.id === workerId ? { ...w,
          benched: {
            isBenched: true,
            length: length,
          }
        } : w
      ) 
      }
    })),

    updateWorkerWage: (workerId: string, newWage: number) => set((state) => ({
      entities: {
        ...state.entities,
        workers: state.entities.workers.map(w =>
          w.id === workerId ? { ...w, wage: newWage } : w
        )
      }
    })),

    addWorkerExperience: (workerId: string, exp: number) => set((state) => ({
      entities: {
        ...state.entities,
        workers: state.entities.workers.map(w => {
          if (w.id !== workerId) return w;
          
          const newExp = w.experience + exp;
          const requiredExp = 2 * w.level + 4;
          
          if (newExp >= requiredExp) {
            return {
              ...w,
              experience: newExp - requiredExp,
              level: w.level + 1
            };
          }
          
          return { ...w, experience: newExp };
        })
      }
    })),

    // Upgrade actions
    buyUpgrade: ({ upgradeId }) => set((state) => {
      const upgrade = state.shop.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return state;

      const cost = parseFloat(upgrade.cost);
      if (parseFloat(state.balance) < cost) return state;

      const isDuplicate = state.entities.upgrades.find(upg => upg.id === upgradeId);
      if (isDuplicate) return state;

      return {
        balance: (parseFloat(state.balance) - cost).toString(),
        entities: {
          ...state.entities,
          upgrades: [...state.entities.upgrades, upgrade]
        }
      };
    }),

    // Weather actions
    setWeather: (weather: Weather) => set((state) => ({
      ...state,
      currentWeather: weather,
    })),

    // UI actions
    setSelectedProducer: (producerId: string | null) => set((state) => ({
      ui: { ...state.ui, selectedProducer: producerId }
    })),

    setMainWindow: (tab) => set((state) => ({
      ui: { ...state.ui, mainWindow: tab }
    })),

    setRightSideBar: (tab) => set((state) => ({
      ui: { ...state.ui, rightSideBar: tab }
    })),

    setLeftSideBar: (tab) => set((state) => ({
      ui: { ...state.ui, leftSideBar: tab }
    })),

    // Settings actions
    toggleAutoSave: () => set((state) => ({
      settings: { ...state.settings, autoSave: !state.settings.autoSave }
    })),

    setGameSpeed: (speed) => set((state) => ({
      settings: { ...state.settings, gameSpeed: speed }
    })),

    // Game management
    saveGame: () => set((state) => ({
      lastSaved: Date.now()
    })),

    loadGame: (gameState: GameState) => set(gameState),

    resetGame: () => set(initialState),

    // Computed getters
    getProducerStats: (producerItemId: string): ComputedProducerStats | null => {
      const state = get();
      const producer = state.entities.producers.find(p => p.itemId === producerItemId);
      if (!producer) return null;

      const upgrades = state.entities.upgrades;
      const modifiers = state.entities.modifiers;

      // Calculate efficiency based on worker competence
      let totalEfficiency = producer.stats.baseEfficiency;

      totalEfficiency = Math.min(100, Math.max(0, totalEfficiency));

      // Apply upgrade effects
      let baseKwh = parseFloat(producer.stats.baseKwh);
      let kwhMultiplier = 1;

      upgrades.forEach(upgrade => {
        upgrade.effects.forEach(effect => {
          if (effect.target === producerItemId || !effect.target) {
            switch (effect.type) {
              case 'kwh_add':
                baseKwh += typeof effect.value === "string" ? parseFloat(effect.value) : effect.value;
                break;
              case 'kwh_mult':
                kwhMultiplier *= (1 + (typeof effect.value === "string" ? parseFloat(effect.value) : effect.value) / 100);
                break;
              default:
                break;
            }
          }
        });
      });

      modifiers.forEach(modifier => {
        const affectsThis = modifier.affects === "producer" && modifier.producer && modifier.producer === producer.itemId;
        if (modifier.affects === 'global' || affectsThis) {
          modifier.mods.forEach(mod => {
            switch (mod.type) {
              case "kwh_add":
                baseKwh += parseFloat(mod.value);
                break;
              case "kwh_mult":
                kwhMultiplier *= parseFloat(mod.value);
                break;
              default:
                break;
            }
          })
        }
      })

      const totalKwh = (baseKwh * kwhMultiplier * producer.count).toFixed(2).toString();
      const effectiveKwh = (parseFloat(totalKwh) * (totalEfficiency / 100)).toFixed(2).toString();

      const profitPerHour = effectiveKwh; 

      return {
        id: producerItemId,
        totalKwh,
        totalEfficiency,
        effectiveKwh,
        profitPerHour
      };
    },

    getWorkerStats: (producerId: string): ComputedWorkerStats => {
      const state = get();
      const workers = state.entities.workers.filter(w => w.producerId === producerId);

      const totalWageCost = workers.reduce((sum, worker) => sum + worker.wage, 0);
      
      return {
        totalWageCost,
      };
    },

    getTotalIncome: (): string => {
      const state = get();
      let totalIncome = 0;

      state.entities.producers.forEach(producer => {
        const stats = get().getProducerStats(producer.id);
        if (stats) {
          totalIncome += parseFloat(stats.effectiveKwh);
        }
      });

      return totalIncome.toString();
    }
  }))
);

// Export individual selectors for performance
export const useBalance = () => useGameStore(state => state.balance);
export const useProducers = () => useGameStore(state => state.entities.producers);
export const useWorkers = () => useGameStore(state => state.entities.workers);
export const useUpgrades = () => useGameStore(state => state.entities.upgrades);
export const useUI = () => useGameStore(state => state.ui);
export const useSettings = () => useGameStore(state => state.settings);
export type { Producer, ProducerTemplate, Worker, Upgrade, Researcher, Weather }