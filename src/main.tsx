import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createIdbRepository } from './data/idbRepository';
import { createNutritionRepository } from './nutrition/data/repository';
import { NutritionProvider } from './nutrition/state/NutritionProvider';
import { RestTimerProvider } from './state/restTimer';
import { StoreProvider } from './state/store';
import { syncThemeAcrossTabs } from './state/theme';
import './styles/tokens.css';
import './styles/app.css';
import './styles/nutrition.css';

syncThemeAcrossTabs();

const repository = createIdbRepository();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider repository={repository}>
      <NutritionProvider repository={createNutritionRepository()}>
        <RestTimerProvider>
          <App />
        </RestTimerProvider>
      </NutritionProvider>
    </StoreProvider>
  </StrictMode>,
);
