import React, { Suspense } from 'react';
import './App.less';
import { ConnectionProvider } from './utils/connection';
import { WalletProvider } from './utils/wallet';
import { Spin } from 'antd';
import ErrorBoundary from './components/ErrorBoundary';
import { Routes } from './routes';
import { PreferencesProvider } from './utils/preferences';
import { ReferrerProvider } from './utils/referrer';
import { ThemeSwitcherProvider } from 'react-css-theme-switcher';
import Particles from "react-tsparticles";

export default function App() {
  // Default variable
  localStorage.setItem('snow', JSON.stringify({status: false, enable: false}));
  let theme = {mode:'dark'};

  // Get data from localstorage
  const saved = localStorage.getItem('theme');
  if (saved) {
    theme = JSON.parse(saved);
  } else {
    localStorage.setItem('theme', JSON.stringify({mode: 'dark'}));
  }

  // Location off css file
  const themes = {
    light: './theme/antd.min.css',
    dark: './theme/antd.dark.min.css',
  };

  const ParticlesBg = () => {
    const [showResults, setShowResults] = React.useState(false);
    setInterval(() => {
      const saved_snow = localStorage.getItem('snow');
      if (saved_snow) {
        setShowResults(JSON.parse(saved_snow).status);
      } else {
        localStorage.setItem('snow', JSON.stringify({status: false, enable: false}));
      }
    }, 1000);
    return (
      showResults ? 
        <Particles
          id="tsparticles"
          className="bg-snow"
          url="theme/snow.json"
          style={{position: 'absolute', zIndex: -1}}
          options={{
            fpsLimit: 90
          }}
        />
      : null
    )
  }
  return (
    <ThemeSwitcherProvider defaultTheme={theme.mode} themeMap={themes}>
      <Suspense fallback={() => <Spin size="large" />}>
        <ParticlesBg />
        <ErrorBoundary>
          <ConnectionProvider>
            <ReferrerProvider>
              <WalletProvider>
                <PreferencesProvider>
                  <Suspense fallback={() => <Spin size="large" />}>
                    <Routes />
                  </Suspense>
                </PreferencesProvider>
              </WalletProvider>
            </ReferrerProvider>
          </ConnectionProvider>
        </ErrorBoundary>
      </Suspense>
    </ThemeSwitcherProvider>
  );
}
