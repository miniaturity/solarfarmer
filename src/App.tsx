import React, { useEffect, useState } from 'react';
import './styles/App.css';
import { MainWindow } from './components/MainWindow';


function App() {

  return (
    <div className="app">
      <div className="left-sb">

      </div>
      <div className="mid-win">
        <MainWindow />
      </div>
      <div className="right-sb">

      </div>
    </div>
  );
}


export default App;
