"use client";
import {useEffect,useState} from 'react';
import Dashboard from './dashboard';
import Battle from './battle';
export default function Entry(){const [room,setRoom]=useState(false);useEffect(()=>{setRoom(new URLSearchParams(window.location.search).has('room'));},[]);return room?<Battle/>:<Dashboard/>;}
