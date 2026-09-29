import React, { useState } from 'react';

export default function PesquisaCidade({ onSearch }) {
  const [term, setTerm] = useState('');

  const handleChange = (e) => {
    setTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="search-box-container">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar cidade ou bacia..."
          value={term}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
