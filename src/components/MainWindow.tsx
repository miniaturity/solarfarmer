import { useGameStore } from '../store/store'
import '../styles/Main.css'

export const MainWindow: React.FC = () => {
  const gs = useGameStore();

  return (
    <div className="m_window">
      <div className="m-news">

      </div>
      <div className="m-producers">
        {gs.entities.producers.map(
          (producer) => {
            const stats = gs.getProducerStats(producer.id);
            return (
              <div className="mp-item">
                <div className="mpi-name"> 
                  {producer.name} {`(${producer.id})`}
                </div>
                <div className="mpi-info">
                  {`kwh: ${stats?.effectiveKwh || 'err'}`}
                  {`eff: ${stats?.totalEfficiency || 'err'}`}
                  {`profit: ${stats?.profitPerHour || 'err'}`}
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
