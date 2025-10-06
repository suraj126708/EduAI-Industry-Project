import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Loader = ({ steps = [] }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (steps.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 2000); // step change every 2s
    return () => clearInterval(interval);
  }, [steps]);

  return (
    <StyledWrapper>
      <div className="loading-wave">
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
        <div className="loading-bar" />
      </div>

      {steps.length > 0 && (
        <div key={currentStepIndex} className="fade-text">
          {steps[currentStepIndex].label}
        </div>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(6px) saturate(120%);
  -webkit-backdrop-filter: blur(6px) saturate(120%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: all;

  .loading-wave {
    width: 200px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .loading-bar {
    width: 15px;
    height: 10px;
    margin: 0 4px;
    /* Darker blue gradient */
    background: linear-gradient(180deg, #1e40af, #1e3a8a);
    border-radius: 4px;
    animation: wave 1s ease-in-out infinite;
  }

  .loading-bar:nth-child(2) {
    animation-delay: 0.1s;
  }
  .loading-bar:nth-child(3) {
    animation-delay: 0.2s;
  }
  .loading-bar:nth-child(4) {
    animation-delay: 0.3s;
  }

  @keyframes wave {
    0% {
      height: 10px;
      opacity: 0.6;
    }
    50% {
      height: 50px;
      opacity: 1;
    }
    100% {
      height: 10px;
      opacity: 0.6;
    }
  }

  .fade-text {
    margin-top: 20px;
    font-size: 16px;
    font-weight: 500;
    /* Dark blue text color */
    color: #1e40af;
    animation: fadeInOut 2s ease-in-out;
    letter-spacing: 0.5px;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translateY(5px);
    }
    25% {
      opacity: 1;
      transform: translateY(0);
    }
    75% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-5px);
    }
  }
`;
export default Loader;
