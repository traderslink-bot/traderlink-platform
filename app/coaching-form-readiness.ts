"use client";
import {useSyncExternalStore} from 'react';
const subscribe=()=>()=>{};
const ready=()=>true,serverPending=()=>false;
/** Prevent native fallback submission before the client submit handler exists. */
export function useCoachingFormReady(){return useSyncExternalStore(subscribe,ready,serverPending);}
