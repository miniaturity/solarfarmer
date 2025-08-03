import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { addNumeric, maxNumeric, multiplyNumeric, numericToString, subtractNumeric } from '../util/numerics';
import { createProducerFromTemplate } from './producers';


interface GameState {
  saveName: string,
  lastSaved: number,
  version: string,

  balance: string,
  kwh: string,
  dpkw: string,
  rph: number,

  entities: {
    workers: Worker[],
    producers: Producer[],
    upgrades: Upgrade[]
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
    rightSideBar: 'producers' | 'workers' | 'upgrades',
    leftSideBar: 'main' | 'settings' | 'stats'
  }

  currentWeather: Weather | null,
}

type ProducerTypes = 'solar' | 'fossil' | 'nuclear' | 'hydro' | 'wind' | 'dyson' | 'black_hole' | 'blood';

interface Producer {
  id: string,
  itemId: string, // Identification between shop
  name: string,

  basePrice: string, 
  type: ProducerTypes,
  stats: ProducerStats,
  researchLocked: boolean // True = hidden until unlocked, false = visible in shop.
  requires?: ProducerId // If it requires another producer

  currentPrice: string, 
  count: number,
  unlockedAt: number, // Timestamp for reference.
}

interface ProducerTemplate { // For shop.
  itemId: string, // Defined; not generated like the Producer ID.
  name: string,
  basePrice: string,
  currentPrice: string,

  risk: number
  type: ProducerTypes,
  stats: ProducerStats,
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

interface Worker {
  id: string,
  producerId: string, // Assigned producer.
  name?: string,
  jobName: string,
  isSuppressed: boolean, // Doesnt work for the day if suppressed. Persists for entire day and checks if it is still suppressed every day.
  // Suppression does not affect factors; They stay the same until unsuppressed.

  factors: WorkerFactors,

  wage: number, // Base: $13 + (riskFactor * 2), Max: Unlimited. Increases competence by 1 every dollar after $20, capped at +15
  competence: number, // Base: 0-20 (randomized), Max: 100. 
  level: number, // +1 level at 6 exp. Requirement equals 2l+4, where l = level.
  experience: number, // +1 experience per day.

  hiredAt: number, // Timestamp for reference.
}

interface WorkerFactors {
  riskFactor: number, // How risky the job assigned to worker is can affect the requested pay. (1-1000)
  quitFactor: number, // Every day the wage is below requested by riskFactor, quitFactor increases. Worker quits at 100 (base: 0)
  insanityFactor: number, // Every +1 insanityFactor = -1 competence. Use upgrades to prolong workers.
  happinessFactor: number, // Every +1 happinessFactor = +1 competence, max 10 happiness.
}

interface Upgrade {
  id: string,
  name: string,
  description: string,
  cost: string,
  bought: boolean,
  category: 'worker' | 'kwh' | 'global' | 'efficiency',
  requires: string[] // Upgrade IDs that need to be unlocked first.
  unlockedAt?: number,
  effects: UpgradeEffect[]
}

interface UpgradeEffect {
  type: 'kwh_add' | 'kwh_mult' | 'worker_competence' | 'cost_reduction' | 'wage_efficiency'
  | 'insanity_factor' | 'happiness_factor' | 'quit_factor',
  target?: string,
  value: number,
  isPercentage?: boolean
}

interface Weather {
  name: string,
  effects: WeatherEffect[],
  chance: number, // Rolled once per day.
}

type WeatherEffects = 'kwh_add' | 'kwh_mult' | 'riskFactor_mult' | 'riskFactor_add' | 'suppress_producer' | 'suppress_worker';

interface WeatherEffect {
  affects: 'global' | 'producer_specific' | 'producer_type',
  producerType?: ProducerTypes,
  producerTarget?: string, // By name, not ID.
  type: WeatherEffects[]
}

type ProducerId = string;
type WorkerId = string;
type UpgradeId = string;

interface BuyProducerPayload {
  producerId: ProducerId;
  quantity?: number;
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

interface TrainWorkerPayload {
  workerId: WorkerId;
  trainingCost: number;
  competenceIncrease: number;
}

interface ComputedProducerStats {
  totalKwh: string;
  totalEfficiency: number;
  effectiveKwh: string; // After efficiency
  profitPerHour: string;
}

interface ComputedWorkerStats {
  totalWageCost: number;
  efficiencyContribution: number;
}



interface GameStore extends GameState {
  // Resource actions
  addBalance: (amount: string) => void;
  subtractBalance: (amount: string) => void;
  addKwh: (amount: string) => void;
  setDpkw: (amount: string) => void;

  // Shop actions
  initShop: (producers: ProducerTemplate[]) => void;

  // Producer actions
  buyProducer: (producerItemId: string, count: number) => void;
  updateProducerPrice: (producerItemId: string, newPrice: string) => void;

  // Worker actions
  hireWorker: (payload: HireWorkerPayload) => void;
  fireWorker: (workerId: string) => void;
  benchWorker: (payload: BenchWorkerPayload) => void;
  trainWorker: (payload: TrainWorkerPayload) => void;
  updateWorkerWage: (workerId: string, newWage: number) => void;
  addWorkerExperience: (workerId: string, exp: number) => void;

  // Upgrade actions
  buyUpgrade: (payload: BuyUpgradePayload) => void;
  unlockUpgrade: (upgradeId: string) => void;

  // Weather actions
  setWeather: (payload: Weather) => void;


  // UI actions
  setSelectedProducer: (producerId: string | null) => void;
  setRightSideBar: (tab: 'producers' | 'workers' | 'upgrades') => void;
  setLeftSideBar: (tab: 'main' | 'settings') => void;

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

// Helper function to generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Initial state
const initialState: GameState = {
  saveName: "New Game",
  lastSaved: Date.now(),
  version: "1.0.0",
  balance: "1000",
  kwh: "0",
  dpkw: "0",
  rph: 0,
  entities: {
    workers: [],
    producers: [],
    upgrades: []
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
    rightSideBar: 'producers',
    leftSideBar: 'main'
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

    setDpkw: (amount: string) => set({ dpkw: amount }),

    // Producer actions
    buyProducer: (producerItemId: string, count: number) => set((state) => {
      const producer = state.shop.producers.find(p => p.itemId === producerItemId);
      if (!producer) { return state; }

      const totalCost = numericToString(multiplyNumeric(producer.currentPrice, count.toString()));
      const isDuplicate = state.entities.producers.find(p => p.itemId === producerItemId);
      
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

    initShop: (producers: ProducerTemplate[]) => {

    },

    updateProducerPrice: (producerItemId: string, newPrice: string) => set((state) => ({
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

    trainWorker: ({ workerId, trainingCost, competenceIncrease }) => set((state) => {
      if (parseFloat(state.balance) < trainingCost) return state;

      return {
        balance: (parseFloat(state.balance) - trainingCost).toString(),
        entities: {
          ...state.entities,
          workers: state.entities.workers.map(w =>
            w.id === workerId
              ? { ...w, competence: Math.min(100, w.competence + competenceIncrease) }
              : w
          )
        }
      };
    }),

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
      const upgrade = state.entities.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.bought) return state;

      const cost = parseFloat(upgrade.cost);
      if (parseFloat(state.balance) < cost) return state;

      return {
        balance: (parseFloat(state.balance) - cost).toString(),
        entities: {
          ...state.entities,
          upgrades: state.entities.upgrades.map(u =>
            u.id === upgradeId ? { ...u, bought: true } : u
          )
        }
      };
    }),

    unlockUpgrade: (upgradeId: string) => set((state) => ({
      entities: {
        ...state.entities,
        upgrades: state.entities.upgrades.map(u =>
          u.id === upgradeId ? { ...u, unlockedAt: Date.now() } : u
        )
      }
    })),

    // Weather actions
    setWeather: (weather: Weather) => set((state) => ({
      ...state,
      currentWeather: weather,
    })),

    // UI actions
    setSelectedProducer: (producerId: string | null) => set((state) => ({
      ui: { ...state.ui, selectedProducer: producerId }
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
    getProducerStats: (producerId: string): ComputedProducerStats | null => {
      const state = get();
      const producer = state.entities.producers.find(p => p.id === producerId);
      if (!producer) return null;

      const workers = state.entities.workers.filter(w => w.producerId === producerId);
      const upgrades = state.entities.upgrades.filter(u => u.bought);

      // Calculate efficiency based on worker competence
      let totalEfficiency = producer.stats.baseEfficiency;
      workers.forEach(worker => {
        if (worker.competence < 70) {
          totalEfficiency -= (70 - worker.competence) * 2;
        } else if (worker.competence === 100) {
          totalEfficiency += 30; // +3 for perfect competence
        } else {
          totalEfficiency += (worker.competence - 70) * 2;
        }
      });

      totalEfficiency = Math.min(100, Math.max(0, totalEfficiency));

      // Apply upgrade effects
      let baseKwh = parseFloat(producer.stats.baseKwh);
      let kwhMultiplier = 1;

      upgrades.forEach(upgrade => {
        upgrade.effects.forEach(effect => {
          if (effect.target === producerId || !effect.target) {
            switch (effect.type) {
              case 'kwh_add':
                baseKwh += effect.value;
                break;
              case 'kwh_mult':
                kwhMultiplier *= (1 + effect.value / 100);
                break;
              default:
                break;
            }
          }
        });
      });

      const totalKwh = (baseKwh * kwhMultiplier * producer.count).toString();
      const effectiveKwh = (parseFloat(totalKwh) * (totalEfficiency / 100)).toString();

      const profitPerHour = effectiveKwh; 

      return {
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
      const efficiencyContribution = workers.reduce((sum, worker) => {
        if (worker.competence < 70) {
          return sum - ((70 - worker.competence) * 2);
        } else if (worker.competence === 100) {
          return sum + 30;
        } else {
          return sum + ((worker.competence - 70) * 2);
        }
      }, 0);

      return {
        totalWageCost,
        efficiencyContribution
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
export type { Producer, ProducerTemplate, Worker, Upgrade, Weather }