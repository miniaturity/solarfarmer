import React, { useEffect, useState } from 'react';
import './App.css';
import { PRODUCERS, getAvailableProducers } from './store/producers';
import type { ProducerTemplate } from './store/store';
import { useGameStore } from './store/store';


function App() {

  return (
    <div className="app">
      <div className="left">

      </div>
      <div className="mid">
        <Producers />
      </div>
      <div className="right">
        <Shop />
      </div>
    </div>  
  );
}

const Shop: React.FC = () => {
  const [availableProducers, setAvailableProducers] = useState<ProducerTemplate[]>();
  const { 
    balance, 
    buyProducer, 
    entities: { producers }
  } = useGameStore()

  useEffect(() => {
    setAvailableProducers(getAvailableProducers(producers));
  }, [])

  return (
    <div className="shop-window">
      Balance: {balance}
      <div className="producer-shop">
        {availableProducers?.map((p, index) =>
          <div className="ps-item" key={index}>
            <button onClick={() => {buyProducer(p.itemId, 1)}}>
              {p.name}
              {p.basePrice}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const Producers: React.FC = () => {
  const {
    entities: { producers, workers }
  } = useGameStore();


  return (
    <div className="producers-window">
      {producers.map((p, index) => <div className="p-item" key={index}>
        {p.name}
        {p.id}
        {p.count}
        {p.stats.baseKwh}
      </div>)}
    </div>
  )
}

export default App;
