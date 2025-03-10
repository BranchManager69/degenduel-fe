import React from "react";
import { ToastProvider } from "./components/toast/ToastContext";
import { ToastContainer } from "./components/toast/ToastContainer";
import { MainContent } from "./components/MainContent";
export function App() {
  return <ToastProvider>
      <MainContent />
      <ToastContainer />
    </ToastProvider>;
}