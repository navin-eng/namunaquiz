
export const generatePIN = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const getMedalColor = (rank: number) => {
    switch (rank) {
        case 0: return 'text-yellow-400';
        case 1: return 'text-slate-300';
        case 2: return 'text-amber-600';
        default: return 'text-slate-500';
    }
}
