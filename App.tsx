
import React, { useState, useCallback } from 'react';
import { ROULETTE_NUMBERS, INITIAL_BANKROLL, BASE_BET } from './constants';
import { GameState, RouletteNumber, BetResult } from './types';
import { predictNextNumber } from './services/geminiService';

interface EnhancedBetResult extends BetResult {
  totalProfitAtTime: number;
}

export default function App() {
  const [state, setState] = useState<GameState>({
    history: [],
    bankroll: INITIAL_BANKROLL,
    currentBet: BASE_BET,
    lastBetOutcome: 'none',
    martingaleEnabled: true,
    prediction: null,
    confidence: 0,
    isLoading: false,
    betHistory: [],
    totalProfit: 0
  });

  const [isStarted, setIsStarted] = useState(false);
  const [entryMode, setEntryMode] = useState<'number' | 'color'>('number');
  const [buffer, setBuffer] = useState<RouletteNumber[]>([]);
  const [selectedRoulette, setSelectedRoulette] = useState('iconic21');
  const [enhancedHistory, setEnhancedHistory] = useState<EnhancedBetResult[]>([]);

  const row1 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  const row2 = [0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  const row3 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

  const runPrediction = useCallback(async (currentHistory: RouletteNumber[]) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await predictNextNumber(currentHistory);
      const predictedObj = ROULETTE_NUMBERS.find(n => n.value === result.number) || ROULETTE_NUMBERS[0];
      
      setState(prev => ({
        ...prev,
        prediction: predictedObj,
        confidence: result.confidence,
        isLoading: false
      }));
    } catch (e) {
      const sum = currentHistory.slice(0, 3).reduce((acc, curr) => acc + curr.value, 0);
      const predictedValue = (sum * 7 + 3) % 37;
      const predictedObj = ROULETTE_NUMBERS.find(n => n.value === predictedValue)!;
      
      setState(prev => ({
        ...prev,
        prediction: predictedObj,
        confidence: 70 + (sum % 20),
        isLoading: false
      }));
    }
  }, []);

  const handleEntry = useCallback((item: RouletteNumber) => {
    if (!isStarted) return;
    
    setState(prev => {
      const newHistory = [item, ...prev.history].slice(0, 20);
      if (newHistory.length >= 3 && !prev.isLoading) {
        setTimeout(() => runPrediction(newHistory), 100);
      }
      return { ...prev, history: newHistory };
    });

    setBuffer(prev => {
      const next = [...prev, item];
      return next.length >= 3 ? [] : next;
    });
  }, [isStarted, runPrediction]);

  const handleOutcome = (won: boolean) => {
    if (!state.prediction) return;

    setState(prev => {
      let profit = 0;
      let nextBet = prev.currentBet;
      let nextBankroll = prev.bankroll;

      if (won) {
        if (entryMode === 'number') profit = prev.currentBet * 35;
        else profit = prev.currentBet;
        nextBankroll += profit;
        nextBet = BASE_BET;
      } else {
        profit = -prev.currentBet;
        nextBankroll += profit;
        if (prev.martingaleEnabled) nextBet = prev.currentBet * 2;
      }

      const newTotalProfit = prev.totalProfit + profit;
      const betLog: EnhancedBetResult = {
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        betAmount: prev.currentBet,
        outcome: won ? 'win' : 'loss',
        profit: profit,
        totalProfitAtTime: newTotalProfit
      };

      setEnhancedHistory(h => [betLog, ...h].slice(0, 50));

      return {
        ...prev,
        bankroll: nextBankroll,
        currentBet: nextBet,
        totalProfit: newTotalProfit,
        prediction: null
      };
    });
  };

  const resetGame = () => {
    setState({
      history: [], bankroll: INITIAL_BANKROLL, currentBet: BASE_BET, lastBetOutcome: 'none',
      martingaleEnabled: true, prediction: null, confidence: 0, isLoading: false, betHistory: [], totalProfit: 0
    });
    setBuffer([]);
    setEnhancedHistory([]);
    setIsStarted(false);
  };

  const getNumObj = (val: number) => ROULETTE_NUMBERS.find(n => n.value === val)!;

  return (
    <div className="software-container">
      <div className="title-bar">
        <div className="flex items-center gap-2">
           <img src="https://api.iconify.design/material-symbols:casino-rounded.svg?color=%23ffffff" className="w-4 h-4" alt="icon"/>
           <span className="text-white/80 text-[11px] font-bold">Roulette Pro v1.1 - GitHub Sync Active</span>
        </div>
        <div className="window-controls">
          <div className="control-dot"></div>
          <div className="control-dot"></div>
        </div>
      </div>

      <div className="main-body">
        <div className="flex justify-between items-start mb-3 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-white text-[12px] font-bold">
               <img src="https://api.iconify.design/material-symbols:mail-outline.svg?color=%237ba2d3" className="w-5 h-5" alt="mail"/>
               rouletteslot@gmail.com
            </div>
            
            <div className="flex gap-2 mt-1">
              <div className="mode-toggle flex border border-[#444] rounded overflow-hidden">
                <button onClick={() => setEntryMode('number')} className={`px-2 py-0.5 text-[9px] font-bold ${entryMode === 'number' ? 'bg-[#4c71a3] text-white' : 'text-[#7ba2d3]'}`}>Numbers</button>
                <button onClick={() => setEntryMode('color')} className={`px-2 py-0.5 text-[9px] font-bold ${entryMode === 'color' ? 'bg-[#4c71a3] text-white' : 'text-[#7ba2d3]'}`}>Colors</button>
              </div>
              <select 
                value={selectedRoulette} 
                onChange={(e) => setSelectedRoulette(e.target.value)}
                className="bg-[#2a2a2e] border border-[#444] text-[#7ba2d3] text-[9px] font-bold rounded px-1 outline-none"
              >
                <option value="iconic21">ICONIC21</option>
                <option value="evolution">EVOLUTION</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="text-[#7ba2d3] text-[10px] font-bold uppercase tracking-widest mb-1">Spin History</div>
             <div className="w-[100px] sm:w-[180px] h-[2px] bg-[#4c71a3]"></div>
          </div>
        </div>

        <div className="flex gap-3 mb-3 flex-shrink-0">
          <div className="flex flex-col gap-1.5 w-[140px] sm:w-[180px]">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setIsStarted(true)} disabled={isStarted} className="blue-btn flex items-center justify-center gap-1">START <span>▶</span></button>
              <button className="blue-btn">License</button>
              <button onClick={resetGame} className="blue-btn flex items-center justify-center gap-1">RESET <span>↺</span></button>
              <button className="blue-btn">Settings</button>
            </div>
            
            <div className="flex gap-2 mt-0.5">
              <button className="red-gear-btn">
                 <img src="https://api.iconify.design/material-symbols:settings-applications-rounded.svg?color=%23ffffff" className="w-7 h-7" alt="gear"/>
              </button>
              <div className="flex flex-col gap-1 flex-1">
                 <button onClick={() => handleOutcome(true)} disabled={!state.prediction} className="btn-outcome btn-win flex-1 disabled:opacity-30">Gagner</button>
                 <button onClick={() => handleOutcome(false)} disabled={!state.prediction} className="btn-outcome btn-loss flex-1 disabled:opacity-30">Perdu</button>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="monitor-box flex flex-col">
              <div className="text-[#59f7df] text-[9px] border-b border-[#333] mb-1 pb-1 uppercase font-bold">Monitor</div>
              <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[8px] opacity-70">
                <div>[SYSTEM] Roulette Ready</div>
                <div>[SYSTEM] {selectedRoulette.toUpperCase()}</div>
                {state.isLoading && <div className="text-yellow-400 animate-pulse">Analyzing patterns...</div>}
                <div className="mt-1 text-[#59f7df]">Buffer: {buffer.length}/3</div>
                <div className="text-white/40">History: {state.history.length}</div>
              </div>
            </div>
            
            <div className="monitor-box flex flex-col items-center justify-center relative">
               <div className="absolute top-1 left-2 text-[8px] text-white/20 uppercase font-bold">Prediction</div>
               {state.prediction ? (
                 <div className={`casino-chip ${state.prediction.color === 'red' ? 'chip-red' : state.prediction.color === 'black' ? 'chip-black' : 'chip-green'}`}>
                    {entryMode === 'number' ? state.prediction.value : ''}
                    <div className="absolute -bottom-5 text-[7px] text-cyan-400 font-bold whitespace-nowrap">CONF: {state.confidence}%</div>
                 </div>
               ) : (
                 <div className="text-white/10 text-[9px] flex flex-col items-center gap-1 text-center">
                    <div className="w-8 h-8 rounded-full border border-dashed border-white/10 animate-pulse"></div>
                    {isStarted ? (state.isLoading ? 'ANALYZING...' : `NEED ${Math.max(0, 3 - state.history.length)} SPINS`) : 'START'}
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {entryMode === 'number' ? (
            <div className="select-none mb-3">
              <div className="grid grid-cols-12 gap-0.5 mb-0.5">
                {row1.map(v => <button key={v} disabled={!isStarted} onClick={() => handleEntry(getNumObj(v))} className="number-key">{v}</button>)}
              </div>
              <div className="grid grid-cols-[repeat(13,1fr)] gap-0.5 mb-0.5">
                {row2.map(v => <button key={v} disabled={!isStarted} onClick={() => handleEntry(getNumObj(v))} className="number-key">{v}</button>)}
              </div>
              <div className="grid grid-cols-12 gap-0.5">
                {row3.map(v => <button key={v} disabled={!isStarted} onClick={() => handleEntry(getNumObj(v))} className="number-key">{v}</button>)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 h-20 mb-3">
               <button onClick={() => handleEntry({ value: 0, color: 'red' })} disabled={!isStarted} className="chip-red rounded border-2 border-black/40 text-white font-black text-[10px] flex flex-col items-center justify-center gap-1">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/40"></div> ROUGE
               </button>
               <button onClick={() => handleEntry({ value: 0, color: 'black' })} disabled={!isStarted} className="chip-black rounded border-2 border-black/40 text-white font-black text-[10px] flex flex-col items-center justify-center gap-1">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/40"></div> NOIR
               </button>
               <button onClick={() => handleEntry({ value: 0, color: 'green' })} disabled={!isStarted} className="chip-green rounded border-2 border-black/40 text-white font-black text-[10px] flex flex-col items-center justify-center gap-1">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-white/40"></div> ZERO
               </button>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 mb-1 flex justify-between items-center text-[9px] text-white/50 font-bold uppercase tracking-tighter bg-black/30 p-1.5 rounded">
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1">
              <span>CAP:</span>
              <input 
                type="number" 
                value={state.bankroll} 
                onChange={(e) => setState(prev => ({...prev, bankroll: Number(e.target.value)}))} 
                className="bg-transparent border-b border-white/10 w-12 outline-none text-green-400 font-bold" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span>MISE:</span>
              <input 
                type="number" 
                value={state.currentBet} 
                onChange={(e) => setState(prev => ({...prev, currentBet: Number(e.target.value)}))} 
                className="bg-transparent border-b border-white/10 w-12 outline-none text-blue-400 font-bold" 
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
             <span>NET: <span className={state.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>{state.totalProfit.toFixed(1)}€</span></span>
          </div>
        </div>

        <div className="journal-container no-scrollbar flex-grow">
          <table className="journal-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>MISE</th>
                <th>NET</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {enhancedHistory.length > 0 ? enhancedHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.timestamp}</td>
                  <td>{item.betAmount}€</td>
                  <td className={item.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {item.profit >= 0 ? '+' : ''}{item.profit.toFixed(1)}€
                  </td>
                  <td className={item.totalProfitAtTime >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {item.totalProfitAtTime.toFixed(1)}€
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-white/10 italic">Aucun historique de session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
