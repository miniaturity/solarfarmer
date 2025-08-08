import { useEffect, useState } from "react";
import { useGameStore } from "../store/store"
import '../styles/css/Left.css'

export const LeftBar: React.FC = () => {
  const gs = useGameStore();
  const [date, setDate] = useState<string>("");
  const [hour, setHour] = useState<string>("");

  useEffect(() => {
    setDate(formatDate(gs.date));
    setHour(formatHour(gs.date));
  }, [gs.date])

  const formatHour = (d: string) => {
    return d.slice(11, 16);
  }

  const formatDate = (d: string) => {
    return d.slice(0, 10);
  }

  return (
    <div className="l_sidebar">
      <div className="l-stats">
        <span>balance: {gs.balance} </span>
        <span>date: {`${date}, ${hour} `}</span>
        <span>weather: {`${gs.currentWeather}`}</span>
      </div>
    </div>
  )
}