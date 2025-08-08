import { useEffect, useState } from 'react';
import { useGameStore } from '../store/store'
import '../styles/css/Main.css'

interface ProducerStats {
  id: string,
  totalKwh: string,
  totalEfficiency: number,
  effectiveKwh: string,
  profitPerHour: string,
}


export const MainWindow: React.FC = () => {
  const gs = useGameStore();
  const [stats, setStats] = useState<ProducerStats[]>();

  useEffect(() => {
    let newStats: ProducerStats[] = [];
    gs.entities.producers.forEach((prod) => {
      const st = gs.getProducerStats(prod.itemId);
      if (!st) return;
      newStats.push(st);
    })
    setStats(newStats);
  }, [
    gs.entities.upgrades,
    gs.entities.producers
  ])


  return (
    <div className="m_window">
      <div className="m-news">
        
      </div>
      <div className="m-producers">
        {gs.entities.producers.map(
          (producer) => {
            const prodStats = stats?.find(stat => stat.id === producer.itemId);

            return (
              <div className="mp-item">
                <div className="mpi-name"> 
                  {producer.name} {`(${producer.id})`}
                </div>
                <div className="mpi-info">
                  {`kwh: ${prodStats?.effectiveKwh || 'err'}`}
                  {`eff: ${prodStats?.totalEfficiency || 'err'}`}
                  {`profit: ${prodStats?.profitPerHour || 'err'}`}
                </div>
              </div>
            )
          }
        )}
      </div>
      <div className="m-controls">

      </div>
    </div>
  )
}
