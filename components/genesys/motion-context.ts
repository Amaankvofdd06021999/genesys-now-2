'use client';
import { createContext, useContext } from 'react';

// Lives in its own module so components imported by the shell can read it without a circular import.
export const MotionContext = createContext(true);
export const useMotion = () => useContext(MotionContext);
