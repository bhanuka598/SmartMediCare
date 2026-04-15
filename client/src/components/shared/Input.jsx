import React, { forwardRef, useId } from 'react';

export const Input = forwardRef(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm 
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-red-500">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">
            {helperText}
          </p>
        )}

      </div>
    );
  }
);

Input.displayName = 'Input';
