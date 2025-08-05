import React, { useEffect, useRef, useState } from 'react';
import './styles/App.css';
import { MainWindow } from './components/MainWindow';
import { RightBar } from './components/RightBar';
import { LeftBar } from './components/LeftBar';
import { useGameStore } from './store/store';


function App() {
  const gs = useGameStore();
  const [gameTickSpeed, setGameTickSpeed] = useState<number>(50); // ms
  const [hourTick, setHourTick] = useState<number>(0);
  const hourTickRef = useRef(hourTick);

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
    hourTickRef.current = hourTick;
  }, [hourTick])

  const handleGameTick = () => {
    setHourTick(prev => prev + 1);

    if (hourTickRef.current === 150) 
      handleHourTick();
  }

  const handleHourTick = () => {
    console.log("hour ticked.");
    setHourTick(0);
    gs.nextHour();
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
