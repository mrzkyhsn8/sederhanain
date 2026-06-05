
export interface Komponen {
    label: string;
    analogi: string;
    svgNormal: string;
    svgBroken: string;
}

export interface Langkah {
    kode: string;
    judul: string;
    ibaratnya: string;
    kenyataannya: string;
    nodeStates: boolean[];
    connections: string[];
}

export interface SederhanainData {
    tema: string;
    deskripsi: string;
    komponen: Komponen[];
    langkah: Langkah[];
}

export interface HistoryItem {
    concept: string;
    data: SederhanainData;
    timestamp: number;
}