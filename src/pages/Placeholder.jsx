import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools } from '@fortawesome/free-solid-svg-icons';

const Placeholder = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-50">
      <FontAwesomeIcon icon={faTools} size="3x" className="mb-4" />
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md">{message || "This feature is coming soon."}</p>
    </div>
  );
};

export default Placeholder;
