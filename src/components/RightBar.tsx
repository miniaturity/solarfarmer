import { useEffect, useState } from "react";
import { Producer, ProducerTemplate, useGameStore } from "../store/store";
import { calculateBulkCost, calculateProducerPrice, getAvailableProducers, PRODUCERS } from "../store/producers";
import { UPGRADES } from "../store/upgrades";
import { multiplyNumeric, numericToString } from "../util/numerics";

export const RightBar: React.FC = () => {
  const gs = useGameStore();
  const [buyCount, setBuyCount] = useState<number>(1);
  const counts = [1, 2, 5, 10, 50, 100]

  useEffect(() => {
    gs.calcProducerPrices({ count: buyCount });
    populateShop();
  }, [
    buyCount
  ])


  const populateShop = () => {
    const producers = getAvailableProducers(gs.entities.producers);
    gs.initShop({ producers: producers, upgrades: UPGRADES });
  }
  
  const buyProducers = (itemId: string, count: number) => {
    const producer = getAvailableProducers(gs.entities.producers).find(p => p.itemId === itemId);
    if (!producer) return;

    const calculatedCost = calculateProducerPrice(producer.basePrice, gs.entities.producers.find(prod => prod.itemId === itemId)?.count || count);
    if (parseFloat(gs.balance) - parseFloat(calculatedCost) < 0) return;

    gs.buyProducer({ producerItemId: itemId, count: count });
    gs.subtractBalance(numericToString(multiplyNumeric(producer.currentPrice, count)))
  }

  


  return (
    <div className="r_sidebar">
      <div className="r-shop">
        <div className="rs-count">
          {counts.map(count => {
            return (
              <button className={`rsc-button`} id={count.toString()} onClick={() => setBuyCount(count)}>
                {count}
              </button>
            )
          })}
        </div>
        <div className="rs-producers">
          {gs.shop.producers.map(
            (producer, index) => {

              return (
                <div className="rs-item" key={index} onClick={() => buyProducers(producer.itemId, buyCount)}>
                  <div className="rsi-name">
                    {producer.name} {`(${producer.itemId})`}
                  </div>
                  <div className="rsi-info">
                    {producer.currentPrice}
                  </div>
                </div>
              )
            }
          )}   
        </div>
      </div>   
    </div>
  )
}