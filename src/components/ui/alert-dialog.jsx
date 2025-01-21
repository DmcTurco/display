import * as React from "react";

const AlertDialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        {children}
      </div>
    </div>
  );
};

const AlertDialogContent = ({ children, className = "" }) => {
  return (
    <div className={`w-full max-w-lg rounded-lg bg-white p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

const AlertDialogHeader = ({ children, className = "" }) => {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
};

const AlertDialogFooter = ({ children, className = "" }) => {
  return (
    <div className={`mt-6 flex justify-end space-x-2 ${className}`}>
      {children}
    </div>
  );
};

const AlertDialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
};

const AlertDialogDescription = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      {children}
    </p>
  );
};

const AlertDialogAction = ({ children, onClick, className = "" }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children, onClick, className = "" }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};