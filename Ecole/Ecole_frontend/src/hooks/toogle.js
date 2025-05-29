import { useState } from "react";

export function useToogle(first_value){
    const [state, Setstate] = useState(first_value)
    const Toogle = ()=>Setstate(f=>!f)
    return [state, Toogle]
}