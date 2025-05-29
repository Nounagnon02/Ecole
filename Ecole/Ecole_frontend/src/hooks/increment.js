import { useState } from "react";

export function useIncrement(duration){
    const [value, Setvalue] = useState(duration)
    const Decrement = (duration) =>Setvalue(v=>v-1)
    const Increment = (duration) => Setvalue(v=>v+1)

    return [value, Decrement, Increment]
}