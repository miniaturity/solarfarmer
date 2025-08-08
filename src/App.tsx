import { useEffect, useRef, useState } from 'react';
import './styles/css/App.css';
import { MainWindow } from './components/MainWindow';
import { RightBar } from './components/RightBar';
import { LeftBar } from './components/LeftBar';
import { useGameStore } from './store/store';
import { addNumeric, multiplyNumeric, numericToString, parseNumeric } from './util/numerics';


function App() {
  const gs = useGameStore();
  const [gameTickSpeed, setGameTickSpeed] = useState<number>(50); // ms
  const [hourTick, setHourTick] = useState<number>(0);
  const [dayTick, setDayTick] = useState<number>(0);
  const hourTickRef = useRef(hourTick);
  const dayTickRef = useRef(dayTick);

  // 1 day = 3600 ticks
  // 1 hour = 150 ticks

  useEffect(() => {
    const tick = setInterval(() => {
      handleGameTick();
      console.log("tick");
    }, gameTickSpeed);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    setGameTickSpeed(gs.settings.gameSpeed === 2 ? 100 : 50);
  }, [gs.settings.gameSpeed])

  useEffect(() => {
    hourTickRef.current = hourTick;
  }, [hourTick]);

  useEffect(() => {
    dayTickRef.current = dayTick;
  }, [dayTick])

  const handleGameTick = () => {
    setHourTick(prev => prev + 1);

    if (hourTickRef.current === 150) 
      handleHourTick();
  }

  const handleHourTick = () => {
    console.log("hour ticked");
    setHourTick(0);
    setDayTick(prev => prev + 1)
    if (dayTickRef.current === 23) 
      handleDayTick();
    
    const collectedStats = handleCollection();

    gs.addBalance(collectedStats.totalMoney);
    gs.setKwh(collectedStats.totalKwh);
    gs.nextHour();
  }

  const handleDayTick = () => {
    console.log("day ticked");
    setDayTick(0);
  }

  const handleCollection = () => { // Per Hour
    let totalKwh = "0";
    let totalMoney = "0";
    const producers = gs.entities.producers;
    
    producers.forEach((prod) => {
      const stats = gs.getProducerStats(prod.itemId);
      if (!stats) return;
      totalKwh = numericToString(addNumeric(parseNumeric(stats.effectiveKwh), parseNumeric(totalKwh)))
    });

    totalMoney = numericToString(multiplyNumeric(parseNumeric(totalKwh), parseNumeric(gs.dpkw)))
    
    return {
      totalKwh,
      totalMoney
    }
  }

  return (
    <div className="app">
      <div className="left-sb">
        <LeftBar />
      </div>
      <div className="mid-win">
        <MainWindow />
      </div>
      <div className="right-sb">
        <RightBar />
      </div>
    </div>
  );
}


export default App;
