import React from "react";
import { Toast } from "./Toast";
import { useToast } from "./ToastContext";
export const ToastContainer: React.FC = () => {
  const {
    toasts,
    removeToast
  } = useToast();
  return <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col-reverse items-center">
      <div className="relative w-full max-w-[800px] mx-auto">
        {toasts.map((toast, index) => {
        const offset = index * 16;
        const rotation = index * 0.5 - toasts.length * 0.25;
        const translateX = index * 16;
        const translateY = -offset;
        const scale = 1 - index * 0.005;
        return <div key={toast.id} className="absolute bottom-0 left-0 right-0 origin-bottom-left" style={{
          transform: `
                  translate3d(${translateX}px, ${translateY}px, 0)
                  rotate(${rotation}deg)
                  scale(${scale})
                `,
          zIndex: toasts.length - index
        }}>
              <Toast id={toast.id} type={toast.type} message={toast.message} title={toast.title} onClose={removeToast} isStacked={index > 0} />
            </div>;
      })}
      </div>
    </div>;
};