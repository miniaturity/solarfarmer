import { useEffect, useState } from "react";
import { useGameStore } from "../store/store";
import { getAvailableProducers } from "../store/producers";
import { getAvailableUpgrades, } from "../store/upgrades";
import '../styles/css/Right.css'

export const RightBar: React.FC = () => {
  const gs = useGameStore();
  const [buyCount, setBuyCount] = useState<number>(1);
  const counts = [1, 2, 5, 10, 50, 100];


  useEffect(() => {
    populateShop();
    gs.calcProducerPrices({ count: 1 });
  }, []);

  useEffect(() => {
    populateShop();
    gs.calcProducerPrices({ count: buyCount });
  }, [gs.entities.producers, gs.entities.upgrades]);


  const populateShop = () => {
    const producers = getAvailableProducers(gs.entities.producers);
    const upgrades = getAvailableUpgrades(gs.entities.producers, gs.entities.upgrades);

    gs.initShop({ producers: producers, upgrades: upgrades });
  }
  
  const buyProducers = (itemId: string, count: number) => {
    const producer = getAvailableProducers(gs.entities.producers).find(p => p.itemId === itemId);
    if (!producer) { 
      console.error("producer not found");
      return; 
    }
    gs.buyProducer({ producerItemId: itemId, count: count });
  }

  const buyUpgrade = (id: string) => {
    const upgrade = gs.shop.upgrades.find(upg => upg.id === id)
    if (!upgrade) return;

    gs.buyUpgrade({ upgradeId: id });
  }

  const handleQtyChange = (newQty: number) => {
    gs.calcProducerPrices({ count: newQty });
    setBuyCount(newQty);
  }  


  return (
    <div className="r_sidebar">
      <div className="r-shop">
        <div className="rs-count">
          {counts.map(count => {
            return (
              <button className={`rsc-button`} id={count.toString()} onClick={() => handleQtyChange(count)} key={count}>
                {count}
              </button>
            )
          })}
        </div>
        <div className="rs-producers">
          {gs.shop.producers.map(
            (producer, index) => {

              return (
                <div className="rsp-item" key={index} onClick={() => buyProducers(producer.itemId, buyCount)}>
                  <div className="rspi-name">
                    {producer.name} {`(${producer.itemId})`}
                  </div>
                  <div className="rspi-info">
                    {producer.currentPrice}
                  </div>
                </div>
              )
            }
          )}   
        </div>
        <div className="rs-upgrades">
          {gs.shop.upgrades.map(
            (upgrade, index) => {
              
              return (
                <div className="rsu-item" key={index} onClick={() => buyUpgrade(upgrade.id)}>
                  <div className="rsui-name">
                      {upgrade.name} {`(${upgrade.id})`}
                  </div>
                  <div className="rsui-info">
                    {upgrade.cost}
                  </div>
                </div>
              )
            }
          )
          }
        </div>
      </div>   
    </div>
  )
}