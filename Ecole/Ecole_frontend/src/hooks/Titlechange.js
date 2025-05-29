import { useEffect } from "react";

export function useDocumenttitle(title){
    useEffect(() => {
        const original_tilte = document.title
        return () => {
            document.title = original_tilte
        }
    }, [])
    useEffect(() =>{
        document.title = title
    }, [title])
}