import { useEffect } from "react";
import { useGameStore } from "../store/store";
import { getAvailableProducers, PRODUCERS } from "../store/producers";
import { UPGRADES } from "../store/upgrades";

export const RightBar: React.FC = () => {
  const gs = useGameStore();

  useEffect(() => {
    populateShop();
  }, [])


  const populateShop = () => {
    const producers = getAvailableProducers(gs.entities.producers);
    gs.initShop({ producers: producers, upgrades: UPGRADES });
  }
  
  const buyProducers = (itemId: string, count: number) => {

  }


  return (
    <div className="r_sidebar">
      <div className="r-shop">
      {gs.shop.producers.map(
        (producer, index) => {

          return (
            <div className="rs-item" key={index}>
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
  )
}