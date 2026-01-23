import React from 'react';
import styled from 'styled-components';

const Loader = ({ cycles = 'infinite', onComplete }) => {
  const handleAnimationEnd = () => {
    if (onComplete && cycles !== 'infinite') {
      onComplete();
    }
  };

  return (
    <StyledWrapper $cycles={cycles}>
      <div className="loaderContainer">
        <img src="/images/Logo.svg" alt="Sakthi Auto Logo" className="logo" />
        <div className="textWrapper">
          <p className="text">Sakthi Auto</p>
          <div className="invertbox" onAnimationEnd={handleAnimationEnd} />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;

  .loaderContainer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: fit-content;
  }

  .logo {
    height: 6rem;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
  }

  .textWrapper {
    height: fit-content;
    min-width: 2rem;
    width: fit-content;
    font-size: 6rem;
    font-weight: 700;
    letter-spacing: 0.25ch;
    position: relative;
    z-index: 0;
    color: #1e293b;
    display: flex;
    align-items: center;
  }

  .text {
    margin: 0;
    line-height: 1;
    height: 6rem;
    display: flex;
    align-items: center;
    white-space: nowrap;
  }

  .invertbox {
    position: absolute;
    height: 100%;
    aspect-ratio: 1/1;
    left: 0;
    top: 0;
    border-radius: 20%;
    background-color: #1e293b;
    mix-blend-mode: difference;
    animation-name: move;
    animation-duration: 2s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: ${props => props.$cycles || 'infinite'};
    animation-fill-mode: forwards;
  }

  @keyframes move {
    0% {
      left: 0;
    }
    50% {
      left: calc(100% - 6rem);
    }
    100% {
      left: 0;
    }
  }
`;

export default Loader;
