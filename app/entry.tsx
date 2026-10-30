"use client";
import {useEffect,useState} from 'react';
import Academy from './academy';
import Battle from './battle';
export default function Entry(){const [room,setRoom]=useState(false);useEffect(()=>{setRoom(new URLSearchParams(window.location.search).has('room'));},[]);return room?<Battle/>:<Academy/>;}
