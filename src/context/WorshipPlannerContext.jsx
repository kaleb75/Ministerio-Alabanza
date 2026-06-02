import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { recommendSet, scoreWorshipFlow } from '../services/worshipFlowEngine';

const WorshipPlannerContext = createContext(null);

export function WorshipPlannerProvider({ children }) {
  const { songs, songHistory } = useApp();

  const [serviceType, setServiceType]   = useState('Culto Principal');
  const [setSize, setSetSize]           = useState(4);
  const [themeTag, setThemeTag]         = useState('');
  const [currentSet, setCurrentSet]     = useState([]);
  const [suggestions, setSuggestions]   = useState([]);

  const generateSet = useCallback(() => {
    const recs = recommendSet({ songs, songHistory, serviceType, setSize, themeTag, excludeIds: currentSet });
    setSuggestions(recs);
  }, [songs, songHistory, serviceType, setSize, themeTag, currentSet]);

  const addToSet = useCallback((songId) => {
    setCurrentSet(prev => (prev.includes(songId) || prev.length >= 8) ? prev : [...prev, songId]);
  }, []);

  const removeFromSet = useCallback((songId) => {
    setCurrentSet(prev => prev.filter(id => id !== songId));
  }, []);

  const moveInSet = useCallback((index, dir) => {
    setCurrentSet(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const clearSet = useCallback(() => {
    setCurrentSet([]);
    setSuggestions([]);
  }, []);

  const flowScore  = useMemo(() => scoreWorshipFlow(currentSet, songs), [currentSet, songs]);
  const setDetails = useMemo(() => currentSet.map(id => songs.find(s => s.id === id)).filter(Boolean), [currentSet, songs]);

  return (
    <WorshipPlannerContext.Provider value={{
      serviceType, setServiceType,
      setSize, setSetSize,
      themeTag, setThemeTag,
      currentSet, addToSet, removeFromSet, moveInSet, clearSet,
      suggestions, generateSet,
      flowScore, setDetails,
    }}>
      {children}
    </WorshipPlannerContext.Provider>
  );
}

export function useWorshipPlanner() {
  const ctx = useContext(WorshipPlannerContext);
  if (!ctx) throw new Error('useWorshipPlanner must be inside WorshipPlannerProvider');
  return ctx;
}

export default WorshipPlannerContext;
