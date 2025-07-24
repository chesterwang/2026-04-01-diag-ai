import { randomUUID } from 'crypto';
import mermaid from 'mermaid';
import { FC, useEffect } from 'react';
type Props = {
    chart: string
}

export const MermaidDiagram: FC<Props> = ({ chart }) => {
    const id = Math.random().toString(16).slice(2)
    mermaid.initialize({ startOnLoad: true })
    useEffect(() => {
        console.log('chart :>> ', chart);
        if (chart) {
            console.log('triggered')
            mermaid.contentLoaded()
        }
    }, [chart])
    return (
        <pre id={id} className="mermaid">
            {chart}
        </pre>
    )
}