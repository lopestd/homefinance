import React from 'react';

/**
 * TabNavigation - Navegação por tabs para relatórios
 * @param {Array} tabs - Array de tabs [{ id: 'resumo', label: 'Resumo' }, ...]
 * @param {string} activeTab - ID da tab ativa
 * @param {function} onTabChange - Callback ao mudar de tab
 */
const TabNavigation = ({ tabs = [], activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-navigation__item ${activeTab === tab.id ? 'tab-navigation__item--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span className="tab-navigation__icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
